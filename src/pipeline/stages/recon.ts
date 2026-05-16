import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  EvidenceRecord,
  FetchResult,
  ReconResult,
  SignalId,
  SignalResult,
} from "../types";

/**
 * Single-pass scanner that produces all RECON signals from one tree walk.
 *
 * Strategy: for each text-readable source file (size-capped), apply every
 * detector's regex/keyword set in one go. Each match contributes evidence to
 * one or more signals. Final strength is normalised hit-count.
 *
 * Detectors are mostly pattern matchers — fast and reproducible. A future
 * iteration can swap in tree-sitter ASTs for surgical accuracy.
 */
export async function runRecon(fetch: FetchResult): Promise<ReconResult> {
  const acc: Record<SignalId, EvidenceRecord[]> = empty();
  const meta: Partial<Record<SignalId, Record<string, unknown>>> = {};

  // 1. Static, file-existence-based signals.
  if (fetch.inventory.governanceDocFiles.length > 0) {
    for (const f of fetch.inventory.governanceDocFiles) {
      acc.governance_docs.push({ file: f, rule: "governance_doc_present" });
    }
  }
  if (fetch.inventory.hasEvalDir || fetch.inventory.hasTestsDir) {
    acc.eval_artefacts.push({
      file: fetch.inventory.hasEvalDir ? "evals/" : "tests/",
      rule: "eval_or_test_dir_present",
    });
  }
  if (fetch.inventory.hasCiWorkflows) {
    acc.eval_artefacts.push({
      file: ".github/workflows/",
      rule: "ci_workflows_present",
    });
  }

  // 2. Per-package-manifest signals (frameworks, libs).
  for (const cfg of fetch.inventory.configFiles) {
    const full = path.join(fetch.worktreeDir, cfg);
    try {
      const content = await fs.readFile(full, "utf8");
      detectManifestSignals(cfg, content, acc);
    } catch {
      /* skip */
    }
  }

  // 3. Walk text source files and apply pattern detectors.
  await walkAndScan(fetch.worktreeDir, fetch.worktreeDir, acc, meta);

  // 4. Compose SignalResult set.
  const signals = {} as Record<SignalId, SignalResult>;
  for (const id of ALL_SIGNALS) {
    const ev = acc[id];
    const fired = ev.length > 0;
    const strength = fired ? normaliseStrength(ev.length) : 0;
    // Cap evidence reported to 25 records per signal to keep responses bounded.
    signals[id] = {
      signal: id,
      fired,
      strength,
      evidence: ev.slice(0, 25),
      meta: meta[id],
    };
  }

  return { signals };
}

// ---------------------------------------------------------------------------

const ALL_SIGNALS: SignalId[] = [
  "agent_framework",
  "model_usage",
  "logging_hooks",
  "oversight_hooks",
  "eval_artefacts",
  "governance_docs",
  "cybersec_hooks",
  "provenance_hooks",
  "data_io",
  "pii_signals",
  "bio_health_signals",
  "employment_signals",
  "bio_metric_signals",
  "education_signals",
  "law_enforcement_signals",
  "migration_signals",
  "justice_signals",
  "essential_services_signals",
  "critical_infra_signals",
  "content_generation_signals",
  "emotion_recognition_signals",
];

function empty(): Record<SignalId, EvidenceRecord[]> {
  const o = {} as Record<SignalId, EvidenceRecord[]>;
  for (const s of ALL_SIGNALS) o[s] = [];
  return o;
}

function normaliseStrength(hits: number): number {
  // 1 → 0.4, 3 → 0.7, 10 → 0.9, plateaus near 1
  return Math.min(1, 0.4 + Math.log10(hits) * 0.4);
}

// ---------------------------------------------------------------------------
// Manifest detectors (package.json / pyproject / requirements / etc.)
// ---------------------------------------------------------------------------

