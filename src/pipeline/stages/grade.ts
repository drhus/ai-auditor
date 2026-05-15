import type { GradeResult, SectionScore, VerifyResult } from "../types";

export function runGrade(checks: VerifyResult[]): GradeResult {
  const byReg = new Map<string, VerifyResult[]>();
  for (const c of checks) {
    if (!byReg.has(c.regulationId)) byReg.set(c.regulationId, []);
    byReg.get(c.regulationId)!.push(c);
  }
  const perRegulation: SectionScore[] = [];
  let grandSum = 0;
  let grandCount = 0;
  for (const [regId, items] of byReg.entries()) {
    let sum = 0;
    let count = 0;
    let pass = 0;
    let partial = 0;
    let fail = 0;
    let external = 0;
    let na = 0;
    for (const c of items) {
      switch (c.verdict) {
        case "pass":
          pass++; sum += c.score; count++; break;
        case "partial":
          partial++; sum += c.score; count++; break;
        case "fail":
          fail++; sum += c.score; count++; break;
        case "external":
          external++; break;
        case "n/a":
          na++; break;
      }
    }
    const scoreAvg = count > 0 ? sum / count : NaN;
    perRegulation.push({
      regulationId: regId,
      scoreAvg,
      passCount: pass,
      partialCount: partial,
      failCount: fail,
      externalCount: external,
      naCount: na,
    });
    if (count > 0) {
      grandSum += sum;
      grandCount += count;
    }
  }
  const overallScore = grandCount > 0 ? grandSum / grandCount : 0;
  return { overallScore, perRegulation };
}
