import { fetchRepo, FetchError } from "./stages/fetch";
import { runRecon } from "./stages/recon";
import { runScope } from "./stages/scope";
import { runMap } from "./stages/map";
import { runCheck } from "./stages/check";
import { runVerify } from "./stages/verify";
import { runGrade } from "./stages/grade";
import { buildReport } from "./stages/report";
import { loadRegulationPacks } from "./loader";
import { updateState } from "./store";
import { noopEmitter, type OnAuditEvent } from "./events";
import type { AuditInput, AuditReport, SignalId, SignalResult } from "./types";

// Bumped by hand for now. Future: derive from git SHA of pipeline/ at build time.
export const CHECKER_VERSION = "v0.1.0";

export async function runAudit(
  input: AuditInput,
  onEvent: OnAuditEvent = noopEmitter,
): Promise<AuditReport> {
  const startedAt = new Date().toISOString();
  if (input.source.kind !== "repo") {
    throw new Error("Only repo-source audits are supported by the V0 pipeline");
  }

  onEvent({ kind: "ready", auditId: input.auditId, startedAt });

  // ---------- FETCH ----------
  emitStageStart(onEvent, "fetch", `${input.source.owner}/${input.source.repo}`);
  await updateState(input.auditId, { status: "fetching", progressNote: "Cloning repository tarball" });
  const tFetch = Date.now();
  onEvent({ kind: "log", stage: "fetch", text: `Resolving default branch for ${input.source.owner}/${input.source.repo}…` });
  const fetchResult = await fetchRepo({
    owner: input.source.owner,
    repo: input.source.repo,
    ref: input.ref,
    auditId: input.auditId,
  });
  onEvent({ kind: "log", stage: "fetch", text: `Pinned commit ${fetchResult.commitSha.slice(0, 12)}` , tone: "ok" });
  onEvent({ kind: "log", stage: "fetch", text: `Extracted ${fetchResult.fileCount.toLocaleString()} files · ${formatBytes(fetchResult.totalBytes)}` });
  const topLangs = Object.entries(fetchResult.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([l, b]) => `${l} ${formatBytes(b)}`);
  if (topLangs.length) {
    onEvent({ kind: "log", stage: "fetch", text: `Top languages: ${topLangs.join(" · ")}`, tone: "muted" });
  }
  const invHits = inventoryHighlights(fetchResult.inventory);
  for (const note of invHits) {
    onEvent({ kind: "log", stage: "fetch", text: note, tone: "ok" });
  }
  emitStageComplete(onEvent, "fetch", Date.now() - tFetch);

  // ---------- RECON ----------
  emitStageStart(onEvent, "recon", `${fetchResult.fileCount} files`);
  await updateState(input.auditId, {
    status: "recon",
    progressNote: `Scanning ${fetchResult.fileCount} files for AI-system signals`,
  });
  const tRecon = Date.now();
  onEvent({ kind: "log", stage: "recon", text: `Running 21 signal detectors across source tree…` });
  const reconResult = await runRecon(fetchResult);
  const firedSignals = (Object.values(reconResult.signals) as SignalResult[]).filter((s) => s.fired);
  for (const s of firedSignals) {
    const label = describeSignal(s.signal as SignalId, s);
    onEvent({
      kind: "signal",
      signal: s.signal as SignalId,
      fired: true,
      strength: s.strength,
      hits: s.evidence.length,
      label,
    });
  }
  if (firedSignals.length === 0) {
    onEvent({ kind: "log", stage: "recon", text: `No AI-system signals detected.`, tone: "warn" });
  } else {
    onEvent({ kind: "log", stage: "recon", text: `${firedSignals.length} signals fired (of 21).`, tone: "ok" });
  }
  emitStageComplete(onEvent, "recon", Date.now() - tRecon);

  // ---------- SCOPE ----------
  emitStageStart(onEvent, "scope");
  await updateState(input.auditId, { status: "scope" });
  const scopeResult = runScope(input);
  for (const r of scopeResult.regulationIds) {
    onEvent({ kind: "log", stage: "scope", text: `Pack in scope: ${r}` });
  }
  emitStageComplete(onEvent, "scope");

  // ---------- MAP ----------
  emitStageStart(onEvent, "map");
  await updateState(input.auditId, { status: "map" });
  const packs = await loadRegulationPacks(input.regulations);
  for (const pack of packs) {
    onEvent({
      kind: "log",
      stage: "map",
      text: `Loaded ${pack.fullName} (${pack.clauses.length} clauses, v${pack.version})`,
      tone: "muted",
    });
  }
  const mapResult = runMap(reconResult, packs);
  onEvent({
    kind: "classification",
    classification: mapResult.classification,
    annexIii: mapResult.annexIiiCategories,
    art50: mapResult.art50Triggers,
    rationale: mapResult.rationale,
  });
  for (const line of mapResult.rationale) {
    onEvent({ kind: "log", stage: "map", text: line });
  }
  emitStageComplete(onEvent, "map");

  // ---------- CHECK ----------
  emitStageStart(onEvent, "check");
  await updateState(input.auditId, {
    status: "check",
    progressNote: `Risk class: ${mapResult.classification} — running clause checkers`,
  });
  const tCheck = Date.now();
  onEvent({ kind: "log", stage: "check", text: `Running deterministic checkers on every in-scope clause…` });
  const checkResults = await runCheck(fetchResult, reconResult, scopeResult, mapResult, packs);
  for (const r of checkResults) {
    if (r.verdict === "n/a" || r.verdict === "external") continue;
    onEvent({
      kind: "clause",
      clauseId: r.clauseId,
      regulationId: r.regulationId,
      article: r.article,
      title: r.title,
      verdict: r.verdict,
      score: Number.isFinite(r.score) ? r.score : 0,
      rawScore: Number.isFinite(r.rawScore) ? r.rawScore : 0,
      rulesMatched: r.rules.filter((x) => x.matched >= 0.5).length,
      rulesTotal: r.rules.length,
    });
  }
  const naCount = checkResults.filter((r) => r.verdict === "n/a").length;
  const extCount = checkResults.filter((r) => r.verdict === "external").length;
  onEvent({
    kind: "log",
    stage: "check",
    text: `${checkResults.length - naCount - extCount} numeric verdicts · ${extCount} external · ${naCount} n/a`,
    tone: "muted",
  });
  emitStageComplete(onEvent, "check", Date.now() - tCheck);

  // ---------- VERIFY ----------
  emitStageStart(onEvent, "verify");
  await updateState(input.auditId, { status: "verify" });
  const verifyResults = runVerify(checkResults);
  const ambiguous = verifyResults.filter((v) => v.needsLlmJudge).length;
  onEvent({
    kind: "log",
    stage: "verify",
    text: ambiguous > 0
      ? `${ambiguous} clauses landed in ambiguous band — flagged for LLM judge (V1).`
      : `No ambiguous clauses — deterministic verdicts stand.`,
    tone: ambiguous > 0 ? "warn" : "ok",
  });
  emitStageComplete(onEvent, "verify");

  // ---------- GRADE ----------
  emitStageStart(onEvent, "grade");
  await updateState(input.auditId, { status: "grade" });
  const gradeResult = runGrade(verifyResults);
  onEvent({ kind: "score", overall: gradeResult.overallScore, perRegulation: gradeResult.perRegulation });
  onEvent({
    kind: "log",
    stage: "grade",
    text: `Overall score: ${gradeResult.overallScore.toFixed(2)} / 4`,
    tone: gradeResult.overallScore >= 3 ? "ok" : gradeResult.overallScore >= 2 ? "warn" : "warn",
  });
  emitStageComplete(onEvent, "grade");

  // ---------- REPORT ----------
  emitStageStart(onEvent, "report");
  await updateState(input.auditId, { status: "reporting" });
  const report = buildReport({
    input,
    fetch: fetchResult,
    recon: reconResult,
    scope: scopeResult,
    map: mapResult,
    checks: verifyResults,
    grade: gradeResult,
    packs,
    checkerVersion: CHECKER_VERSION,
    startedAt,
  });
  onEvent({ kind: "log", stage: "report", text: `Bundle hash ${report.bundleHash.slice(0, 16)}…`, tone: "muted" });
  emitStageComplete(onEvent, "report");

  await updateState(input.auditId, { status: "completed", report });
  onEvent({ kind: "report", report });
  return report;
}

