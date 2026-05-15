import { DocsShell } from "../_layout-shell";
import { loadRegulationPack } from "@/pipeline/loader";
import { getLocale } from "@/i18n/server";

export const metadata = {
  title: "Regulations — 8RR8",
};

const PACKS = [
  {
    id: "eu-ai-act-2024-08",
    blurb:
      "Regulation (EU) 2024/1689. Full applicability 2 August 2026. We audit Articles 5, 6+Annex III, 9–15, 26, and 50 — the code-checkable subset.",
    source: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    explorer: "https://artificialintelligenceact.eu/",
  },
  {
    id: "nist-ai-rmf-1.0",
    blurb:
      "NIST AI 100-1 (January 2023). Voluntary US framework; the de facto reference for enterprise procurement. We audit code-mappable subcategories across GOVERN, MAP, MEASURE, MANAGE.",
    source: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf",
    explorer: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
];

export default async function RegulationsDocs() {
  const locale = await getLocale();
  const loaded = await Promise.all(
    PACKS.map(async (p) => {
      try {
        const pack = await loadRegulationPack(p.id);
        return { ...p, pack };
      } catch {
        return { ...p, pack: null };
      }
    }),
  );

  return (
    <DocsShell locale={locale}>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
        Regulations
      </p>
      <h1 className="font-serif text-4xl font-bold text-ink-900">
        Which packs we audit against
      </h1>
      <p className="text-lg text-ink-600">
        Each regulation is decomposed into atomic clauses in a versioned YAML
        pack on GitHub. Every clause has verbatim regulation text, a
        deterministic rule spec, score mapping, remediation hint, and a stable
        16-bit ID for on-chain anchoring.
      </p>

      <div className="not-prose mt-10 space-y-6">
        {loaded.map((p) => (
          <div key={p.id} className="rounded-lg border border-ink-200 bg-white p-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-2xl font-bold text-ink-900">
                {p.pack?.fullName ?? p.id}
              </h2>
              <span className="rounded bg-ink-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-600">
                v{p.pack?.version ?? "—"}
              </span>
            </div>
            <p className="mb-3 text-ink-600">{p.blurb}</p>

            {p.pack && (
              <div className="mb-3 grid gap-2 font-mono text-[11px] text-ink-600 sm:grid-cols-3">
                <p>
                  <span className="text-ink-400">Clauses · </span>
                  <span className="text-ink-900">{p.pack.clauses.length}</span>
                </p>
                <p>
                  <span className="text-ink-400">Code · </span>
                  <span className="text-ink-900">
                    {p.pack.clauses.filter((c) => c.classification === "code").length}
                  </span>
                </p>
                <p>
                  <span className="text-ink-400">External · </span>
                  <span className="text-ink-900">
                    {p.pack.clauses.filter((c) => c.classification === "external").length}
                  </span>
                </p>
              </div>
            )}

            {p.pack?.enforcementDates.length && p.pack.enforcementDates.length > 0 && (
              <details className="mb-3">
                <summary className="cursor-pointer font-mono text-xs text-ink-600 hover:text-ink-900">
                  Enforcement timeline
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-ink-600">
                  {p.pack.enforcementDates.map((e) => (
                    <li key={e.phase}>
                      <code className="text-ink-900">{e.phase}</code> ·{" "}
                      {e.date}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {p.pack && p.pack.clauses.length > 0 && (
              <details className="mb-3">
                <summary className="cursor-pointer font-mono text-xs text-ink-600 hover:text-ink-900">
                  All {p.pack.clauses.length} clauses
                </summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {p.pack.clauses.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] text-ink-400">
                        {c.article}
                      </span>
                      <span className="text-ink-900">{c.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                          c.classification === "code"
                            ? "bg-[var(--color-pass)] text-ink-50"
                            : c.classification === "mixed"
                              ? "bg-[var(--color-partial)] text-ink-50"
                              : "bg-ink-600 text-ink-50"
                        }`}
                      >
                        {c.classification}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
              <a
                href={`https://github.com/drhus/ai-auditor/blob/main/regulations/${p.id}.yaml`}
                target="_blank"
                rel="noreferrer"
              >
                YAML on GitHub ↗
              </a>
              <a href={p.source} target="_blank" rel="noreferrer">
                Official source ↗
              </a>
              <a href={p.explorer} target="_blank" rel="noreferrer">
                Reference explorer ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Versioning
      </h2>
      <p>
        Each pack is named <code>{`{regulation-id}-{version}.yaml`}</code>.
        The <code>regulationsVersion</code> anchored on chain is the sha256 of
        the YAML file content at audit time. Future revisions ship as new
        files (e.g. <code>eu-ai-act-2024-08.yaml</code> →{" "}
        <code>eu-ai-act-2025-03.yaml</code>); clause IDs stay stable across
        versions so re-audit diffs remain comparable.
      </p>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Planned
      </h2>
      <ul>
        <li>
          <strong>ISO/IEC 42001</strong> — AI management system standard.
          Overlaps with NIST RMF on the code-side; deferred to V1.5.
        </li>
        <li>
          <strong>UK AI Safety Institute</strong> frameworks — alignment guide
          + evaluation protocols.
        </li>
        <li>
          <strong>China&rsquo;s GenAI Measures</strong> — generative-AI
          service provider obligations.
        </li>
        <li>
          <strong>Japan&rsquo;s AI Promotion Act</strong> — operator
          obligations once finalised.
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Contributing a clause
      </h2>
      <p>
        Edit the YAML pack in{" "}
        <a
          href="https://github.com/drhus/ai-auditor/tree/main/regulations"
          target="_blank"
          rel="noreferrer"
        >
          <code>regulations/</code>
        </a>
        , add a rule implementation to{" "}
        <a
          href="https://github.com/drhus/ai-auditor/blob/main/src/pipeline/checkers/rules.ts"
          target="_blank"
          rel="noreferrer"
        >
          <code>src/pipeline/checkers/rules.ts</code>
        </a>
        , and open a PR. The schema is documented in{" "}
        <a
          href="https://github.com/drhus/ai-auditor/blob/main/regulations/schema.md"
          target="_blank"
          rel="noreferrer"
        >
          <code>regulations/schema.md</code>
        </a>
        .
      </p>
    </DocsShell>
  );
}