function detectManifestSignals(
  file: string,
  content: string,
  acc: Record<SignalId, EvidenceRecord[]>,
) {
  const lower = content.toLowerCase();

  const frameworks: Array<[string, string]> = [
    ["langchain", "LangChain"],
    ["langgraph", "LangGraph"],
    ["llama-index", "LlamaIndex"],
    ["llamaindex", "LlamaIndex"],
    ["crewai", "CrewAI"],
    ["autogen", "AutoGen"],
    ["@anthropic-ai/sdk", "Anthropic SDK"],
    ["anthropic", "Anthropic SDK"],
    ["@openai/", "OpenAI SDK"],
    ['"openai"', "OpenAI SDK"],
    ["openai==", "OpenAI SDK"],
    ["openai>=", "OpenAI SDK"],
    ["openai~=", "OpenAI SDK"],
    ["mistralai", "Mistral SDK"],
    ["cohere", "Cohere SDK"],
    ["transformers", "HuggingFace Transformers"],
  ];
  for (const [needle, label] of frameworks) {
    if (lower.includes(needle.toLowerCase())) {
      acc.agent_framework.push({
        file,
        rule: "manifest_framework_dep",
        detail: label,
      });
    }
  }

  const loggers: string[] = [
    "structlog",
    "loguru",
    "pino",
    "winston",
    "bunyan",
    "@opentelemetry/api",
    "@opentelemetry/sdk-node",
    "opentelemetry-api",
  ];
  for (const l of loggers) {
    if (lower.includes(l.toLowerCase())) {
      acc.logging_hooks.push({
        file,
        rule: "manifest_logger_dep",
        detail: l,
      });
    }
  }

  const evalLibs = ["pytest", "vitest", "jest", "mocha", "promptbench", "garak", "langfair", "aif360", "fairlearn"];
  for (const e of evalLibs) {
    if (lower.includes(e)) {
      acc.eval_artefacts.push({
        file,
        rule: "manifest_eval_dep",
        detail: e,
      });
    }
  }

  if (lower.includes("c2pa") || lower.includes("invisible-watermark") || lower.includes("synthid")) {
    acc.provenance_hooks.push({ file, rule: "manifest_provenance_dep" });
  }

  if (lower.includes("express-rate-limit") || lower.includes("slowapi") || lower.includes("ratelimit")) {
    acc.cybersec_hooks.push({ file, rule: "manifest_ratelimit_dep" });
  }

  if (
    lower.includes("face_recognition") ||
    lower.includes("mediapipe") ||
    lower.includes("dlib") ||
    lower.includes("opencv-python") ||
    lower.includes("opencv-contrib") ||
    lower.includes("face-api.js")
  ) {
    acc.bio_metric_signals.push({ file, rule: "manifest_biometric_dep" });
  }

  if (lower.includes("playwright") || lower.includes("puppeteer") || lower.includes("scrapy") || lower.includes("beautifulsoup")) {
    acc.data_io.push({ file, rule: "manifest_scraper_dep" });
  }
}

// ---------------------------------------------------------------------------
// File walker + content scanner
// ---------------------------------------------------------------------------

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".pyi",
  ".rs", ".go", ".rb", ".java", ".kt", ".swift",
  ".c", ".h", ".cpp", ".hpp", ".cs", ".php",
  ".sh", ".bash", ".zsh",
  ".html", ".css", ".scss", ".vue", ".svelte",
  ".md", ".mdx",
  ".yml", ".yaml", ".json", ".toml",
  ".sql", ".sol",
  ".env.example",
]);

const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_FILES = 5000;

async function walkAndScan(
  root: string,
  dir: string,
  acc: Record<SignalId, EvidenceRecord[]>,
  meta: Partial<Record<SignalId, Record<string, unknown>>>,
) {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        e.name === "node_modules" ||
        e.name === ".git" ||
        e.name === ".next" ||
        e.name === "dist" ||
        e.name === "build" ||
        e.name === "vendor" ||
        e.name === "__pycache__"
      ) continue;
      await walkAndScan(root, full, acc, meta);
      continue;
    }
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    let stat: import("node:fs").Stats;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (stat.size > MAX_FILE_BYTES) continue;
    let content: string;
    try {
      content = await fs.readFile(full, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(root, full);
    scanFile(rel, content, ext, acc, meta);
  }
}

interface PatternRule {
  signal: SignalId;
  rule: string;
  pattern: RegExp;
}

