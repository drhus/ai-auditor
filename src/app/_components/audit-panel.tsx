"use client";

import { useEffect, useState, useTransition } from "react";

interface AuditPanelProps {
  source:
    | { kind: "repo"; owner: string; repo: string; ref?: string }
    | { kind: "agent"; chain: string; tokenId: string; repoUrl: string };
}

interface PipelineState {
  auditId: string;
  status: string;
  startedAt?: string;
  updatedAt?: string;
  progressNote?: string;
  error?: string;
  report?: AuditReport;
}

interface AuditReport {
  fetch: {
    repoUrl: string;
    commitSha: string;
    fileCount: number;
    totalBytes: number;
    languages: Record<string, number>;
  };
  map: {
    classification: string;
    annexIiiCategories: string[];
    art50Triggers: string[];
    rationale: string[];
  };
  grade: {
    overallScore: number;
    perRegulation: Array<{
      regulationId: string;
      scoreAvg: number;
      passCount: number;
      partialCount: number;
      failCount: number;
      externalCount: number;
      naCount: number;
    }>;
  };
  checks: Array<{
    clauseId: string;
    article: string;
    title: string;
    verdict: "pass" | "partial" | "fail" | "n/a" | "external";
    score: number;
    rawScore: number;
    rationale: string;
    evidence: Array<{ file: string; lines?: [number, number]; snippet?: string; rule?: string }>;
  }>;
  externalControls: Array<{ clauseId: string; article: string; title: string; note: string }>;
  bundleHash: string;
  checkerVersion: string;
  durationMs: number;
}

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  fetching: "Fetching repository",
  recon: "Scanning code for AI signals",
  scope: "Selecting regulation packs",
  map: "Classifying risk level",
  check: "Running clause checkers",
  verify: "Verifying findings",
  grade: "Scoring",
  reporting: "Assembling report",
  completed: "Audit complete",
  failed: "Failed",
};