function emitStageStart(onEvent: OnAuditEvent, stage: StageNameLite, note?: string) {
  onEvent({ kind: "stage", stage, phase: "start", at: new Date().toISOString(), note });
}
function emitStageComplete(onEvent: OnAuditEvent, stage: StageNameLite, durationMs?: number) {
  onEvent({ kind: "stage", stage, phase: "complete", at: new Date().toISOString(), durationMs });
}

type StageNameLite = "fetch" | "recon" | "scope" | "map" | "check" | "verify" | "grade" | "report";

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function inventoryHighlights(inv: import("./types").FileInventory): string[] {
  const out: string[] = [];
  if (inv.hasReadme) out.push("README present");
  if (inv.hasLicense) out.push("LICENSE present");
  if (inv.hasModelCard) out.push("MODEL_CARD present");
  if (inv.hasRiskRegister) out.push("RISK_REGISTER present");
  if (inv.hasThreatModel) out.push("THREAT_MODEL present");
  if (inv.hasSecurityMd) out.push("SECURITY.md present");
  if (inv.hasCiWorkflows) out.push("CI workflows present");
  if (inv.hasEvalDir) out.push("evals/ dir present");
  if (inv.hasTestsDir) out.push("tests/ dir present");
  return out;
}

function describeSignal(id: SignalId, s: SignalResult): string {
  const labels: Partial<Record<SignalId, string>> = {
    agent_framework: "Agent framework detected",
    model_usage: "LLM call site",
    logging_hooks: "Structured logging",
    oversight_hooks: "Human oversight / kill-switch",
    eval_artefacts: "Evaluation harness",
    governance_docs: "Governance docs",
    cybersec_hooks: "Cybersecurity controls",
    provenance_hooks: "Content provenance / watermark",
    data_io: "External data I/O",
    pii_signals: "PII handling",
    bio_health_signals: "Health / clinical data",
    employment_signals: "Employment / HR",
    bio_metric_signals: "Biometrics",
    education_signals: "Education / assessment",
    law_enforcement_signals: "Law enforcement",
    migration_signals: "Migration / borders",
    justice_signals: "Justice / democratic processes",
    essential_services_signals: "Essential services",
    critical_infra_signals: "Critical infrastructure",
    content_generation_signals: "Content generation",
    emotion_recognition_signals: "Emotion recognition",
  };
  const label = labels[id] ?? id;
  const detail = uniqueDetails(s);
  return detail ? `${label} — ${detail}` : label;
}

function uniqueDetails(s: SignalResult): string {
  const set = new Set<string>();
  for (const ev of s.evidence) {
    if (ev.detail) set.add(ev.detail);
    if (set.size >= 3) break;
  }
  return Array.from(set).join(", ");
}

export { FetchError };
