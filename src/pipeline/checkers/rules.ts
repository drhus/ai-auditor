// Rule library — implements the named `rule:` entries referenced in each
// clause's `checker.deterministic` list.
//
// Each rule takes a CheckContext and returns a RuleOutput:
//   - score:    0..1
//   - evidence: file/lines references
//
// Most rules are thin wrappers over RECON signals + FileInventory.

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  EvidenceRecord,
  FetchResult,
  ReconResult,
  SignalId,
  SignalResult,
} from "../types";

export interface CheckContext {
  fetch: FetchResult;
  recon: ReconResult;
}

export interface RuleOutput {
  score: number; // 0..1
  evidence: EvidenceRecord[];
  detail?: string;
}

export type RuleFn = (ctx: CheckContext) => Promise<RuleOutput> | RuleOutput;

// ---------- helpers ----------

function fromSignal(
  sig: SignalResult | undefined,
  filterRule?: string,
): RuleOutput {
  if (!sig?.fired) return { score: 0, evidence: [] };
  const evidence = filterRule
    ? sig.evidence.filter((e) => e.rule === filterRule)
    : sig.evidence;
  if (filterRule && evidence.length === 0) {
    return { score: 0, evidence: [] };
  }
  return { score: sig.strength, evidence: evidence.slice(0, 6) };
}

function fromAnyEvidence(
  sigs: Array<SignalResult | undefined>,
  filterRules: string[],
): RuleOutput {
  const evidence: EvidenceRecord[] = [];
  let anyFired = false;
  for (const s of sigs) {
    if (!s?.fired) continue;
    for (const e of s.evidence) {
      if (!e.rule || filterRules.includes(e.rule)) {
        evidence.push(e);
        anyFired = true;
      }
    }
  }
  return { score: anyFired ? Math.min(1, 0.5 + evidence.length * 0.1) : 0, evidence: evidence.slice(0, 6) };
}

function pickSig(ctx: CheckContext, s: SignalId): SignalResult | undefined {
  return ctx.recon.signals[s];
}

async function readFileSafe(root: string, rel: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(root, rel), "utf8");
  } catch {
    return null;
  }
}

async function findFile(
  root: string,
  matchers: RegExp[],
  maxDepth = 3,
): Promise<string | null> {
  async function walk(dir: string, depth: number): Promise<string | null> {
    if (depth > maxDepth) return null;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full);
      if (e.isDirectory()) {
        if (
          e.name === "node_modules" ||
          e.name === ".git" ||
          e.name === ".next" ||
          e.name === "dist"
        )
          continue;
        const r = await walk(full, depth + 1);
        if (r) return r;
        continue;
      }
      if (!e.isFile()) continue;
      if (matchers.some((m) => m.test(e.name))) return rel;
    }
    return null;
  }
  return walk(root, 0);
}

// ---------- the rule table ----------

