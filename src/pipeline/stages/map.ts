import type {
  MapResult,
  ReconResult,
  RegulationPack,
  SignalId,
} from "../types";

/**
 * Derives a risk classification from RECON signals using the Annex III
 * triggers defined in the EU AI Act regulation pack.
 *
 * Rules:
 *   - Any Annex III signal firing with strength >= 0.3 → high-risk
 *   - Otherwise, Art 50 triggers firing → limited-risk
 *   - Otherwise, agent_framework firing → minimal-risk
 *   - Otherwise → unknown
 */
export function runMap(
  recon: ReconResult,
  packs: RegulationPack[],
): MapResult {
  const annexIiiCategories: string[] = [];
  const drivingSignals: MapResult["drivingSignals"] = [];
  const rationale: string[] = [];

  // Early bail-out: if neither an agent framework nor an LLM call site is
  // present, this isn't an AI system at all. Don't promote false-positive
  // domain signals (e.g. a README mentioning "employment") to a risk class.
  const isAiSystem =
    recon.signals.agent_framework?.fired || recon.signals.model_usage?.fired;
  if (!isAiSystem) {
    return {
      classification: "unknown",
      annexIiiCategories: [],
      art50Triggers: [],
      drivingSignals: [],
      rationale: [
        "No AI system detected in this repository — no agent framework or LLM call sites found.",
        "EU AI Act and NIST AI RMF do not apply: the regulations target AI systems and these signals are absent.",
      ],
    };
  }

  const euPack = packs.find((p) => p.familyId === "eu-ai-act");
  if (euPack?.annexIiiTriggers) {
    for (const trigger of euPack.annexIiiTriggers) {
      const sig = recon.signals[trigger.signal];
      if (sig?.fired && sig.strength >= 0.3) {
        annexIiiCategories.push(trigger.category);
        drivingSignals.push({ signal: trigger.signal, category: trigger.category });
        rationale.push(
          `Annex III §${trigger.category} (${trigger.description}) — signal "${trigger.signal}" fired with strength ${sig.strength.toFixed(2)}`,
        );
      }
    }
  }

  const art50Triggers: string[] = [];
  if (euPack?.art50Triggers) {
    for (const trigger of euPack.art50Triggers) {
      const sig = recon.signals[trigger.signal];
      if (sig?.fired) {
        art50Triggers.push(trigger.paragraph);
        rationale.push(
          `Art 50 ${trigger.paragraph} (${trigger.description}) — signal "${trigger.signal}" fired`,
        );
      }
    }
  }

  let classification: MapResult["classification"];
  if (annexIiiCategories.length > 0) {
    classification = "high";
    rationale.unshift(
      `Classified HIGH-RISK based on ${annexIiiCategories.length} Annex III signal(s).`,
    );
  } else if (art50Triggers.length > 0) {
    classification = "limited";
    rationale.unshift(
      `Classified LIMITED-RISK based on Art 50 transparency trigger(s).`,
    );
  } else {
    classification = "minimal";
    rationale.unshift(
      `Classified MINIMAL-RISK — AI agent detected but no Annex III or Art 50 trigger fired.`,
    );
  }

  return {
    classification,
    annexIiiCategories: dedupe(annexIiiCategories),
    art50Triggers: dedupe(art50Triggers),
    drivingSignals,
    rationale,
  };
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

export type { SignalId };