export function AuditPanel({ source }: AuditPanelProps) {
  const [state, setState] = useState<PipelineState | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Poll while running.
  useEffect(() => {
    if (!state || state.status === "completed" || state.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/${state.auditId}`);
        if (!res.ok) return;
        const next = (await res.json()) as PipelineState;
        setState(next);
      } catch {
        /* swallow */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [state?.auditId, state?.status]);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/audit/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        const data = (await res.json()) as { auditId?: string; error?: string };
        if (!res.ok || !data.auditId) {
          setError(data?.error ?? "Could not start audit.");
          return;
        }
        setState({ auditId: data.auditId, status: "queued" });
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  if (!state) {
    return (
      <div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? "Starting…" : "Run audit"}
        </button>
        {error && (
          <p
            role="alert"
            className="mt-3 font-mono text-xs text-[var(--color-fail)]"
          >
            {error}
          </p>
        )}
        <p className="mt-3 max-w-prose text-xs text-ink-400">
          Runs the V0 pipeline: clones the repo tarball, scans for AI-system
          signals, classifies risk, scores ~35 atomic clauses across EU AI Act
          + NIST AI RMF, returns evidence-anchored verdicts.
        </p>
      </div>
    );
  }

  if (state.status !== "completed" && state.status !== "failed") {
    return <RunningView state={state} />;
  }

  if (state.status === "failed") {
    return (
      <div className="rounded-lg border-2 border-[var(--color-fail)] bg-white p-6">
        <p className="font-serif text-lg font-bold text-ink-900">Audit failed</p>
        <p className="mt-2 font-mono text-xs text-[var(--color-fail)]">
          {state.error ?? "Unknown error."}
        </p>
        <button
          type="button"
          onClick={run}
          className="mt-4 rounded-md bg-ink-900 px-4 py-2 text-xs font-semibold text-ink-50 transition hover:bg-ink-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return <CompletedView state={state} onRerun={run} />;
}

// ---------------------------------------------------------------------------

function RunningView({ state }: { state: PipelineState }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-400">
        Audit {state.auditId} · in progress
      </p>
      <p className="mb-2 font-serif text-xl font-bold text-ink-900">
        {STAGE_LABELS[state.status] ?? state.status}
      </p>
      {state.progressNote && (
        <p className="font-mono text-xs text-ink-600">{state.progressNote}</p>
      )}
      <div className="mt-4 flex h-1 overflow-hidden rounded bg-ink-100">
        <div className="h-1 w-1/2 animate-pulse bg-ink-900" />
      </div>
    </div>
  );
}

function CompletedView({
  state,
  onRerun,
}: {
  state: PipelineState;
  onRerun: () => void;
}) {
  const r = state.report;
  if (!r) return null;
  const score = r.grade.overallScore;
  return (
    <div className="space-y-6">
      <FactsLabel report={r} />
      <PerClauseTable report={r} />
      <ExternalsList report={r} />
      <div className="flex items-center justify-between gap-4 text-xs text-ink-400">
        <p className="font-mono">
          Audit {state.auditId} · {r.durationMs} ms · bundle{" "}
          <code>{r.bundleHash.slice(0, 16)}…</code> · checker {r.checkerVersion}
        </p>
        <button
          type="button"
          onClick={onRerun}
          className="rounded-md border border-ink-200 px-3 py-1.5 text-xs text-ink-900 hover:bg-ink-100"
        >
          Re-run
        </button>
      </div>
    </div>
  );
}

function FactsLabel({ report }: { report: AuditReport }) {
  const risk = report.map.classification.toUpperCase();
  const riskColour =
    risk === "HIGH"
      ? "bg-[var(--color-fail)]"
      : risk === "LIMITED"
        ? "bg-[var(--color-partial)]"
        : risk === "MINIMAL"
          ? "bg-[var(--color-pass)]"
          : "bg-ink-600";
  return (
    <div className="rounded-lg border-2 border-ink-900 bg-white p-6 font-mono text-xs leading-tight text-ink-900">
      <p className="mb-1 font-serif text-lg font-bold uppercase tracking-wide">
        AI Agent Audit Facts
      </p>
      <p className="text-[10px] text-ink-600">
        {report.fetch.repoUrl} @ {report.fetch.commitSha.slice(0, 8)}
      </p>
      <hr className="my-3 border-ink-900" />
      <div className="flex items-center justify-between">
        <span>Risk classification</span>
        <span className={`rounded px-2 py-0.5 text-ink-50 ${riskColour}`}>
          {risk}-RISK
        </span>
      </div>
      {report.map.annexIiiCategories.length > 0 && (
        <p className="mt-1 text-[10px] text-ink-600">
          Annex III §{report.map.annexIiiCategories.join(", §")} auto-detected
        </p>
      )}
      <hr className="my-3 border-ink-900" />
      <div className="flex items-center justify-between font-bold">
        <span>Overall score</span>
        <span>{report.grade.overallScore.toFixed(2)} / 4.0</span>
      </div>
      {report.grade.perRegulation.map((s) => (
        <div key={s.regulationId} className="mt-2">
          <div className="flex items-center justify-between">
            <span className="font-bold">{prettyRegId(s.regulationId)}</span>
            <span>{isFinite(s.scoreAvg) ? s.scoreAvg.toFixed(2) : "—"} / 4.0</span>
          </div>
          <p className="pl-2 text-[10px] text-ink-600">
            pass {s.passCount} · partial {s.partialCount} · fail {s.failCount} ·
            external {s.externalCount} · n/a {s.naCount}
          </p>
        </div>
      ))}
    </div>
  );
}

function PerClauseTable({ report }: { report: AuditReport }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white">
      <p className="border-b border-ink-200 px-4 py-3 font-serif text-base font-bold text-ink-900">
        Per-clause findings
      </p>
      <ul>
        {report.checks.map((c) => (
          <li key={c.clauseId} className="border-b border-ink-100 px-4 py-3 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-ink-400">{c.article}</span>
              <VerdictChip verdict={c.verdict} score={c.score} />
            </div>
            <p className="mt-1 text-sm text-ink-900">{c.title}</p>
            <p className="mt-1 font-mono text-[11px] text-ink-600">{c.rationale}</p>
            {c.evidence.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-ink-600 hover:text-ink-900">
                  {c.evidence.length} evidence record{c.evidence.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-600">
                  {c.evidence.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      <code className="text-ink-900">
                        {e.file}
                        {e.lines ? `:${e.lines[0]}` : ""}
                      </code>
                      {e.rule && <span className="ml-2 text-ink-400">[{e.rule}]</span>}
                      {e.snippet && (
                        <pre className="mt-0.5 whitespace-pre-wrap rounded bg-ink-50 px-2 py-1 text-[10px] text-ink-600">
                          {e.snippet}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExternalsList({ report }: { report: AuditReport }) {
  if (report.externalControls.length === 0) return null;
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-2 font-serif text-base font-bold text-ink-900">
        External controls — please confirm
      </p>
      <p className="mb-3 text-sm text-ink-600">
        We can&rsquo;t audit these from the code alone. A human reviewer needs
        to confirm.
      </p>
      <ul className="space-y-2">
        {report.externalControls.map((ec) => (
          <li key={ec.clauseId} className="text-sm">
            <p className="font-medium text-ink-900">
              {ec.article} — {ec.title}
            </p>
            <p className="font-mono text-[11px] text-ink-600">{ec.note}</p>
          </li>
        ))}
      </ul>
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
  const sc = isFinite(score) ? score.toFixed(1) : "—";
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${colour}`}>
      {verdict} · {sc}
    </span>
  );
}

function prettyRegId(id: string): string {
  const map: Record<string, string> = {
    "eu-ai-act-2024-08": "EU AI Act (2024-08)",
    "nist-ai-rmf-1.0": "NIST AI RMF 1.0",
  };
  return map[id] ?? id;
}
