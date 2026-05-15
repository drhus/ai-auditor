import { DocsShell } from "../_layout-shell";
import { getLocale } from "@/i18n/server";

export const metadata = {
  title: "Methodology — 8RR8",
};

const STAGES = [
  {
    n: "01",
    name: "INTAKE",
    purpose:
      "Accepts an ERC-8004 agent URL, a raw 8004 agentId, or a GitHub repo URL. Resolves which type of input you gave us.",
    output: "Audit ID + parsed source",
    src: "src/pipeline/run.ts",
  },
  {
    n: "02",
    name: "FETCH",
    purpose:
      "Downloads the repo as a GitHub tarball (no `git` shell-out — works in serverless), pins a concrete commit SHA, extracts to an ephemeral sandbox, builds a file inventory (governance docs present? CI workflows? eval dir?).",
    output: "worktree dir, commitSha, fileCount, languages, FileInventory",
    src: "src/pipeline/stages/fetch.ts",
  },
  {
    n: "03",
    name: "RECON",
    purpose:
      "Single-pass scanner. For every text-readable source file (size-capped), applies regex + AST patterns against 21 named signals: agent_framework, logging_hooks, oversight_hooks, eval_artefacts, biometric, employment, content_generation, and so on. Each match contributes evidence to one or more signals.",
    output: "ReconResult — signals × evidence records",
    src: "src/pipeline/stages/recon.ts",
  },
  {
    n: "04",
    name: "SCOPE",
    purpose:
      "Selects which regulation packs to audit against. V0 echoes the user's choice; V1+ will narrow by jurisdiction and broaden by detected signals (e.g. content_generation auto-includes Article 50(2)).",
    output: "ScopeResult — list of regulation pack IDs",
    src: "src/pipeline/stages/scope.ts",
  },
  {
    n: "05",
    name: "MAP",
    purpose:
      "Cross-clause reasoning: derives the risk classification (high / limited / minimal / gpai). For EU AI Act, fires Annex III triggers based on RECON signals (e.g. employment_signals → Annex III §4) and Article 50 triggers from generation/emotion signals.",
    output: "MapResult — classification, annexIiiCategories, art50Triggers, rationale",
    src: "src/pipeline/stages/map.ts",
  },
  {
    n: "06",
    name: "CHECK",
    purpose:
      "Runs each in-scope clause's deterministic rules. Each rule returns a [0..1] score and evidence records. Weighted aggregation produces a per-clause raw score; raw → 0..4 ordinal verdict. Prohibition clauses (Art 5) invert: signal found = violation = fail.",
    output: "CheckResult per clause — verdict, score, rules breakdown, evidence",
    src: "src/pipeline/stages/check.ts + src/pipeline/checkers/rules.ts",
  },
  {
    n: "07",
    name: "VERIFY",
    purpose:
      "Pass-through stub in V0. V1 will invoke an LLM judge on clauses whose raw score lands in the ambiguous band [0.3, 0.7]. Disagreements downgrade verdict.",
    output: "VerifyResult per clause",
    src: "src/pipeline/stages/verify.ts",
  },
  {
    n: "08",
    name: "GRADE",
    purpose:
      "Aggregates verdicts to per-regulation averages and an overall score. Excludes n/a + external from the mean.",
    output: "GradeResult — overallScore + perRegulation breakdown",
    src: "src/pipeline/stages/grade.ts",
  },
  {
    n: "09",
    name: "REPORT",
    purpose:
      "Assembles the final AuditReport, computes the canonical bundleHash = sha256 of the stable parts (commit, regulations versions, checker version, sorted clause verdicts). The hash is what gets posted on chain in V1.",
    output: "AuditReport — durable, shareable, reproducible",
    src: "src/pipeline/stages/report.ts",
  },
];

export default async function MethodologyDocs() {
  const locale = await getLocale();
  return (
    <DocsShell locale={locale}>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
        Methodology
      </p>
      <h1 className="font-serif text-4xl font-bold text-ink-900">
        The audit pipeline, end to end
      </h1>
      <p className="text-lg text-ink-600">
        9 stages, typed input/output between each. Every stage is open source;
        every artefact is reproducible.
      </p>

      <div className="not-prose my-8 rounded-lg border border-ink-200 bg-ink-50 p-5 font-mono text-xs text-ink-900">
        INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT
      </div>

      <div className="not-prose space-y-6">
        {STAGES.map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-ink-200 bg-white p-5"
          >
            <p className="mb-1 flex items-baseline gap-3">
              <span className="font-mono text-xs text-ink-400">{s.n}</span>
              <span className="font-serif text-xl font-bold text-ink-900">
                {s.name}
              </span>
            </p>
            <p className="mb-3 text-sm text-ink-600">{s.purpose}</p>
            <p className="font-mono text-[11px] text-ink-400">
              <span className="uppercase tracking-widest">Output</span> ·{" "}
              <span className="text-ink-900">{s.output}</span>
            </p>
            <p className="font-mono text-[11px] text-ink-400">
              <span className="uppercase tracking-widest">Code</span> ·{" "}
              <a
                href={`https://github.com/drhus/ai-auditor/blob/main/${s.src.split(" + ")[0]}`}
                target="_blank"
                rel="noreferrer"
                className="text-ink-900"
              >
                {s.src}
              </a>
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Reproducibility contract
      </h2>
      <p>
        For an audit to be third-party verifiable, four inputs must be pinned
        and re-derivable from the on-chain attestation:
      </p>
      <ul>
        <li>
          <code>commitSha</code> — exactly which version of the audited repo
          we read.
        </li>
        <li>
          <code>regulationsVersion</code> — sha256 of the regulation YAML pack
          used.
        </li>
        <li>
          <code>checkerVersion</code> — pinned git SHA of the checker code at
          audit time.
        </li>
        <li>
          <code>bundleHash</code> — sha256 of canonical-JSON over all the
          above plus the sorted clause verdicts.
        </li>
      </ul>
      <p>
        Anyone can clone our checker at <code>checkerVersion</code>, clone the
        audited repo at <code>commitSha</code>, load the regulation pack at{" "}
        <code>regulationsVersion</code>, run the pipeline, and compute their
        own <code>bundleHash</code>. If it matches the on-chain hash, the
        audit is honest. If not, one of the inputs drifted.
      </p>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Acknowledgement
      </h2>
      <p>
        The multi-stage security-audit pattern that inspired this
        regulation-audit pipeline comes from prior work in agentic security
        tooling — notably the orchestrated{" "}
        <code>RECON → HUNT → VERIFY → GRADE → REPORT</code> flow popularised
        by{" "}
        <a
          href="https://github.com/vmihalis/hacker-bob"
          target="_blank"
          rel="noreferrer"
        >
          hacker-bob
        </a>
        .
      </p>
    </DocsShell>
  );
}
