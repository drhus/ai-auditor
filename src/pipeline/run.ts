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
import type { AuditInput, AuditReport } from "./types";

// Bumped by hand for now. Future: derive from git SHA of pipeline/ at build time.
export const CHECKER_VERSION = "v0.1.0";

export async function runAudit(input: AuditInput): Promise<AuditReport> {
  const startedAt = new Date().toISOString();
  if (input.source.kind !== "repo") {
    // 8004 agents that don't expose a repo can't be audited yet — caller should
    // surface a "provide repo URL" form before invoking the pipeline.
    throw new Error("Only repo-source audits are supported by the V0 pipeline");
  }

  await updateState(input.auditId, { status: "fetching", progressNote: "Cloning repository tarball" });
  const fetchResult = await fetchRepo({
    owner: input.source.owner,
    repo: input.source.repo,
    ref: input.ref,
    auditId: input.auditId,
  });

  await updateState(input.auditId, {
    status: "recon",
    progressNote: `Scanning ${fetchResult.fileCount} files for AI-system signals`,
  });
  const reconResult = await runRecon(fetchResult);

  await updateState(input.auditId, { status: "scope" });
  const scopeResult = runScope(input);

  await updateState(input.auditId, { status: "map" });
  const packs = await loadRegulationPacks(input.regulations);
  const mapResult = runMap(reconResult, packs);

  await updateState(input.auditId, {
    status: "check",
    progressNote: `Risk class: ${mapResult.classification} — running clause checkers`,
  });
  const checkResults = await runCheck(fetchResult, reconResult, scopeResult, mapResult, packs);

  await updateState(input.auditId, { status: "verify" });
  const verifyResults = runVerify(checkResults);

  await updateState(input.auditId, { status: "grade" });
  const gradeResult = runGrade(verifyResults);

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

  await updateState(input.auditId, { status: "completed", report });
  return report;
}

export { FetchError };