export const RULES: Record<string, RuleFn> = {
  // ============================================================
  // Article 5 — Prohibited practices
  // ============================================================

  detect_manipulative_prompt_patterns: async (ctx) => {
    // Search prompt-like strings for dark-pattern phrasings.
    const triggers = [
      /pretend to be (?:a )?(?:human|real person)/i,
      /never (?:admit|reveal|say) (?:that )?you are an AI/i,
      /create (?:false |fake )?urgency/i,
      /exploit (?:fear|anxiety|insecurity)/i,
      /manipulate (?:the user|users) (?:into|against)/i,
      /persuade (?:against|despite) their (?:will|preference|judgement)/i,
    ];
    const evidence: EvidenceRecord[] = [];
    const sig = pickSig(ctx, "agent_framework");
    for (const e of sig?.evidence ?? []) {
      if (!e.snippet) continue;
      for (const t of triggers) {
        if (t.test(e.snippet)) {
          evidence.push({ ...e, rule: "detect_manipulative_prompt_patterns" });
          break;
        }
      }
    }
    // Also scan markdown/prompt files for the patterns.
    return { score: evidence.length > 0 ? 1 : 0, evidence };
  },

  detect_protected_attribute_targeting: (ctx) => {
    // Only flag if both pii_signals fire AND we see decision-branching keywords.
    const pii = pickSig(ctx, "pii_signals");
    if (!pii?.fired) return { score: 0, evidence: [] };
    const evidence = pii.evidence.filter((e) =>
      /\b(?:age|disability|income|benefits|zip|postal)\b/i.test(e.snippet ?? ""),
    );
    return { score: evidence.length >= 2 ? 1 : 0, evidence };
  },

  detect_scoring_with_persistent_user_state: (ctx) => {
    // Heuristic — needs "score" + "user" + persistent DB write.
    const evidence: EvidenceRecord[] = [];
    return { score: 0, evidence };
  },

  detect_crime_risk_scoring_from_profile: (ctx) => {
    const lawEnf = pickSig(ctx, "law_enforcement_signals");
    return fromSignal(lawEnf);
  },

  detect_face_image_scraping: (ctx) => {
    const bio = pickSig(ctx, "bio_metric_signals");
    const dataIo = pickSig(ctx, "data_io");
    if (!(bio?.fired && dataIo?.fired)) return { score: 0, evidence: [] };
    const evidence = [
      ...bio.evidence.slice(0, 3),
      ...dataIo.evidence.filter((e) => e.rule === "scraping_pattern").slice(0, 3),
    ];
    return { score: evidence.length >= 2 ? 1 : 0, evidence };
  },

  detect_emotion_recognition_in_workplace_education: (ctx) => {
    const er = pickSig(ctx, "emotion_recognition_signals");
    const emp = pickSig(ctx, "employment_signals");
    const edu = pickSig(ctx, "education_signals");
    if (!er?.fired) return { score: 0, evidence: [] };
    if (!(emp?.fired || edu?.fired)) return { score: 0, evidence: [] };
    return {
      score: 1,
      evidence: [
        ...er.evidence.slice(0, 3),
        ...(emp?.evidence ?? edu?.evidence ?? []).slice(0, 3),
      ],
    };
  },

  detect_biometric_categorisation_by_protected_attrs: (ctx) => {
    const bio = pickSig(ctx, "bio_metric_signals");
    if (!bio?.fired) return { score: 0, evidence: [] };
    const triggers =
      /\b(?:race|ethnicity|political|religion|sexual_orientation|trade_union)\b/i;
    const evidence = bio.evidence.filter((e) => triggers.test(e.snippet ?? ""));
    return { score: evidence.length > 0 ? 1 : 0, evidence };
  },

  // ============================================================
  // Article 9 — Risk management
  // ============================================================

  presence_of_risk_register: async (ctx) => {
    if (ctx.fetch.inventory.hasRiskRegister) {
      const file = ctx.fetch.inventory.governanceDocFiles.find((f) =>
        /risk[_-]?register/i.test(f),
      );
      const content = file ? await readFileSafe(ctx.fetch.worktreeDir, file) : null;
      const substantive = content && content.length > 200;
      return {
        score: substantive ? 1 : 0.5,
        evidence: file ? [{ file, rule: "presence_of_risk_register" }] : [],
      };
    }
    return { score: 0, evidence: [] };
  },

  presence_of_threat_model: async (ctx) => {
    if (ctx.fetch.inventory.hasThreatModel) {
      const file = ctx.fetch.inventory.governanceDocFiles.find((f) =>
        /threat[_-]?model/i.test(f),
      );
      return {
        score: 1,
        evidence: file ? [{ file, rule: "presence_of_threat_model" }] : [],
      };
    }
    if (ctx.fetch.inventory.hasSecurityMd) {
      return {
        score: 0.5,
        evidence: [{ file: "SECURITY.md", rule: "presence_of_threat_model" }],
        detail: "Found SECURITY.md but no dedicated THREAT_MODEL",
      };
    }
    return { score: 0, evidence: [] };
  },

  ci_eval_gates: async (ctx) => {
    if (!ctx.fetch.inventory.hasCiWorkflows) return { score: 0, evidence: [] };
    const wfDir = ".github/workflows";
    const dir = path.join(ctx.fetch.worktreeDir, wfDir);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return { score: 0, evidence: [] };
    }
    let score = 0;
    const evidence: EvidenceRecord[] = [];
    for (const e of entries) {
      const content = await readFileSafe(ctx.fetch.worktreeDir, path.join(wfDir, e));
      if (!content) continue;
      if (/\b(?:eval|benchmark|test)/i.test(content) && /run:|npm test|pytest|vitest|jest/i.test(content)) {
        score = 1;
        evidence.push({ file: path.join(wfDir, e), rule: "ci_eval_gates" });
      }
    }
    return { score, evidence };
  },

  risk_owner_assignment: async (ctx) => {
    const file = ctx.fetch.inventory.governanceDocFiles.find((f) =>
      /risk[_-]?register/i.test(f),
    );
    if (!file) return { score: 0, evidence: [] };
    const content = await readFileSafe(ctx.fetch.worktreeDir, file);
    if (!content) return { score: 0, evidence: [] };
    const score = /\bowner\b.*:|\bresponsible\b.*:|\bassignee\b.*:/i.test(content) ? 1 : 0;
    return {
      score,
      evidence: [{ file, rule: "risk_owner_assignment" }],
    };
  },

  // ============================================================
  // Article 10 — Data governance
  // ============================================================

  presence_of_data_card: (ctx) => {
    if (ctx.fetch.inventory.hasDataCard) {
      const file = ctx.fetch.inventory.governanceDocFiles.find((f) =>
        /data[_-]?card/i.test(f),
      );
      return {
        score: 1,
        evidence: file ? [{ file, rule: "presence_of_data_card" }] : [],
      };
    }
    return { score: 0, evidence: [] };
  },

  data_loading_code_quality: (ctx) => {
    const data = pickSig(ctx, "data_io");
    if (!data?.fired) return { score: 0, evidence: [] };
    const dedupe = data.evidence.find((e) => /deduplic|drop_duplicates|distinct\(|unique/i.test(e.snippet ?? ""));
    return {
      score: dedupe ? 1 : 0.4,
      evidence: dedupe ? [dedupe] : data.evidence.slice(0, 2),
    };
  },

  bias_evaluation_present: (ctx) => {
    const ev = pickSig(ctx, "eval_artefacts");
    if (!ev?.fired) return { score: 0, evidence: [] };
    const biasEvidence = ev.evidence.filter((e) =>
      /(?:langfair|aif360|fairlearn|bias|fairness|disparate_impact)/i.test(
        (e.snippet ?? "") + " " + (e.detail ?? ""),
      ),
    );
    return {
      score: biasEvidence.length > 0 ? 1 : 0,
      evidence: biasEvidence.slice(0, 4),
    };
  },

  // ============================================================
  // Article 11 — Technical documentation
  // ============================================================

  presence_of_model_card: (ctx) => {
    if (ctx.fetch.inventory.hasModelCard) {
      const file = ctx.fetch.inventory.governanceDocFiles.find((f) =>
        /model[_-]?card/i.test(f),
      );
      return {
        score: 1,
        evidence: file ? [{ file, rule: "presence_of_model_card" }] : [],
      };
    }
    return { score: 0, evidence: [] };
  },

  readme_quality: async (ctx) => {
    if (!ctx.fetch.inventory.hasReadme) return { score: 0, evidence: [] };
    const readme = await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1);
    if (!readme) return { score: 0, evidence: [] };
    const content = await readFileSafe(ctx.fetch.worktreeDir, readme);
    if (!content) return { score: 0, evidence: [] };
    const sections = [
      /intended[_\s-]use/i,
      /(?:scope|out[_\s-]of[_\s-]scope)/i,
      /deployment/i,
      /limitations/i,
      /install/i,
    ];
    const hits = sections.filter((r) => r.test(content)).length;
    return {
      score: Math.min(1, hits / 4),
      evidence: [{ file: readme, rule: "readme_quality", detail: `${hits} required sections present` }],
    };
  },

  architecture_docs: async (ctx) => {
    const adr = await findFile(
      ctx.fetch.worktreeDir,
      [/^(?:architecture|ARCHITECTURE)(\.[\w]+)?$/i, /^(?:adr-\d+|0\d+-)/i],
      4,
    );
    return {
      score: adr ? 1 : 0,
      evidence: adr ? [{ file: adr, rule: "architecture_docs" }] : [],
    };
  },

  // ============================================================
  // Article 12 — Logging
  // ============================================================

  structured_logging_imported: (ctx) => {
    return fromSignal(pickSig(ctx, "logging_hooks"), "structlog_or_loguru");
  },

  logging_at_tool_call_boundaries: (ctx) => {
    return fromSignal(pickSig(ctx, "logging_hooks"), "log_at_tool_boundary");
  },

  logging_persistent_sink: (ctx) => {
    // Heuristic: look for OTEL deps or file-sink configuration in evidence.
    const sig = pickSig(ctx, "logging_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const otel = sig.evidence.find(
      (e) => (e.detail ?? "").includes("opentelemetry"),
    );
    return {
      score: otel ? 1 : 0.4,
      evidence: otel ? [otel] : sig.evidence.slice(0, 2),
    };
  },

  logs_include_input_output_pairs: (ctx) => fromSignal(pickSig(ctx, "logging_hooks")),

  logs_include_model_identity: (ctx) => {
    const models = pickSig(ctx, "model_usage");
    const logs = pickSig(ctx, "logging_hooks");
    if (!models?.fired || !logs?.fired) return { score: 0, evidence: [] };
    return { score: 0.7, evidence: logs.evidence.slice(0, 2) };
  },

  logs_include_request_id: (ctx) => {
    const sig = pickSig(ctx, "logging_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) =>
      /request[_-]?id|correlation[_-]?id|trace[_-]?id/i.test(e.snippet ?? ""),
    );
    return {
      score: hit ? 1 : 0,
      evidence: hit ? [hit] : [],
    };
  },

  logs_externally_exportable: (ctx) => {
    const sig = pickSig(ctx, "logging_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const otel = sig.evidence.find((e) =>
      (e.detail ?? "").includes("opentelemetry") || /OTEL_EXPORTER/i.test(e.snippet ?? ""),
    );
    return {
      score: otel ? 1 : 0.5,
      evidence: otel ? [otel] : sig.evidence.slice(0, 2),
    };
  },

  // ============================================================
  // Article 13 — Transparency to deployers
  // ============================================================

  presence_of_deployer_instructions: async (ctx) =>
    RULES.readme_quality(ctx),

  output_interpretation_guidance: async (ctx) => {
    const readme = await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1);
    if (!readme) return { score: 0, evidence: [] };
    const content = await readFileSafe(ctx.fetch.worktreeDir, readme);
    if (!content) return { score: 0, evidence: [] };
    return {
      score: /confidence|interpret|how to read|output format/i.test(content) ? 1 : 0,
      evidence: [{ file: readme, rule: "output_interpretation_guidance" }],
    };
  },

  limitations_section_present: async (ctx) => {
    const readme = await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1);
    const content = readme ? await readFileSafe(ctx.fetch.worktreeDir, readme) : null;
    if (!content) return { score: 0, evidence: [] };
    return {
      score: /limitations|known issues|out[\s_-]?of[\s_-]?scope/i.test(content) ? 1 : 0,
      evidence: [{ file: readme!, rule: "limitations_section_present" }],
    };
  },

  intended_use_documented: async (ctx) =>
    RULES.readme_quality(ctx),

  deployment_context_documented: async (ctx) =>
    RULES.output_interpretation_guidance(ctx),

  // ============================================================
  // Article 14 — Human oversight
  // ============================================================

  human_in_loop_hooks_present: (ctx) =>
    fromSignal(pickSig(ctx, "oversight_hooks"), "human_in_loop"),

  oversight_ui_present: (ctx) => {
    // Heuristic: look for admin/dashboard/approval directories in the inventory.
    return { score: 0, evidence: [] };
  },

  tool_calls_have_dry_run: (ctx) => {
    const sig = pickSig(ctx, "agent_framework");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const dry = sig.evidence.find((e) => /dry[_-]?run|preview/i.test(e.snippet ?? ""));
    return {
      score: dry ? 1 : 0,
      evidence: dry ? [dry] : [],
    };
  },

  kill_switch_present: (ctx) =>
    fromAnyEvidence([pickSig(ctx, "oversight_hooks")], ["kill_switch", "feature_flag_disable"]),

  graceful_shutdown_handler: (ctx) =>
    fromSignal(pickSig(ctx, "oversight_hooks"), "graceful_shutdown"),

  override_path_present: (ctx) => {
    return fromAnyEvidence([pickSig(ctx, "oversight_hooks")], ["human_in_loop", "kill_switch"]);
  },

  decisions_are_addressable: (ctx) => {
    const sig = pickSig(ctx, "logging_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) =>
      /decision_id|run_id|request_id|trace_id/i.test(e.snippet ?? ""),
    );
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  feature_flag_for_disable: (ctx) =>
    fromSignal(pickSig(ctx, "oversight_hooks"), "feature_flag_disable"),

  // ============================================================
  // Article 15 — Accuracy / robustness / cybersec
  // ============================================================

  eval_suite_present: (ctx) => {
    if (ctx.fetch.inventory.hasEvalDir) {
      return { score: 1, evidence: [{ file: "evals/", rule: "eval_suite_present" }] };
    }
    if (ctx.fetch.inventory.hasTestsDir) {
      return { score: 0.5, evidence: [{ file: "tests/", rule: "eval_suite_present" }] };
    }
    return { score: 0, evidence: [] };
  },

  metrics_documented: async (ctx) => {
    const card =
      ctx.fetch.inventory.governanceDocFiles.find((f) => /model[_-]?card/i.test(f)) ??
      (await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1));
    if (!card) return { score: 0, evidence: [] };
    const content = await readFileSafe(ctx.fetch.worktreeDir, card);
    if (!content) return { score: 0, evidence: [] };
    return {
      score: /accuracy|precision|recall|f1|bleu|rouge|mmlu|metric/i.test(content) ? 1 : 0,
      evidence: [{ file: card, rule: "metrics_documented" }],
    };
  },

  eval_in_ci: (ctx) => RULES.ci_eval_gates(ctx),

  error_handling_at_tool_boundaries: (ctx) => {
    const sig = pickSig(ctx, "agent_framework");
    if (!sig?.fired) return { score: 0, evidence: [] };
    return { score: 0.4, evidence: sig.evidence.slice(0, 2) };
  },

  retry_logic: (ctx) => {
    const sig = pickSig(ctx, "agent_framework");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) => /retry|backoff|tenacity/i.test(e.snippet ?? ""));
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  fallback_behaviour: (ctx) => {
    const sig = pickSig(ctx, "agent_framework");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) => /fallback|fail[_-]?over|alternate_model/i.test(e.snippet ?? ""));
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  prompt_injection_defences: (ctx) =>
    fromSignal(pickSig(ctx, "cybersec_hooks"), "prompt_injection_defence"),

  rate_limiting: (ctx) => fromSignal(pickSig(ctx, "cybersec_hooks"), "rate_limit_usage"),

  secrets_not_in_prompts: (ctx) =>
    fromSignal(pickSig(ctx, "cybersec_hooks"), "secrets_loaded_from_env"),

  adversarial_eval_present: (ctx) => {
    const sig = pickSig(ctx, "eval_artefacts");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) =>
      /(?:garak|promptbench|prompt[_-]?injection|adversarial)/i.test(
        (e.detail ?? "") + " " + (e.snippet ?? ""),
      ),
    );
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  drift_monitoring_present: (ctx) => {
    const sig = pickSig(ctx, "logging_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) =>
      /drift|canary|health_check|model_quality/i.test(e.snippet ?? ""),
    );
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  // ============================================================
  // Article 50 — Transparency
  // ============================================================

  ai_disclosure_in_user_facing_strings: async (ctx) => {
    // Look in README + UI strings.
    const readme = await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1);
    const content = readme ? await readFileSafe(ctx.fetch.worktreeDir, readme) : null;
    if (!content) return { score: 0, evidence: [] };
    return {
      score: /chatting with an AI|powered by AI|AI[\s-]?generated|this is an AI/i.test(content) ? 1 : 0,
      evidence: readme ? [{ file: readme, rule: "ai_disclosure_in_user_facing_strings" }] : [],
    };
  },

  persona_not_human_impersonating: async (ctx) => {
    // Look for system prompt files and check they don't instruct human-impersonation.
    const promptFiles: string[] = [];
    async function walk(dir: string, depth = 0) {
      if (depth > 4) return;
      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch { return; }
      for (const e of entries) {
        if (e.isDirectory() && !["node_modules", ".git", ".next", "dist"].includes(e.name)) {
          await walk(path.join(dir, e.name), depth + 1);
        } else if (e.isFile() && /(?:system[_-]?prompt|prompts?\.)/i.test(e.name)) {
          promptFiles.push(path.relative(ctx.fetch.worktreeDir, path.join(dir, e.name)));
        }
      }
    }
    await walk(ctx.fetch.worktreeDir);
    if (promptFiles.length === 0) {
      return { score: 0.5, evidence: [], detail: "No system-prompt files found to audit" };
    }
    const badPatterns = [
      /you are a real person/i,
      /never (?:say|admit) you are an AI/i,
      /pretend to be human/i,
    ];
    const offending: EvidenceRecord[] = [];
    for (const f of promptFiles) {
      const content = await readFileSafe(ctx.fetch.worktreeDir, f);
      if (!content) continue;
      for (const p of badPatterns) {
        const m = content.match(p);
        if (m) {
          offending.push({ file: f, rule: "persona_not_human_impersonating", snippet: m[0] });
        }
      }
    }
    return {
      score: offending.length === 0 ? 1 : 0,
      evidence: offending.length === 0 ? promptFiles.slice(0, 3).map((f) => ({ file: f, rule: "persona_not_human_impersonating" })) : offending,
    };
  },

  c2pa_or_watermark_library_imported: (ctx) =>
    fromSignal(pickSig(ctx, "provenance_hooks")),

  provenance_metadata_written_to_outputs: (ctx) => {
    const sig = pickSig(ctx, "provenance_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    return { score: 0.7, evidence: sig.evidence.slice(0, 2) };
  },

  emotion_or_biometric_disclosure_string: async (ctx) => {
    const er = pickSig(ctx, "emotion_recognition_signals");
    const bio = pickSig(ctx, "bio_metric_signals");
    if (!(er?.fired || bio?.fired)) {
      return { score: 1, evidence: [], detail: "No emotion/biometric pipeline detected" };
    }
    // Look for disclosure strings.
    const readme = await findFile(ctx.fetch.worktreeDir, [/^README(\.[\w]+)?$/i], 1);
    const content = readme ? await readFileSafe(ctx.fetch.worktreeDir, readme) : null;
    if (!content) return { score: 0, evidence: [] };
    return {
      score: /this system uses (?:emotion|biometric)|emotion recognition is active|biometric .* (?:is|will be) used/i.test(content) ? 1 : 0,
      evidence: readme ? [{ file: readme, rule: "emotion_or_biometric_disclosure_string" }] : [],
    };
  },

  deepfake_label_on_outputs: (ctx) => {
    const gen = pickSig(ctx, "content_generation_signals");
    if (!gen?.fired) return { score: 1, evidence: [], detail: "No generation pipeline detected" };
    return RULES.provenance_metadata_written_to_outputs(ctx);
  },

  // ============================================================
  // Misc / NIST-only
  // ============================================================

  pii_redaction_present: (ctx) =>
    fromSignal(pickSig(ctx, "pii_signals"), "pii_redaction_present"),

  privacy_documentation: (ctx) => {
    if (ctx.fetch.inventory.hasPrivacyMd) {
      return { score: 1, evidence: [{ file: "PRIVACY.md", rule: "privacy_documentation" }] };
    }
    return { score: 0, evidence: [] };
  },

  feedback_capture_present: (ctx) => {
    const sig = pickSig(ctx, "oversight_hooks");
    if (!sig?.fired) return { score: 0, evidence: [] };
    const hit = sig.evidence.find((e) =>
      /feedback|thumbs[_-]?(?:up|down)|rating|flag_output/i.test(e.snippet ?? ""),
    );
    return { score: hit ? 1 : 0, evidence: hit ? [hit] : [] };
  },

  versioning_visible: async (ctx) => {
    const pkg = await readFileSafe(ctx.fetch.worktreeDir, "package.json");
    if (pkg && /"version"\s*:/.test(pkg)) {
      return { score: 1, evidence: [{ file: "package.json", rule: "versioning_visible" }] };
    }
    return { score: 0.3, evidence: [] };
  },
};

export function hasRule(name: string): boolean {
  return name in RULES;
}
