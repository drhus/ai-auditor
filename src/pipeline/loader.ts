import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "js-yaml";
import type {
  ClauseSpec,
  RegulationPack,
  RiskClassification,
  SignalId,
} from "./types";

const REGS_DIR = path.join(process.cwd(), "regulations");

let cache: Map<string, RegulationPack> | null = null;

export async function loadRegulationPack(id: string): Promise<RegulationPack> {
  if (cache?.has(id)) return cache.get(id)!;
  if (!cache) cache = new Map();

  const filePath = path.join(REGS_DIR, `${id}.yaml`);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new RegulationLoadError(`Pack ${id} did not parse to an object`);
  }
  const pack = normalisePack(parsed as Record<string, unknown>, raw, id);
  validatePack(pack);
  cache.set(id, pack);
  return pack;
}

export async function loadRegulationPacks(
  ids: string[],
): Promise<RegulationPack[]> {
  return Promise.all(ids.map(loadRegulationPack));
}

export class RegulationLoadError extends Error {}

function normalisePack(
  obj: Record<string, unknown>,
  raw: string,
  packId: string,
): RegulationPack {
  const reg = obj.regulation as Record<string, unknown> | undefined;
  if (!reg) throw new RegulationLoadError("missing `regulation` block");

  const clauses = obj.clauses as unknown[] | undefined;
  if (!Array.isArray(clauses)) {
    throw new RegulationLoadError("missing `clauses` array");
  }

  return {
    // pack.id is the *versioned* identifier matching the YAML filename, so
    // scope.regulationIds (["eu-ai-act-2024-08", ...]) matches pack.id.
    // The clause IDs still use the family slug (eu-ai-act/art-12/p1).
    id: packId,
    familyId: String(reg.id),
    fullName: String(reg.full_name ?? reg.id),
    version: String(reg.version),
    source: String(reg.source ?? ""),
    consolidatedIndex: reg.consolidated_index
      ? String(reg.consolidated_index)
      : undefined,
    companionDocs: Array.isArray(reg.companion_docs)
      ? (reg.companion_docs as unknown[]).map(String)
      : undefined,
    enforcementDates: Array.isArray(reg.enforcement_dates)
      ? (reg.enforcement_dates as Array<Record<string, unknown>>).map((e) => ({
          phase: String(e.phase),
          date: String(e.date),
        }))
      : [],
    clauseIdNamespace: Number(reg.clause_id_namespace ?? 0),
    annexIiiTriggers: Array.isArray(obj.annex_iii_triggers)
      ? (obj.annex_iii_triggers as Array<Record<string, unknown>>).map((t) => ({
          signal: String(t.signal) as SignalId,
          category: String(t.category),
          description: String(t.description ?? ""),
        }))
      : undefined,
    art50Triggers: Array.isArray(obj.art_50_triggers)
      ? (obj.art_50_triggers as Array<Record<string, unknown>>).map((t) => ({
          signal: String(t.signal) as SignalId,
          paragraph: String(t.paragraph),
          description: String(t.description ?? ""),
        }))
      : undefined,
    clauses: clauses.map((c) =>
      normaliseClause(c as Record<string, unknown>),
    ),
    packSha: sha256(raw),
  };
}

function normaliseClause(c: Record<string, unknown>): ClauseSpec {
  const inScope = (c.in_scope_when ?? {}) as Record<string, unknown>;
  const checker = c.checker as Record<string, unknown> | undefined;

  return {
    id: String(c.id),
    clauseIdBytes: Number(c.clause_id_bytes ?? 0),
    article: String(c.article ?? ""),
    title: String(c.title ?? ""),
    subject: Array.isArray(c.subject)
      ? (c.subject as unknown[]).map(String)
      : typeof c.subject === "string"
        ? [c.subject]
        : [],
    classification: (c.classification as ClauseSpec["classification"]) ?? "mixed",
    text: String(c.text ?? "").trim(),
    inScopeWhen: {
      always: Boolean(inScope.always),
      riskClassifications: Array.isArray(inScope.risk_classifications)
        ? (inScope.risk_classifications as unknown[]).map(
            (s) => String(s) as RiskClassification,
          )
        : undefined,
      annexIiiCategories: Array.isArray(inScope.annex_iii_categories)
        ? (inScope.annex_iii_categories as unknown[]).map(String)
        : undefined,
      art50Triggers: Array.isArray(inScope.art_50_triggers)
        ? (inScope.art_50_triggers as unknown[]).map((s) => String(s) as SignalId)
        : undefined,
    },
    signalsRequired: Array.isArray(c.signals_required)
      ? (c.signals_required as unknown[]).map((s) => String(s) as SignalId)
      : [],
    checker: checker
      ? {
          deterministic: Array.isArray(checker.deterministic)
            ? (checker.deterministic as Array<Record<string, unknown>>).map(
                (r) => ({
                  rule: String(r.rule),
                  weight: Number(r.weight ?? 1),
                  description: r.description ? String(r.description) : undefined,
                }),
              )
            : undefined,
          llmJudge: checker.llm_judge
            ? {
                invokeWhen: String(
                  (checker.llm_judge as Record<string, unknown>).invoke_when ??
                    "",
                ),
                promptId: (checker.llm_judge as Record<string, unknown>).prompt_id
                  ? String((checker.llm_judge as Record<string, unknown>).prompt_id)
                  : undefined,
                maxInputChunks: (checker.llm_judge as Record<string, unknown>)
                  .max_input_chunks
                  ? Number(
                      (checker.llm_judge as Record<string, unknown>)
                        .max_input_chunks,
                    )
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    scoreMapping:
      typeof c.score_mapping === "object" && c.score_mapping !== null
        ? Object.fromEntries(
            Object.entries(c.score_mapping as Record<string, unknown>).map(
              ([k, v]) => [k, Number(v)],
            ),
          )
        : undefined,
    evidenceSchema: Array.isArray(c.evidence_schema)
      ? (c.evidence_schema as unknown[]).map(String)
      : undefined,
    remediationHint: c.remediation_hint
      ? String(c.remediation_hint).trim()
      : undefined,
    externalNotes: c.external_notes ? String(c.external_notes).trim() : undefined,
    deprecated: Boolean(c.deprecated),
  };
}

function validatePack(pack: RegulationPack) {
  const seen = new Set<string>();
  const seenBytes = new Set<number>();
  for (const c of pack.clauses) {
    // Clause IDs use the regulation family slug (eu-ai-act/art-12/p1),
    // not the versioned pack id.
    if (!c.id.startsWith(`${pack.familyId}/`)) {
      throw new RegulationLoadError(
        `Clause ${c.id} does not begin with family id ${pack.familyId}/`,
      );
    }
    if (seen.has(c.id)) {
      throw new RegulationLoadError(`Duplicate clause id ${c.id}`);
    }
    seen.add(c.id);
    if (c.clauseIdBytes && seenBytes.has(c.clauseIdBytes)) {
      throw new RegulationLoadError(
        `Duplicate clause_id_bytes 0x${c.clauseIdBytes.toString(16)} in ${pack.id}`,
      );
    }
    if (c.clauseIdBytes) seenBytes.add(c.clauseIdBytes);
  }
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export function clearLoaderCache() {
  cache = null;
}
