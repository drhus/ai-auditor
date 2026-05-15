import type { AuditReport, EvidenceRecord, VerifyResult } from "@/pipeline/types";

interface Props {
  report: AuditReport;
}

const REG_LABEL: Record<string, string> = {
  "eu-ai-act-2024-08": "EU AI Act · 2024-08",
  "nist-ai-rmf-1.0": "NIST AI RMF · 1.0",
};

const RISK_COLOUR: Record<string, string> = {
  high: "bg-[var(--color-fail)]",
  limited: "bg-[var(--color-partial)]",
  minimal: "bg-[var(--color-pass)]",
  gpai: "bg-[var(--color-accent)]",
  unknown: "bg-ink-600",
};

export function RichReport({ report }: Props) {
  const { fetch: f, map, grade, checks, externalControls } = report;
  const verdicts = countVerdicts(checks);

  const top5Remediations = checks
    .filter((c) => c.verdict === "fail" || c.verdict === "partial")
    .sort((a, b) => a.rawScore - b.rawScore)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <Headline report={report} verdicts={verdicts} />

      <NutritionalFactsLabel report={report} />

      {top5Remediations.length > 0 && (
        <PrioritisedRemediation items={top5Remediations} report={report} />
      )}

      <ClausesByArticle checks={checks} report={report} />

      {externalControls.length > 0 && (
        <ExternalsBlock externals={externalControls} />
      )}

      <TrustFooter report={report} />
    </div>
  );
}

// -----------------------------------------------------------------------------

function Headline({
  report,
  verdicts,
}: {
  report: AuditReport;
  verdicts: ReturnType<typeof countVerdicts>;
}) {
  const risk = report.map.classification;
  const riskBadge = RISK_COLOUR[risk] ?? RISK_COLOUR.unknown;
  return (
    <header className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-400">
        Repository
      </p>
      <h1 className="mb-3 font-serif text-3xl font-bold text-ink-900">
        <a
          href={`${report.fetch.repoUrl}/tree/${report.fetch.commitSha}`}
          target="_blank"
          rel="noreferrer"
          className="no-underline hover:underline"
        >
          {report.fetch.owner}/{report.fetch.repo}
        </a>
      </h1>
      <p className="mb-4 font-mono text-xs text-ink-600">
        @ {report.fetch.commitSha.slice(0, 12)} · {report.fetch.fileCount} files
        scanned · {(report.fetch.totalBytes / 1024).toFixed(0)} KB
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Risk classification
          </p>
          <p className="mt-1">
            <span className={`rounded px-2 py-0.5 font-mono text-xs uppercase text-ink-50 ${riskBadge}`}>
              {risk}
            </span>
          </p>
          {report.map.annexIiiCategories.length > 0 && (
            <p className="mt-1 text-xs text-ink-600">
              Annex III §{report.map.annexIiiCategories.join(", §")}
            </p>
          )}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Overall score
          </p>
          <p className="mt-1 font-serif text-3xl font-bold text-ink-900">
            {report.grade.overallScore.toFixed(2)}
            <span className="text-base font-normal text-ink-400"> / 4.0</span>
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Verdicts
          </p>
          <p className="mt-1 flex gap-2 text-xs">
            <span className="rounded bg-[var(--color-pass)] px-1.5 py-0.5 text-ink-50">
              {verdicts.pass} pass
            </span>
            <span className="rounded bg-[var(--color-partial)] px-1.5 py-0.5 text-ink-50">
              {verdicts.partial} partial
            </span>
            <span className="rounded bg-[var(--color-fail)] px-1.5 py-0.5 text-ink-50">
              {verdicts.fail} fail
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-600">
            +{verdicts.external} external · {verdicts.na} n/a
          </p>
        </div>
      </div>

      {report.map.rationale.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-xs text-ink-600 hover:text-ink-900">
            Why this classification?
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-ink-600">
            {report.map.rationale.map((r, i) => (
              <li key={i}>— {r}</li>
            ))}
          </ul>
        </details>
      )}
    </header>
  );
}

