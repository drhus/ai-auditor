import crypto from "node:crypto";
import type {
  AuditInput,
  AuditReport,
  FetchResult,
  GradeResult,
  MapResult,
  ReconResult,
  RegulationPack,
  ScopeResult,
  VerifyResult,
} from "../types";

interface ReportArgs {
  input: AuditInput;
  fetch: FetchResult;
  recon: ReconResult;
  scope: ScopeResult;
  map: MapResult;
  checks: VerifyResult[];
  grade: GradeResult;
  packs: RegulationPack[];
  checkerVersion: string;
  startedAt: string;
}

export function buildReport(a: ReportArgs): AuditReport {
  const completedAt = new Date().toISOString();
  const durationMs = Date.parse(completedAt) - Date.parse(a.startedAt);

  // Externals — clauses we cannot auto-score
  const externalControls = a.checks
    .filter((c) => c.verdict === "external")
    .map((c) => ({
      clauseId: c.clauseId,
      article: c.article,
      title: c.title,
      note: c.rationale,
    }));

  const regulationsVersions: Record<string, string> = {};
  for (const p of a.packs) {
    if (a.scope.regulationIds.includes(p.id)) {
      regulationsVersions[p.id] = p.packSha;
    }
  }

  // Bundle hash — canonical JSON of the parts that should be reproducible.
  const bundleCanon = canonicaliseForHash({
    repoUrl: a.fetch.repoUrl,
    commitSha: a.fetch.commitSha,
    regulationsVersions,
    checkerVersion: a.checkerVersion,
    map: { classification: a.map.classification, annexIii: a.map.annexIiiCategories, art50: a.map.art50Triggers },
    checks: a.checks
      .map((c) => ({
        clauseId: c.clauseId,
        verdict: c.verdict,
        score: c.score,
        rawScore: c.rawScore,
      }))
      .sort((x, y) => x.clauseId.localeCompare(y.clauseId)),
  });
  const bundleHash = crypto.createHash("sha256").update(bundleCanon).digest("hex");

  return {
    auditId: a.input.auditId,
    source: a.input.source,
    input: a.input,
    fetch: a.fetch,
    recon: a.recon,
    scope: a.scope,
    map: a.map,
    checks: a.checks,
    grade: a.grade,
    bundleHash,
    checkerVersion: a.checkerVersion,
    regulationsVersions,
    startedAt: a.startedAt,
    completedAt,
    durationMs,
    externalControls,
  };
}

function canonicaliseForHash(o: unknown): string {
  return JSON.stringify(o, (_k, v) => {
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const keys = Object.keys(v as Record<string, unknown>).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = (v as Record<string, unknown>)[k];
      return out;
    }
    return v;
  });
}
