import { kv } from "@vercel/kv";
import type { AuditReport, PipelineState, PipelineStatus } from "./types";

// In-memory fallback for local dev or when KV isn't provisioned.
const memStore: Map<string, PipelineState> =
  (globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore ?? new Map();
(globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore = memStore;

const KV_AVAILABLE = Boolean(
  process.env.KV_REST_API_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL,
);

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
  if (KV_AVAILABLE) {
    try {
      const value = await kv.get<PipelineState>(k(auditId));
      return value ?? undefined;
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
  if (KV_AVAILABLE) {
    try {
      // Sorted set of audit IDs by created-at (negative ts for desc).
      const ids = await kv.zrange<string[]>(INDEX_KEY, 0, limit - 1);
      if (ids.length === 0) return [];
      const states = await Promise.all(ids.map((id) => kv.get<PipelineState>(k(id))));
      return states.filter((s): s is PipelineState => Boolean(s));
    } catch {
      // fall through
    }
  }
  return [...memStore.values()]
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
