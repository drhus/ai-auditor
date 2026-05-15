// Shared types for the audit pipeline.
//
// Stages are typed I/O contracts:
//   INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT
//
// Each stage takes the prior stage's output (plus the bundle of earlier
// artefacts) and returns its own.

// ---------- Inputs ----------

export interface AuditInput {
  // Identification
  auditId: string;                       // ULID
  source: AuditSource;                   // how the user got here
  repoUrl: string;                       // github URL (always resolved before audit)
  ref?: string;                          // commit sha / branch — pinned by FETCH
  // Scope selection
  regulations: string[];                 // e.g. ["eu-ai-act-2024-08", "nist-ai-rmf-1.0"]
  // Metadata for on-chain anchoring (filled by later stages)
  agentId?: string;                      // ERC-8004 tokenId if known
  chain?: string;                        // ERC-8004 chain slug if known
}

export type AuditSource =
  | { kind: "agent"; chain: string; tokenId: string }
  | { kind: "repo"; owner: string; repo: string };

// ---------- FETCH ----------

export interface FetchResult {
  repoUrl: string;
  owner: string;
  repo: string;
  ref: string;                           // resolved commit SHA at fetch time
  commitSha: string;                     // alias for ref, kept for clarity downstream
  treeSha?: string;                      // root tree SHA if we computed it
  worktreeDir: string;                   // absolute path to extracted tree
  fileCount: number;
  totalBytes: number;
  languages: Record<string, number>;     // bytes per language
  inventory: FileInventory;
  fetchedAt: string;
}

export interface FileInventory {
  hasReadme: boolean;
  hasLicense: boolean;
  hasModelCard: boolean;                 // MODEL_CARD.md / model-card.md
  hasDataCard: boolean;
  hasRiskRegister: boolean;
  hasThreatModel: boolean;
  hasSecurityMd: boolean;
  hasPrivacyMd: boolean;
  hasCodeOfConduct: boolean;
  hasContributing: boolean;
  hasCiWorkflows: boolean;
  hasEvalDir: boolean;
  hasTestsDir: boolean;
  governanceDocFiles: string[];          // paths discovered
  configFiles: string[];                 // package.json, pyproject.toml, etc.
}

// ---------- RECON ----------

export type SignalId =
  | "agent_framework"
  | "model_usage"
  | "logging_hooks"
  | "oversight_hooks"
  | "eval_artefacts"
  | "governance_docs"
  | "cybersec_hooks"
  | "provenance_hooks"
  | "data_io"
  | "pii_signals"
  | "bio_health_signals"
  | "employment_signals"
  | "bio_metric_signals"
  | "education_signals"
  | "law_enforcement_signals"
  | "migration_signals"
  | "justice_signals"
  | "essential_services_signals"
  | "critical_infra_signals"
  | "content_generation_signals"
  | "emotion_recognition_signals";

export interface EvidenceRecord {
  file: string;                          // path relative to worktreeDir
  lines?: [number, number];              // [start, end] 1-indexed inclusive
  snippet?: string;                      // up to ~200 chars
  rule?: string;                         // which detector / checker rule fired
  detail?: string;                       // free-text note
}

export interface SignalResult {
  signal: SignalId;
  fired: boolean;                        // any evidence found at all
  strength: number;                      // 0..1 — qualitative density
  evidence: EvidenceRecord[];
  meta?: Record<string, unknown>;        // detector-specific extras
}

export interface ReconResult {
  signals: Record<SignalId, SignalResult>;
}

// ---------- SCOPE & MAP ----------

export interface ScopeResult {
  regulationIds: string[];               // packs in scope (echoes input.regulations)
  notes: string[];                       // free-text rationale (logged for transparency)
}

export type RiskClassification =
  | "high"          // Art 6(2) + Annex III, or Art 6(1) safety component
  | "limited"       // Art 50 transparency obligations
  | "minimal"       // no specific obligations beyond literacy
  | "gpai"          // general-purpose AI model provider
  | "unknown";

