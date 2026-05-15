"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface State {
  auditId: string;
  status: string;
  progressNote?: string;
  error?: string;
}

const LABEL: Record<string, string> = {
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

export function LiveStatus({ initialState }: { initialState: State }) {
  const [state, setState] = useState<State>(initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "completed" || state.status === "failed") {
      if (state.status === "completed") router.refresh();
      return;
    }
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/${state.auditId}`);
        if (!res.ok) return;
        const next = (await res.json()) as State;
        setState(next);
        if (next.status === "completed") router.refresh();
      } catch {
        /* swallow */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [state.auditId, state.status, router]);

  if (state.status === "failed") {
    return (
      <div className="rounded-lg border-2 border-[var(--color-fail)] bg-white p-6">
        <p className="font-serif text-lg font-bold text-ink-900">Audit failed</p>
        <p className="mt-2 font-mono text-xs text-[var(--color-fail)]">
          {state.error ?? "Unknown error."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-6">
      <p className="mb-2 font-serif text-2xl font-bold text-ink-900">
        {LABEL[state.status] ?? state.status}
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