const PATTERNS: PatternRule[] = [
  // ----- logging_hooks -----
  { signal: "logging_hooks", rule: "import_logging", pattern: /\b(?:import\s+logging|from\s+logging\s+import|require\(['"](?:winston|pino|bunyan)['"]\)|import\s+pino|import\s+winston|import\s+bunyan|import\s+\{[^}]*?\}\s+from\s+['"]@opentelemetry\/(?:api|sdk-node)['"])/g },
  { signal: "logging_hooks", rule: "structlog_or_loguru", pattern: /\b(?:from\s+structlog\b|import\s+structlog|from\s+loguru\s+import|import\s+loguru)/g },
  { signal: "logging_hooks", rule: "log_at_tool_boundary", pattern: /\b(?:logger\.(?:info|warn|warning|error|debug)|log\.(?:info|warn|error|debug)|console\.log)\s*\(/g },

  // ----- agent_framework -----
  { signal: "agent_framework", rule: "langchain_import", pattern: /\b(?:from\s+langchain|import\s+langchain|from\s+langgraph|import\s+langgraph|from\s+llama_index|import\s+llama_index)/g },
  { signal: "agent_framework", rule: "anthropic_sdk_use", pattern: /\b(?:anthropic\.Anthropic\(|new\s+Anthropic\(|from\s+anthropic\s+import|@anthropic-ai\/sdk)/g },
  { signal: "agent_framework", rule: "openai_sdk_use", pattern: /\b(?:OpenAI\(|openai\.Completion|openai\.ChatCompletion|openai\.chat\.completions|openai\.responses|openai-python|openai\.OpenAI)/g },
  { signal: "agent_framework", rule: "agent_loop_pattern", pattern: /\b(?:while\s+not\s+(?:done|complete|finished)|for\s+\w+\s+in\s+range\(.*\):.*?(?:agent|step|act))/g },

  // ----- model_usage -----
  { signal: "model_usage", rule: "model_string_anthropic", pattern: /['"](claude-(?:opus|sonnet|haiku)-[\w.-]+)['"]/g },
  { signal: "model_usage", rule: "model_string_openai", pattern: /['"](gpt-(?:4|3\.5|5)[\w.-]*|o[134][\w.-]*)['"]/g },
  { signal: "model_usage", rule: "model_string_llama", pattern: /['"](llama-?[2-4][\w.-]*|mixtral[\w.-]*|qwen[\w.-]*)['"]/gi },

  // ----- oversight_hooks -----
  { signal: "oversight_hooks", rule: "human_in_loop", pattern: /\b(?:human_input|HumanMessage|require_approval|await\s+approval|needs_approval|interrupt\(|InterruptedException|input\(['"]\s*(?:proceed|confirm|y\/n))/g },
  { signal: "oversight_hooks", rule: "kill_switch", pattern: /\b(?:kill_switch|emergency_stop|disable_agent|halt_agent|abort_processing|EMERGENCY_STOP|SystemExit)/g },
  { signal: "oversight_hooks", rule: "feature_flag_disable", pattern: /\b(?:DISABLE_AGENT|AGENT_DISABLED|ai_enabled|AI_ENABLED|isEnabled\(['"](?:agent|ai))/g },
  { signal: "oversight_hooks", rule: "graceful_shutdown", pattern: /\b(?:signal\.signal\(\s*signal\.SIG(?:TERM|INT)|process\.on\(['"]SIG(?:TERM|INT))/g },

  // ----- cybersec_hooks -----
  { signal: "cybersec_hooks", rule: "rate_limit_usage", pattern: /\b(?:rate_limit|RateLimit|@limiter\.limit|Limiter\(|express-rate-limit|slowapi)/g },
  { signal: "cybersec_hooks", rule: "prompt_injection_defence", pattern: /\b(?:prompt[_\s-]?injection|jailbreak|llm[_\s-]?guard|prompt_guard|sanitize_prompt|input_filter|output_filter)/gi },
  { signal: "cybersec_hooks", rule: "secrets_loaded_from_env", pattern: /\b(?:process\.env\.|os\.environ\.get|os\.getenv\()(?:[A-Z_]+_KEY|[A-Z_]+_TOKEN|[A-Z_]+_SECRET)\b/g },

  // ----- provenance_hooks -----
  { signal: "provenance_hooks", rule: "c2pa_or_watermark", pattern: /\b(?:c2pa|invisible[_-]?watermark|stable[_-]?signature|synthid|watermark_image|watermark_text)/gi },

  // ----- pii_signals -----
  { signal: "pii_signals", rule: "pii_keywords", pattern: /\b(?:email|ssn|social_security|passport_number|driver_license|phone_number|home_address|date_of_birth|credit_card)\b/gi },
  { signal: "pii_signals", rule: "pii_redaction_present", pattern: /\b(?:redact|mask_pii|scrub_pii|anonymi[sz]e|pseudonymi[sz]e)/gi },

  // ----- bio_health_signals -----
  { signal: "bio_health_signals", rule: "health_terms", pattern: /\b(?:patient|diagnosis|prescription|clinical|electronic_health_record|EHR|HIPAA|ICD-?10|medical_record|treatment_plan)\b/gi },

  // ----- employment_signals -----
  { signal: "employment_signals", rule: "employment_terms", pattern: /\b(?:resume|curriculum_vitae|\bcv\b|candidate|applicant|job_application|hiring_decision|ATS|applicant_tracking|recruit|interview_score)\b/gi },

  // ----- bio_metric_signals -----
  { signal: "bio_metric_signals", rule: "biometric_terms", pattern: /\b(?:face_recognition|facial_recognition|voice_id|voiceprint|iris_scan|fingerprint|gait_recognition|biometric)\b/gi },

  // ----- education_signals -----
  { signal: "education_signals", rule: "education_terms", pattern: /\b(?:student_grade|admissions_decision|exam_proctoring|essay_scoring|gpa_predict|academic_dishonesty|plagiarism_detect)\b/gi },

  // ----- law_enforcement_signals -----
  { signal: "law_enforcement_signals", rule: "law_enf_terms", pattern: /\b(?:crime_risk|recidivism|offender_likelihood|police_dispatch|criminal_record|sentencing_recommend)\b/gi },

  // ----- migration_signals -----
  { signal: "migration_signals", rule: "migration_terms", pattern: /\b(?:visa_application|asylum|border_control|migration_risk|deportation)\b/gi },

  // ----- justice_signals -----
  { signal: "justice_signals", rule: "justice_terms", pattern: /\b(?:legal_ruling|verdict_predict|judicial_decision|democratic_process|election_influence)\b/gi },

  // ----- essential_services_signals -----
  { signal: "essential_services_signals", rule: "essential_terms", pattern: /\b(?:credit_score|loan_decision|insurance_premium|welfare_eligibility|public_benefit)\b/gi },

  // ----- critical_infra_signals -----
  { signal: "critical_infra_signals", rule: "infra_terms", pattern: /\b(?:scada|industrial_control|power_grid|water_treatment|traffic_signal_control|pipeline_safety)\b/gi },

  // ----- content_generation_signals -----
  { signal: "content_generation_signals", rule: "content_gen_pattern", pattern: /\b(?:generate_image|stable[_-]?diffusion|dall-?e|midjourney|sora|elevenlabs|whisper\.generate|text_to_speech|tts_engine|image_generation|video_generation|face_swap|voice_clone)\b/gi },

  // ----- emotion_recognition_signals -----
  { signal: "emotion_recognition_signals", rule: "emotion_terms", pattern: /\b(?:emotion_detect|emotion_recognition|sentiment_score|affect_recognition|facial_emotion|micro_expression)\b/gi },

  // ----- data_io -----
  { signal: "data_io", rule: "http_external_io", pattern: /\b(?:requests\.get|requests\.post|fetch\(|axios\.|urllib\.request)/g },
  { signal: "data_io", rule: "scraping_pattern", pattern: /\b(?:beautifulsoup|BeautifulSoup|scrapy|playwright|puppeteer|cheerio\.load)\b/g },
];

// Signals that should fire from documentation/markdown content (where mention
// of the topic is itself meaningful — e.g. SECURITY.md discussing rate limits).
// Everything else only fires from real source code, since markdown listings,
// READMEs, and curated link-lists trip the keyword detectors falsely.
const MARKDOWN_ELIGIBLE_SIGNALS: Set<SignalId> = new Set<SignalId>([
  "governance_docs",
  "provenance_hooks",
]);

function scanFile(
  rel: string,
  content: string,
  ext: string,
  acc: Record<SignalId, EvidenceRecord[]>,
  meta: Partial<Record<SignalId, Record<string, unknown>>>,
) {
  const isMarkdown = ext === ".md" || ext === ".mdx";

  for (const rule of PATTERNS) {
    if (isMarkdown && !MARKDOWN_ELIGIBLE_SIGNALS.has(rule.signal)) {
      continue;
    }
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    let hits = 0;
    while ((match = rule.pattern.exec(content)) !== null) {
      hits++;
      if (hits > 5) break; // cap per file
      const line = content.slice(0, match.index).split("\n").length;
      const snippet = content
        .slice(Math.max(0, match.index - 20), match.index + 120)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
      acc[rule.signal].push({
        file: rel,
        lines: [line, line],
        snippet,
        rule: rule.rule,
        detail: match[1] ?? undefined,
      });
    }
    if (hits > 0 && rule.rule.startsWith("model_string_")) {
      const mm = (meta.model_usage ??= { models: new Set<string>() }) as {
        models: Set<string>;
      };
      const re = new RegExp(rule.pattern.source, rule.pattern.flags.replace("g", ""));
      const m = re.exec(content);
      if (m?.[1]) mm.models.add(m[1]);
    }
  }
}
