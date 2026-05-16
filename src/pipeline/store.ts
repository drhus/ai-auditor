import { kv } from "@vercel/kv";
import { SEED_AUDITS } from "@/data/seed-audits";
import type { AuditReport, PipelineState, PipelineStatus } from "./types";

// In-memory fallback for local dev or when KV isn't provisioned.
const memStore: Map<string, PipelineState> =
  (globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore ?? new Map();
(globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore = memStore;

const KV_AVAILABLE = Boolean(
  process.env.KV_REST_API_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL,
);

// Static seed audits bundled with the deploy — real reports produced by
// running the pipeline against well-known agent repos. Loaded into memStore
// at module init so /audits is never empty even when KV isn't provisioned.
let seedsLoaded = false;
function ensureSeedsLoaded() {
  if (seedsLoaded) return;
  seedsLoaded = true;
  for (const report of SEED_AUDITS) {
    if (!report?.auditId || !report?.bundleHash) continue;
    if (memStore.has(report.auditId)) continue;
    memStore.set(report.auditId, {
      auditId: report.auditId,
      status: "completed",
      startedAt: report.startedAt ?? new Date(0).toISOString(),
      updatedAt: report.completedAt ?? new Date(0).toISOString(),
      report,
    });
  }
}

// Key shapes
const k = (id: string) => `audit:${id}`;
const INDEX_KEY = "audit:index";   // sorted list of audit IDs by createdAt

export async function createState(auditId: string): Promise<PipelineState> {
  const now = new Date().toISOString();
  const s: PipelineState = {
    auditId,
    status: "queued",
    startedAt: now,
    updatedAt: now,
  };
  await writeState(auditId, s, { isNew: true });
  return s;
}

export async function updateState(
  auditId: string,
  patch: Partial<Omit<PipelineState, "auditId" | "startedAt">>,
): Promise<PipelineState | undefined> {
  const prev = await getState(auditId);
  if (!prev) return undefined;
  const next: PipelineState = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeState(auditId, next);
  return next;
}

export async function getState(auditId: string): Promise<PipelineState | undefined> {
  ensureSeedsLoaded();
  if (KV_AVAILABLE) {
    try {
      const value = await kv.get<PipelineState>(k(auditId));
      if (value) return value;
    } catch {
      // fall through to memory
    }
  }
  return memStore.get(auditId);
}

export async function setError(
  auditId: string,
  error: string,
): Promise<PipelineState | undefined> {
  return updateState(auditId, { status: "failed", error });
}

export async function setReport(
  auditId: string,
  report: AuditReport,
): Promise<PipelineState | undefined> {
  return updateState(auditId, { status: "completed", report });
}

export async function listRecent(limit = 50): Promise<PipelineState[]> {
  ensureSeedsLoaded();
  const kvStates: PipelineState[] = [];
  if (KV_AVAILABLE) {
    try {
      const ids = await kv.zrange<string[]>(INDEX_KEY, 0, limit - 1);
      if (ids.length > 0) {
        const states = await Promise.all(ids.map((id) => kv.get<PipelineState>(k(id))));
        kvStates.push(...states.filter((s): s is PipelineState => Boolean(s)));
      }
    } catch {
      // fall through
    }
  }
  // Merge KV + memory + seeds, dedupe by auditId, sort desc by updatedAt.
  const merged = new Map<string, PipelineState>();
  for (const s of [...memStore.values(), ...kvStates]) {
    merged.set(s.auditId, s);
  }
  return [...merged.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

async function writeState(
  auditId: string,
  state: PipelineState,
  opts: { isNew?: boolean } = {},
) {
  memStore.set(auditId, state);
  if (KV_AVAILABLE) {
    try {
      await kv.set(k(auditId), state);
      if (opts.isNew) {
        // Sorted set: score = -timestamp so newest sorts first via zrange(0, n).
        const score = -new Date(state.startedAt).getTime();
        await kv.zadd(INDEX_KEY, { score, member: auditId });
      }
    } catch {
      /* swallow */
    }
  }
}

export type { PipelineStatus };
