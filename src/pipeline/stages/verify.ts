import type { CheckResult, VerifyResult } from "../types";

/**
 * V0: pass-through verify. Future versions invoke an LLM judge on results
 * flagged `needsLlmJudge` and downgrade verdict on disagreement.
 */
export function runVerify(checks: CheckResult[]): VerifyResult[] {
  return checks.map((c) => ({
    ...c,
    verified: true,
    verifyMethod: c.needsLlmJudge ? "skipped" : "deterministic-only",
  }));
}