function NutritionalFactsLabel({ report }: { report: AuditReport }) {
  return (
    <div className="rounded-lg border-2 border-ink-900 bg-white p-5 font-mono text-xs leading-tight text-ink-900">
      <p className="mb-1 font-serif text-base font-bold uppercase tracking-wide">
        AI Agent Audit Facts
      </p>
      <p className="text-[10px] text-ink-600">
        {report.fetch.repoUrl} @ {report.fetch.commitSha.slice(0, 8)}
      </p>
      <p className="mb-3 text-[10px] text-ink-600">
        Audited {new Date(report.completedAt).toISOString().slice(0, 10)} ·{" "}
        {report.auditId}
      </p>
      <hr className="border-ink-900" />
      <Row label="Overall score" strong>
        {report.grade.overallScore.toFixed(2)} / 4.0
      </Row>
      {report.grade.perRegulation.map((s) => (
        <div key={s.regulationId} className="mt-2">
          <Row label={REG_LABEL[s.regulationId] ?? s.regulationId} strong>
            {Number.isFinite(s.scoreAvg) ? s.scoreAvg.toFixed(2) : "—"} / 4.0
          </Row>
          <p className="pl-2 text-[10px] text-ink-600">
            ●{s.passCount} ◐{s.partialCount} ○{s.failCount} ✕{s.externalCount}{" "}
            —{s.naCount}
          </p>
        </div>
      ))}
      <hr className="my-2 border-ink-900" />
      <p className="text-[10px] text-ink-600">
        Bundle <code>{report.bundleHash.slice(0, 16)}…</code> · Checker{" "}
        {report.checkerVersion} · Duration {report.durationMs} ms
      </p>
    </div>
  );
}