export interface MapResult {
  classification: RiskClassification;
  annexIiiCategories: string[];          // e.g. ["1", "4"]
  art50Triggers: string[];               // paragraphs ("50(1)", "50(2)", …)
  drivingSignals: Array<{ signal: SignalId; category?: string }>;
  rationale: string[];                   // human-readable bullets
}

// ---------- CHECK & VERIFY ----------

export type Verdict = "pass" | "partial" | "fail" | "n/a" | "external";

export interface CheckResult {
  clauseId: string;                      // e.g. "eu-ai-act/art-12/p1"
  regulationId: string;
  article: string;
  title: string;
  verdict: Verdict;
  score: number;                         // 0..4 (mapped); NaN for n/a / external
  rawScore: number;                      // 0..1 from rules
  evidence: EvidenceRecord[];
  rules: Array<{ rule: string; matched: number; weight: number }>;
  rationale: string;
  confidence: number;                    // 0..1
  needsLlmJudge: boolean;
}

export type VerifyResult = CheckResult & {
  verified: boolean;                     // V0: always true (verify pass-through)
  verifyMethod: "deterministic-only" | "llm-judge" | "skipped";
};

// ---------- GRADE & REPORT ----------

export interface SectionScore {
  regulationId: string;
  scoreAvg: number;                      // mean over in-scope numeric clauses
  passCount: number;
  partialCount: number;
  failCount: number;
  externalCount: number;
  naCount: number;
}

export interface GradeResult {
  overallScore: number;                  // 0..4 weighted across regulation packs
  perRegulation: SectionScore[];
}

export interface AuditReport {
  auditId: string;
  source: AuditSource;
  input: AuditInput;
  fetch: FetchResult;
  recon: ReconResult;
  scope: ScopeResult;
  map: MapResult;
  checks: VerifyResult[];
  grade: GradeResult;
  // Identity for downstream on-chain anchoring (not yet emitted in V0)
  bundleHash: string;
  checkerVersion: string;
  regulationsVersions: Record<string, string>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  // Open externals — clauses we cannot auto-score
  externalControls: Array<{
    clauseId: string;
    article: string;
    title: string;
    note: string;
  }>;
}

// ---------- Regulation pack schema (parsed from YAML) ----------

export interface RegulationPack {
  id: string;                            // versioned, matches YAML filename ("eu-ai-act-2024-08")
  familyId: string;                      // family slug ("eu-ai-act")
  fullName: string;
  version: string;
  source: string;
  consolidatedIndex?: string;
  companionDocs?: string[];
  enforcementDates: Array<{ phase: string; date: string }>;
  clauseIdNamespace: number;
  annexIiiTriggers?: Array<{
    signal: SignalId;
    category: string;
    description: string;
  }>;
  art50Triggers?: Array<{
    signal: SignalId;
    paragraph: string;
    description: string;
  }>;
  clauses: ClauseSpec[];
  packSha: string;                       // SHA-256 of YAML source
}

export interface ClauseSpec {
  id: string;
  clauseIdBytes: number;
  article: string;
  title: string;
  subject: string[];
  classification: "code" | "mixed" | "external";
  text: string;
  inScopeWhen: {
    always?: boolean;
    riskClassifications?: RiskClassification[];
    annexIiiCategories?: string[];
    art50Triggers?: SignalId[];
  };
  signalsRequired: SignalId[];
  checker?: {
    deterministic?: Array<{
      rule: string;
      weight: number;
      description?: string;
    }>;
    llmJudge?: {
      invokeWhen: string;
      promptId?: string;
      maxInputChunks?: number;
    };
  };
  scoreMapping?: Record<string, number>;
  evidenceSchema?: string[];
  remediationHint?: string;
  externalNotes?: string;
  deprecated?: boolean;
}

// ---------- Pipeline status (in-memory store) ----------

export type PipelineStatus =
  | "queued"
  | "fetching"
  | "recon"
  | "scope"
  | "map"
  | "check"
  | "verify"
  | "grade"
  | "reporting"
  | "completed"
  | "failed";

export interface PipelineState {
  auditId: string;
  status: PipelineStatus;
  startedAt: string;
  updatedAt: string;
  error?: string;
  report?: AuditReport;
  progressNote?: string;                 // free-text update per stage transition
}
