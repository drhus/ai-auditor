import type { PipelineState, PipelineStatus, AuditReport } from "./types";

// In-memory store keyed by audit ID. Process-local; replaced by Vercel KV /
// Postgres in V1.
const store: Map<string, PipelineState> = (globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore ?? new Map();
(globalThis as unknown as { __aaStore?: Map<string, PipelineState> }).__aaStore = store;

export function createState(auditId: string): PipelineState {
  const now = new Date().toISOString();
  const s: PipelineState = {
    auditId,
    status: "queued",
    startedAt: now,
    updatedAt: now,
  };
  store.set(auditId, s);
  return s;
}

export function updateState(
  auditId: string,
  patch: Partial<Omit<PipelineState, "auditId" | "startedAt">>,
): PipelineState | undefined {
  const prev = store.get(auditId);
  if (!prev) return undefined;
  const next: PipelineState = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.set(auditId, next);
  return next;
}

export function getState(auditId: string): PipelineState | undefined {
  return store.get(auditId);
}

export function setError(auditId: string, error: string): PipelineState | undefined {
  return updateState(auditId, { status: "failed", error });
}

export function setReport(auditId: string, report: AuditReport): PipelineState | undefined {
  return updateState(auditId, { status: "completed", report });
}

export function listRecent(limit = 50): PipelineState[] {
  return [...store.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export type { PipelineStatus };
