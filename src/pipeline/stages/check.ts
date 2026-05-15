import type {
  CheckResult,
  ClauseSpec,
  FetchResult,
  MapResult,
  ReconResult,
  RegulationPack,
  ScopeResult,
  SignalId,
  Verdict,
} from "../types";
import { RULES, type CheckContext, type RuleOutput, hasRule } from "../checkers/rules";

/**
 * Runs every in-scope clause's deterministic checkers and assembles a
 * CheckResult per clause.
 *
 * Verdict + score derivation:
 *   - external clauses → verdict "external", score NaN
 *   - out-of-scope clauses → verdict "n/a", score NaN
 *   - missing required signals → still attempted; rules report 0
 *   - composite raw score ∈ [0,1] from weighted rule outputs
 *   - mapped to 0..4 ordinal: 0.85+→4, 0.65+→3, 0.40+→2, 0.15+→1, else 0
 *   - verdict from mapped score: 4|3 → pass, 2 → partial, 1|0 → fail
 *
 * LLM-judge step is *structurally present* but stubbed in V0 — when raw
 * score lands in the ambiguous band [0.3, 0.7] we flag `needsLlmJudge`
 * and keep the deterministic verdict.
 */
export async function runCheck(
  fetch: FetchResult,
  recon: ReconResult,
  scope: ScopeResult,
  map: MapResult,
  packs: RegulationPack[],
): Promise<CheckResult[]> {
  const ctx: CheckContext = { fetch, recon };
  const results: CheckResult[] = [];

  for (const pack of packs) {
    if (!scope.regulationIds.includes(pack.id)) continue;
    for (const clause of pack.clauses) {
      if (clause.deprecated) continue;
      results.push(await runClause(clause, pack, ctx, map));
    }
  }
  return results;
}

async function runClause(
  clause: ClauseSpec,
  pack: RegulationPack,
  ctx: CheckContext,
  map: MapResult,
): Promise<CheckResult> {
  const base = {
    clauseId: clause.id,
    regulationId: pack.id,
    article: clause.article,
    title: clause.title,
  };

  // External clauses never get auto-scored.
  if (clause.classification === "external") {
    return {
      ...base,
      verdict: "external",
      score: NaN,
      rawScore: NaN,
      evidence: [],
      rules: [],
      rationale: clause.externalNotes ?? "External control — human review required.",
      confidence: 1,
      needsLlmJudge: false,
    };
  }

  // In-scope predicate
  const inScope = isInScope(clause, map);
  if (!inScope.ok) {
    return {
      ...base,
      verdict: "n/a",
      score: NaN,
      rawScore: NaN,
      evidence: [],
      rules: [],
      rationale: inScope.reason,
      confidence: 1,
      needsLlmJudge: false,
    };
  }

  const detRules = clause.checker?.deterministic ?? [];
  if (detRules.length === 0) {
    return {
      ...base,
      verdict: "partial",
      score: 2,
      rawScore: 0.5,
      evidence: [],
      rules: [],
      rationale: "Clause has no deterministic rules wired yet — fell through to partial.",
      confidence: 0.4,
      needsLlmJudge: true,
    };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  const allEvidence: CheckResult["evidence"] = [];
  const rulesReport: CheckResult["rules"] = [];

  for (const r of detRules) {
    const fn = RULES[r.rule];
    let out: RuleOutput;
    if (fn) {
      try {
        out = await fn(ctx);
      } catch (e) {
        out = { score: 0, evidence: [], detail: `rule error: ${(e as Error).message}` };
      }
    } else {
      out = {
        score: 0,
        evidence: [],
        detail: `rule "${r.rule}" not implemented — defaulting to 0`,
      };
    }
    totalWeight += r.weight;
    weightedSum += r.weight * out.score;
    allEvidence.push(...out.evidence);
    rulesReport.push({ rule: r.rule, matched: out.score, weight: r.weight });
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Polarity — prohibition clauses (Art 5) invert: higher raw = more
  // violation evidence = worse compliance. Detected via score_mapping
  // containing `pass_default` / `fail_on_match`.
  const isProhibition =
    clause.scoreMapping !== undefined &&
    ("pass_default" in clause.scoreMapping || "fail_on_match" in clause.scoreMapping);

  const score4 = isProhibition
    ? prohibitionScoreToOrdinal(rawScore)
    : rawScoreToOrdinal(rawScore);
  const verdict = verdictFromOrdinal(score4);
  const needsLlmJudge = !isProhibition && rawScore >= 0.3 && rawScore <= 0.7;

  return {
    ...base,
    verdict,
    score: score4,
    rawScore,
    evidence: allEvidence.slice(0, 12),
    rules: rulesReport,
    rationale: formatRationale(rawScore, rulesReport, clause.classification),
    confidence: confidenceFrom(rawScore, rulesReport),
    needsLlmJudge,
  };
}

function isInScope(
  clause: ClauseSpec,
  map: MapResult,
): { ok: boolean; reason: string } {
  const cond = clause.inScopeWhen;
  if (cond.always) return { ok: true, reason: "always in scope" };
  if (cond.riskClassifications?.length) {
    if (cond.riskClassifications.includes(map.classification)) {
      return { ok: true, reason: `triggered by risk class ${map.classification}` };
    }
    return {
      ok: false,
      reason: `not applicable — risk class is ${map.classification}, clause requires ${cond.riskClassifications.join(" or ")}`,
    };
  }
  if (cond.annexIiiCategories?.length) {
    const overlap = cond.annexIiiCategories.some((c) =>
      map.annexIiiCategories.includes(c),
    );
    if (overlap) return { ok: true, reason: "Annex III category matched" };
    return { ok: false, reason: "no matching Annex III category" };
  }
  if (cond.art50Triggers?.length) {
    return { ok: true, reason: "art-50 trigger context" };
  }
  // Default: run if no predicate.
  return { ok: true, reason: "no scoping predicate — runs by default" };
}

function rawScoreToOrdinal(raw: number): number {
  if (raw >= 0.85) return 4;
  if (raw >= 0.65) return 3;
  if (raw >= 0.40) return 2;
  if (raw >= 0.15) return 1;
  return 0;
}

// Prohibition clauses: raw=0 (no violation detected) → 4 PASS;
// raw=1 (violation found)  → 0 FAIL.
function prohibitionScoreToOrdinal(raw: number): number {
  if (raw <= 0.05) return 4;             // no signal at all
  if (raw <= 0.25) return 3;             // weak / circumstantial
  if (raw <= 0.50) return 2;             // partial / suggestive
  if (raw <= 0.75) return 1;             // strong indicator
  return 0;                              // clear violation evidence
}

function verdictFromOrdinal(s: number): Verdict {
  if (s >= 3) return "pass";
  if (s === 2) return "partial";
  return "fail";
}

function formatRationale(
  raw: number,
  rules: CheckResult["rules"],
  classification: ClauseSpec["classification"],
): string {
  const passed = rules.filter((r) => r.matched >= 0.5).length;
  const total = rules.length;
  const hint = classification === "mixed" ? " Supporting docs may exist outside the repo." : "";
  return `Composite raw score ${raw.toFixed(2)} (${passed}/${total} rules matched).${hint}`;
}

function confidenceFrom(raw: number, rules: CheckResult["rules"]): number {
  // High raw score with multiple agreeing rules = high confidence.
  // Mid raw with few rules = low confidence (LLM judge would help).
  const ruleCount = rules.length;
  if (ruleCount === 0) return 0;
  const dist = Math.min(raw, 1 - raw); // distance to 0.5
  return Math.min(1, 0.5 + dist + ruleCount * 0.05);
}

export type { SignalId };