function PrioritisedRemediation({
  items,
  report,
}: {
  items: VerifyResult[];
  report: AuditReport;
}) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        Top remediation
      </p>
      <h2 className="mb-4 font-serif text-2xl font-bold text-ink-900">
        Fix these first
      </h2>
      <ol className="space-y-3">
        {items.map((c, i) => (
          <li key={c.clauseId} className="flex gap-4">
            <span className="font-serif text-2xl font-bold text-ink-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <p className="font-mono text-xs text-ink-400">{c.article}</p>
              <p className="font-medium text-ink-900">{c.title}</p>
              <p className="mt-1 text-sm text-ink-600">
                Current verdict: <strong>{c.verdict}</strong> ({c.score.toFixed(1)} / 4.0)
              </p>
              {c.evidence.length > 0 && (
                <p className="mt-1 text-xs text-ink-600">
                  Evidence in{" "}
                  <a
                    href={ghPermalink(report, c.evidence[0])}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono"
                  >
                    {c.evidence[0].file}
                    {c.evidence[0].lines ? `:${c.evidence[0].lines[0]}` : ""}
                  </a>
                  {c.evidence.length > 1 && ` (+${c.evidence.length - 1} more)`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClausesByArticle({
  checks,
  report,
}: {
  checks: VerifyResult[];
  report: AuditReport;
}) {
  const grouped = groupByArticle(checks);
  const sections = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
          Full findings
        </p>
        <h2 className="font-serif text-2xl font-bold text-ink-900">
          By article
        </h2>
      </div>

      {sections.map(([sectionKey, items]) => (
        <div key={sectionKey} className="rounded-lg border border-ink-200 bg-white">
          <header className="border-b border-ink-200 px-5 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
              {sectionLabel(sectionKey)}
            </p>
            <p className="text-sm text-ink-600">
              {items.length} clause{items.length === 1 ? "" : "s"}
            </p>
          </header>
          <ul className="divide-y divide-ink-100">
            {items.map((c) => (
              <ClauseRow key={c.clauseId} clause={c} report={report} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function ClauseRow({
  clause,
  report,
}: {
  clause: VerifyResult;
  report: AuditReport;
}) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-ink-400">{clause.article}</p>
          <p className="font-medium text-ink-900">{clause.title}</p>
        </div>
        <VerdictChip verdict={clause.verdict} score={clause.score} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-600">{clause.rationale}</p>

      {clause.rules.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-ink-600 hover:text-ink-900">
            Rules ({clause.rules.length}) — score breakdown
          </summary>
          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-ink-600">
            {clause.rules.map((r) => (
              <li key={r.rule} className="flex justify-between">
                <span>{r.rule}</span>
                <span>
                  matched {(r.matched * 100).toFixed(0)}% · weight {r.weight.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {clause.evidence.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-ink-600 hover:text-ink-900">
            Evidence ({clause.evidence.length})
          </summary>
          <ul className="mt-2 space-y-2 font-mono text-[11px] text-ink-600">
            {clause.evidence.map((e, i) => (
              <li key={i}>
                <a
                  href={ghPermalink(report, e)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-900"
                >
                  {e.file}
                  {e.lines ? `:${e.lines[0]}` : ""}
                </a>
                {e.rule && <span className="ml-2 text-ink-400">[{e.rule}]</span>}
                {e.snippet && (
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-ink-50 px-2 py-1 text-[10px]">
                    {e.snippet}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

function ExternalsBlock({
  externals,
}: {
  externals: AuditReport["externalControls"];
}) {
  return (
    <section className="rounded-lg border border-ink-200 bg-ink-50 p-6">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        External controls — human review required
      </p>
      <h2 className="mb-3 font-serif text-2xl font-bold text-ink-900">
        We can&rsquo;t audit these from code alone
      </h2>
      <ul className="space-y-2">
        {externals.map((ec) => (
          <li key={ec.clauseId} className="text-sm">
            <p className="font-medium text-ink-900">
              {ec.article} — {ec.title}
            </p>
            <p className="font-mono text-[11px] text-ink-600">{ec.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrustFooter({ report }: { report: AuditReport }) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white p-5 font-mono text-xs text-ink-600">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Reproducibility footer
      </p>
      <dl className="grid gap-1 sm:grid-cols-2">
        <DefRow label="Audit ID" value={report.auditId} />
        <DefRow label="Bundle hash" value={report.bundleHash} mono />
        <DefRow label="Repo" value={report.fetch.repoUrl} />
        <DefRow label="Commit" value={report.fetch.commitSha} mono />
        <DefRow label="Checker" value={report.checkerVersion} />
        <DefRow
          label="Regulations"
          value={Object.entries(report.regulationsVersions)
            .map(([k, v]) => `${k}:${v.slice(0, 8)}`)
            .join("  ·  ")}
          mono
        />
        <DefRow label="Started" value={report.startedAt} />
        <DefRow label="Duration" value={`${report.durationMs} ms`} />
      </dl>
    </section>
  );
}

function DefRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 uppercase tracking-widest text-ink-400">
        {label}
      </dt>
      <dd className={`break-all text-ink-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function VerdictChip({
  verdict,
  score,
}: {
  verdict: "pass" | "partial" | "fail" | "n/a" | "external";
  score: number;
}) {
  const colour =
    verdict === "pass"
      ? "bg-[var(--color-pass)] text-ink-50"
      : verdict === "partial"
        ? "bg-[var(--color-partial)] text-ink-50"
        : verdict === "fail"
          ? "bg-[var(--color-fail)] text-ink-50"
          : verdict === "external"
            ? "bg-ink-600 text-ink-50"
            : "bg-ink-100 text-ink-600";
  const sc = Number.isFinite(score) ? score.toFixed(1) : "—";
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase ${colour}`}>
      {verdict} · {sc}
    </span>
  );
}

function Row({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`flex items-center justify-between py-0.5 ${
        strong ? "font-bold" : ""
      }`}
    >
      <span>{label}</span>
      <span>{children}</span>
    </p>
  );
}

// -----------------------------------------------------------------------------

function ghPermalink(report: AuditReport, e: EvidenceRecord): string {
  const { repoUrl, commitSha } = report.fetch;
  const lineFrag = e.lines ? `#L${e.lines[0]}${e.lines[1] !== e.lines[0] ? `-L${e.lines[1]}` : ""}` : "";
  return `${repoUrl}/blob/${commitSha}/${e.file}${lineFrag}`;
}

function countVerdicts(checks: VerifyResult[]) {
  const counts = { pass: 0, partial: 0, fail: 0, external: 0, na: 0 };
  for (const c of checks) {
    if (c.verdict === "pass") counts.pass++;
    else if (c.verdict === "partial") counts.partial++;
    else if (c.verdict === "fail") counts.fail++;
    else if (c.verdict === "external") counts.external++;
    else if (c.verdict === "n/a") counts.na++;
  }
  return counts;
}

function groupByArticle(checks: VerifyResult[]): Map<string, VerifyResult[]> {
  const out = new Map<string, VerifyResult[]>();
  for (const c of checks) {
    const key = sectionKeyForClause(c);
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(c);
  }
  return out;
}

function sectionKeyForClause(c: VerifyResult): string {
  if (c.regulationId === "eu-ai-act-2024-08") {
    if (c.clauseId.includes("art-5/")) return "EU-AIA:Art5";
    if (c.clauseId.includes("art-9")) return "EU-AIA:Art9";
    if (c.clauseId.includes("art-10")) return "EU-AIA:Art10";
    if (c.clauseId.includes("art-11")) return "EU-AIA:Art11";
    if (c.clauseId.includes("art-12")) return "EU-AIA:Art12";
    if (c.clauseId.includes("art-13")) return "EU-AIA:Art13";
    if (c.clauseId.includes("art-14")) return "EU-AIA:Art14";
    if (c.clauseId.includes("art-15")) return "EU-AIA:Art15";
    if (c.clauseId.includes("art-26")) return "EU-AIA:Art26";
    if (c.clauseId.includes("art-50")) return "EU-AIA:Art50";
    return "EU-AIA:Other";
  }
  if (c.regulationId === "nist-ai-rmf-1.0") {
    if (c.clauseId.includes("govern")) return "NIST:Govern";
    if (c.clauseId.includes("map")) return "NIST:Map";
    if (c.clauseId.includes("measure")) return "NIST:Measure";
    if (c.clauseId.includes("manage")) return "NIST:Manage";
  }
  return c.regulationId;
}

function sectionLabel(key: string): string {
  const map: Record<string, string> = {
    "EU-AIA:Art5": "EU AI Act — Article 5 · Prohibited practices",
    "EU-AIA:Art9": "EU AI Act — Article 9 · Risk management",
    "EU-AIA:Art10": "EU AI Act — Article 10 · Data governance",
    "EU-AIA:Art11": "EU AI Act — Article 11 · Technical documentation",
    "EU-AIA:Art12": "EU AI Act — Article 12 · Logging",
    "EU-AIA:Art13": "EU AI Act — Article 13 · Transparency to deployers",
    "EU-AIA:Art14": "EU AI Act — Article 14 · Human oversight",
    "EU-AIA:Art15": "EU AI Act — Article 15 · Accuracy, robustness, cybersecurity",
    "EU-AIA:Art26": "EU AI Act — Article 26 · Deployer obligations",
    "EU-AIA:Art50": "EU AI Act — Article 50 · Transparency to users",
    "NIST:Govern": "NIST AI RMF — GOVERN",
    "NIST:Map": "NIST AI RMF — MAP",
    "NIST:Measure": "NIST AI RMF — MEASURE",
    "NIST:Manage": "NIST AI RMF — MANAGE",
  };
  return map[key] ?? key;
}
