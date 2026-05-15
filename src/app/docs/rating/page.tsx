import { DocsShell } from "../_layout-shell";
import { getLocale } from "@/i18n/server";

export const metadata = {
  title: "How rating works — 8RR8",
};

export default async function RatingDocs() {
  const locale = await getLocale();
  return (
    <DocsShell locale={locale}>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
        Rating
      </p>
      <h1 className="font-serif text-4xl font-bold text-ink-900">
        How a score is calculated
      </h1>
      <p className="text-lg text-ink-600">
        Every clause produces a verdict and a 0–4 ordinal score. Per-regulation
        averages roll up; the overall score is the mean across in-scope numeric
        verdicts.
      </p>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        1 — Per-clause rule scoring
      </h2>
      <p>
        Each clause in the regulation YAML pack defines a list of named
        deterministic rules with weights:
      </p>
      <pre className="text-sm">{`checker:
  deterministic:
    - rule: structured_logging_imported
      weight: 0.3
    - rule: logging_at_tool_call_boundaries
      weight: 0.5
    - rule: logging_persistent_sink
      weight: 0.2`}</pre>
      <p>
        Each named rule (implemented in{" "}
        <a
          href="https://github.com/drhus/ai-auditor/blob/main/src/pipeline/checkers/rules.ts"
          target="_blank"
          rel="noreferrer"
        >
          <code>src/pipeline/checkers/rules.ts</code>
        </a>
        ) takes the RECON signals + file inventory + worktree and returns a
        score in <code>[0, 1]</code> plus evidence records.
      </p>
      <p>
        The clause&rsquo;s raw score is the weight-normalised sum:
      </p>
      <pre className="text-sm">{`rawScore = Σ(rule.weight × rule.score) / Σ(rule.weight)`}</pre>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        2 — Raw → ordinal mapping
      </h2>
      <p>
        Raw scores map to a 0–4 ordinal scale. Same scale across every
        regulation, so per-clause results are comparable.
      </p>
      <div className="not-prose my-6 overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-left font-mono text-[10px] uppercase tracking-widest text-ink-400">
            <tr>
              <th className="px-4 py-2">Raw range</th>
              <th className="px-4 py-2">Ordinal</th>
              <th className="px-4 py-2">Verdict</th>
              <th className="px-4 py-2">Meaning</th>
            </tr>
          </thead>
          <tbody className="text-ink-900">
            <Row raw="≥ 0.85" ord="4" verdict="pass" colour="pass" meaning="Strong evidence the clause is met" />
            <Row raw="0.65–0.85" ord="3" verdict="pass" colour="pass" meaning="Adequate evidence; minor gaps" />
            <Row raw="0.40–0.65" ord="2" verdict="partial" colour="partial" meaning="Some controls present, incomplete" />
            <Row raw="0.15–0.40" ord="1" verdict="fail" colour="fail" meaning="Inadequate; significant gaps" />
            <Row raw="< 0.15" ord="0" verdict="fail" colour="fail" meaning="Absent; no evidence found" />
          </tbody>
        </table>
      </div>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        3 — Polarity (the Article 5 trick)
      </h2>
      <p>
        Most clauses are <strong>positive</strong>: more evidence of the
        control = better. But{" "}
        <strong>prohibition clauses</strong> like Article 5 (subliminal
        techniques, predictive policing solely from profiling, untargeted
        facial scraping, …) are{" "}
        <strong>negative</strong>: any evidence of the prohibited practice =
        violation. The pipeline detects these via the{" "}
        <code>score_mapping.pass_default</code> field on the clause and{" "}
        <em>inverts</em> the ordinal mapping:
      </p>
      <ul>
        <li>
          Raw <code>0.00</code> (no signal at all) → ordinal{" "}
          <strong>4 · pass</strong> (no prohibited practice detected).
        </li>
        <li>
          Raw <code>1.00</code> (signal everywhere) → ordinal{" "}
          <strong>0 · fail</strong> (clear violation evidence).
        </li>
      </ul>
      <p>
        This is why a stock LangChain app correctly passes Art 5(1)(a)
        &ldquo;subliminal techniques&rdquo; — the prompt-pattern detector
        finds no dark-pattern phrasings, so raw → 0 → pass.
      </p>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        4 — Per-regulation + overall aggregation
      </h2>
      <ul>
        <li>
          Per-regulation score = arithmetic mean of ordinal scores across that
          regulation&rsquo;s in-scope clauses (excludes n/a + external).
        </li>
        <li>
          Overall score = arithmetic mean across <em>all</em> in-scope numeric
          verdicts (treats every clause equally, no inter-regulation
          weighting in V0).
        </li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        5 — Special verdicts
      </h2>
      <ul>
        <li>
          <strong>n/a</strong> — clause exists but isn&rsquo;t in scope for
          this risk classification (e.g. Art 12 logging requires high-risk;
          on a minimal-risk agent, it&rsquo;s n/a).
        </li>
        <li>
          <strong>external</strong> — clause is classified as not auditable
          from code alone (e.g. real-time biometric ID in public spaces:
          deployment context required). Surfaced to the human reviewer
          separately.
        </li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-ink-900 mt-10">
        6 — Future: LLM-judge fallback
      </h2>
      <p>
        For clauses whose raw score lands in the ambiguous band{" "}
        <code>[0.3, 0.7]</code>, V1 will invoke an LLM judge with the clause
        text plus the relevant code chunks. The judge produces an independent
        verdict; disagreement with the deterministic result downgrades the
        verdict to <code>partial</code> with a note. The hook is structurally
        present in the pipeline; the call is stubbed in V0.
      </p>
    </DocsShell>
  );
}

function Row({
  raw,
  ord,
  verdict,
  colour,
  meaning,
}: {
  raw: string;
  ord: string;
  verdict: string;
  colour: "pass" | "partial" | "fail";
  meaning: string;
}) {
  const bg =
    colour === "pass"
      ? "bg-[var(--color-pass)]"
      : colour === "partial"
        ? "bg-[var(--color-partial)]"
        : "bg-[var(--color-fail)]";
  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-4 py-2 font-mono text-xs">{raw}</td>
      <td className="px-4 py-2 font-mono">{ord}</td>
      <td className="px-4 py-2">
        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-50 ${bg}`}>
          {verdict}
        </span>
      </td>
      <td className="px-4 py-2 text-sm">{meaning}</td>
    </tr>
  );
}
