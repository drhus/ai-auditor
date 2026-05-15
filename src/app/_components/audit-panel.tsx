"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  // Poll while running; on completion, redirect to the permanent audit page.
  useEffect(() => {
    if (!state) return;
    if (state.status === "completed") {
      router.push(`/audit/${state.auditId}`);
      return;
    }
    if (state.status === "failed") return;
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
  }, [state?.auditId, state?.status, router]);

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

  // Running / completed (completed redirects via useEffect)
  return <RunningView state={state} />;
}

// ---------------------------------------------------------------------------

function RunningView({ state }: { state: PipelineState }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-400">
        Audit <a href={`/audit/${state.auditId}`} className="no-underline">{state.auditId}</a> · in progress
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

