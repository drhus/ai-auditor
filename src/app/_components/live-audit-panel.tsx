"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { AuditEvent, StageName } from "@/pipeline/events";
import type { AuditReport, SignalId } from "@/pipeline/types";
import { LiveReport } from "./live-report";

interface LiveAuditPanelProps {
  source:
    | { kind: "repo"; owner: string; repo: string; ref?: string }
    | { kind: "agent"; chain: string; tokenId: string; repoUrl: string };
  autoStart?: boolean;
}

// ---------- Feed model ----------
//
// Every pipeline event maps to one Feed entry. Entries belong to one of five
// human-readable phases. The renderer groups entries by phase and renders the
// active phase with a subtle "thinking" indicator at the bottom.

type Phase = "read" | "scan" | "map" | "check" | "write";

interface FeedEntry {
  id: number;
  phase: Phase;
  variant:
    | "step"            // a routine progress line ("Downloaded 437 files")
    | "found"           // a positive detection ("Detected: Anthropic SDK")
    | "warn"            // an interesting non-fail observation
    | "classification"  // big risk-class card
    | "verdict"         // a per-clause result
    | "score"           // the overall score reveal
    | "error";
  title: string;
  detail?: string;
  meta?: Record<string, string | number>;
  at: number;
}

const PHASE_FOR_STAGE: Record<StageName, Phase> = {
  intake: "read",
  fetch: "read",
  recon: "scan",
  scope: "map",
  map: "map",
  check: "check",
  verify: "check",
  grade: "write",
  report: "write",
};

const PHASE_TITLE: Record<Phase, string> = {
  read: "Reading the codebase",
  scan: "Looking for AI signals",
  map: "Identifying which rules apply",
  check: "Running the audit",
  write: "Writing your report",
};

const PHASE_SUBTITLE: Record<Phase, string> = {
  read: "Fetching the repo and indexing the files",
  scan: "Scanning code for 21 AI-system signals",
  map: "Picking the regulation packs and risk class",
  check: "Scoring each clause against the code",
  write: "Aggregating scores and assembling the report",
};

const PHASE_ORDER: Phase[] = ["read", "scan", "map", "check", "write"];

// ---------- Component ----------

export function LiveAuditPanel({ source, autoStart = false }: LiveAuditPanelProps) {
  const [running, setRunning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [donePhases, setDonePhases] = useState<Set<Phase>>(new Set());
  const [finalReport, setFinalReport] = useState<AuditReport | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);
  const startedRef = useRef(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const push = useCallback((e: Omit<FeedEntry, "id" | "at">) => {
    idRef.current += 1;
    setEntries((prev) => [...prev, { ...e, id: idRef.current, at: Date.now() }]);
  }, []);

  // Auto-scroll as new entries arrive.
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries.length, activePhase]);

  const handleEvent = useCallback(
    (evt: AuditEvent) => {
      switch (evt.kind) {
        case "ready":
          setAuditId(evt.auditId);
          setActivePhase("read");
          push({
            phase: "read",
            variant: "step",
            title: `Audit session opened`,
            detail: `Reference: ${evt.auditId}`,
          });
          return;

        case "stage": {
          const phase = PHASE_FOR_STAGE[evt.stage];
          if (evt.phase === "start") {
            setActivePhase(phase);
            return;
          }
          // Mark phase done when its last stage completes.
          if (isLastStageOfPhase(evt.stage)) {
            setDonePhases((prev) => new Set(prev).add(phase));
          }
          return;
        }

        case "log": {
          const phase = PHASE_FOR_STAGE[evt.stage];
          const friendly = friendlyForLog(evt.stage, evt.text);
          if (!friendly) return; // some log lines are noise we drop
          push({
            phase,
            variant: evt.tone === "warn" ? "warn" : evt.tone === "ok" ? "found" : "step",
            title: friendly.title,
            detail: friendly.detail,
          });
          return;
        }

        case "signal":
          push({
            phase: "scan",
            variant: "found",
            title: evt.label ?? evt.signal,
            detail: `${evt.hits} hit${evt.hits === 1 ? "" : "s"} · strength ${(evt.strength * 100).toFixed(0)}%`,
            meta: { signal: evt.signal },
          });
          return;

        case "classification":
          push({
            phase: "map",
            variant: "classification",
            title:
              evt.classification === "unknown"
                ? "Not an AI system"
                : `Classified as ${evt.classification.toUpperCase()}-risk`,
            detail:
              evt.classification === "unknown"
                ? "No agent framework or LLM call sites found. The EU AI Act and NIST AI RMF target AI systems — with none present here, the substantive clauses don't apply."
                : annexLine(evt.annexIii, evt.art50),
            meta: {
              risk: evt.classification,
              annex: evt.annexIii.join(","),
              art50: evt.art50.join(","),
            },
          });
          return;

        case "clause":
          push({
            phase: "check",
            variant: "verdict",
            title: `${evt.article} — ${evt.title}`,
            detail: `Verdict: ${evt.verdict.toUpperCase()} · ${evt.score}/4 · ${evt.rulesMatched}/${evt.rulesTotal} rules matched`,
            meta: { verdict: evt.verdict, score: evt.score },
          });
          return;

        case "score":
          push({
            phase: "write",
            variant: "score",
            title: `Overall score: ${evt.overall.toFixed(2)} / 4.0`,
            detail: scoreCaption(evt.overall),
            meta: { overall: evt.overall },
          });
          return;

        case "report":
          setFinalReport(evt.report);
          setRunning(false);
          setActivePhase(null);
          setDonePhases(new Set(PHASE_ORDER));
          publishReport(evt.report).catch(() => {});
          return;

        case "error":
          setError(evt.message);
          setRunning(false);
          setActivePhase(null);
          push({
            phase: activePhase ?? "read",
            variant: "error",
            title: "Audit could not complete",
            detail: evt.message,
          });
          return;
      }
    },
    [push, activePhase],
  );

  const run = useCallback(() => {
    setError(null);
    setRunning(true);
    setFinalReport(null);
    setEntries([]);
    setActivePhase("read");
    setDonePhases(new Set());

    push({
      phase: "read",
      variant: "step",
      title: `Auditing ${describeSource(source)}`,
      detail: "Fetching the repository from GitHub…",
    });

    startTransition(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/audit/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => "Stream request failed.");
          setError(msg);
          setRunning(false);
          return;
        }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let idx;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload) continue;
              try {
                const ev = JSON.parse(payload) as AuditEvent;
                handleEvent(ev);
              } catch {
                /* ignore malformed */
              }
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message || "Network error.");
        }
        setRunning(false);
      }
    });
  }, [source, handleEvent, push]);

  useEffect(() => {
    if (!autoStart) return;
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, [autoStart, run]);

  // ---------- Render ----------

  // Idle state — manual button (only when autoStart is off and nothing's running).
  if (!running && !finalReport && !error && entries.length === 0) {
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
        <p className="mt-3 max-w-prose text-xs text-ink-400">
          The audit streams stage by stage. We fetch the repo, scan for AI
          signals, classify risk, score every clause across EU AI Act + NIST
          AI RMF, and produce an evidence-anchored report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveFeed
        entries={entries}
        activePhase={activePhase}
        donePhases={donePhases}
        feedRef={feedRef}
        auditId={auditId}
        running={running}
        error={error}
        onRetry={run}
        collapsed={Boolean(finalReport)}
      />
      {finalReport && <LiveReport report={finalReport} />}
    </div>
  );
}

// ---------- Feed renderer ----------

interface LiveFeedProps {
  entries: FeedEntry[];
  activePhase: Phase | null;
  donePhases: Set<Phase>;
  feedRef: React.RefObject<HTMLDivElement | null>;
  auditId: string | null;
  running: boolean;
  error: string | null;
  onRetry: () => void;
  collapsed?: boolean;
}

function LiveFeed({
  entries,
  activePhase,
  donePhases,
  feedRef,
  auditId,
  running,
  error,
  onRetry,
  collapsed,
}: LiveFeedProps) {
  const groups = useMemo(() => groupByPhase(entries), [entries]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar running={running} />
          <div>
            <p className="font-serif text-sm font-bold text-ink-900">
              {running ? "8RR8 is auditing your agent" : collapsed ? "Audit complete" : "Audit"}
            </p>
            <p className="font-mono text-[11px] text-ink-500">
              {auditId ?? "preparing…"}
            </p>
          </div>
        </div>
        {running && (
          <span className="rounded-full bg-ink-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-600">
            live
          </span>
        )}
      </header>

      <div
        ref={feedRef}
        className={`relative overflow-y-auto px-5 py-5 ${
          collapsed ? "max-h-72" : "max-h-[34rem]"
        }`}
      >
        {PHASE_ORDER.map((phase) => {
          const phaseEntries = groups[phase] ?? [];
          const isActive = activePhase === phase && !collapsed;
          const isDone = donePhases.has(phase);
          const hasContent = phaseEntries.length > 0;
          // Skip phases that haven't started AND have no entries yet.
          if (!hasContent && !isActive) return null;

          return (
            <PhaseBlock
              key={phase}
              phase={phase}
              entries={phaseEntries}
              active={isActive}
              done={isDone}
            />
          );
        })}

        {error && (
          <div className="mt-4 rounded-lg border border-[var(--color-fail)] bg-[color-mix(in_oklab,var(--color-fail)_8%,white)] p-4">
            <p className="font-serif text-sm font-bold text-ink-900">Audit failed</p>
            <p className="mt-1 text-sm text-ink-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-semibold text-ink-50"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseBlock({
  phase,
  entries,
  active,
  done,
}: {
  phase: Phase;
  entries: FeedEntry[];
  active: boolean;
  done: boolean;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <div className="mb-2 flex items-start gap-3">
        <PhaseIcon phase={phase} active={active} done={done} />
        <div>
          <p className={`font-serif text-base font-bold ${active ? "text-ink-900" : done ? "text-ink-700" : "text-ink-500"}`}>
            {PHASE_TITLE[phase]}
            {active && <ThinkingDots />}
          </p>
          <p className="text-xs text-ink-500">{PHASE_SUBTITLE[phase]}</p>
        </div>
      </div>

      <ol className="ml-10 space-y-1.5 border-l border-ink-100 pl-5">
        {entries.map((e) => (
          <FeedEntryRow key={e.id} entry={e} />
        ))}
        {active && entries.length === 0 && <ThinkingRow />}
      </ol>
    </section>
  );
}

function FeedEntryRow({ entry }: { entry: FeedEntry }) {
  if (entry.variant === "classification") {
    return <ClassificationCard entry={entry} />;
  }
  if (entry.variant === "verdict") {
    return <VerdictRow entry={entry} />;
  }
  if (entry.variant === "score") {
    return <ScoreCard entry={entry} />;
  }
  if (entry.variant === "found") {
    return (
      <li className="-ml-[1.4rem] flex items-start gap-2 fade-in">
        <CheckGlyph />
        <div>
          <p className="text-sm text-ink-900">{entry.title}</p>
          {entry.detail && (
            <p className="font-mono text-[11px] text-ink-500">{entry.detail}</p>
          )}
        </div>
      </li>
    );
  }
  if (entry.variant === "warn") {
    return (
      <li className="-ml-[1.4rem] flex items-start gap-2 fade-in">
        <WarnGlyph />
        <div>
          <p className="text-sm text-ink-900">{entry.title}</p>
          {entry.detail && (
            <p className="font-mono text-[11px] text-ink-500">{entry.detail}</p>
          )}
        </div>
      </li>
    );
  }
  if (entry.variant === "error") {
    return (
      <li className="-ml-[1.4rem] flex items-start gap-2 fade-in">
        <FailGlyph />
        <div>
          <p className="text-sm font-medium text-[var(--color-fail)]">{entry.title}</p>
          {entry.detail && <p className="font-mono text-[11px] text-ink-500">{entry.detail}</p>}
        </div>
      </li>
    );
  }
  // step
  return (
    <li className="-ml-[1.4rem] flex items-start gap-2 fade-in">
      <DotGlyph />
      <div>
        <p className="text-sm text-ink-700">{entry.title}</p>
        {entry.detail && <p className="font-mono text-[11px] text-ink-500">{entry.detail}</p>}
      </div>
    </li>
  );
}

function ClassificationCard({ entry }: { entry: FeedEntry }) {
  const risk = String(entry.meta?.risk ?? "");
  const colour =
    risk === "high"
      ? "border-[var(--color-fail)] bg-[color-mix(in_oklab,var(--color-fail)_6%,white)]"
      : risk === "limited"
        ? "border-[var(--color-partial)] bg-[color-mix(in_oklab,var(--color-partial)_8%,white)]"
        : risk === "minimal"
          ? "border-[var(--color-pass)] bg-[color-mix(in_oklab,var(--color-pass)_8%,white)]"
          : "border-ink-300 bg-ink-50";
  return (
    <li className="-ml-[1.4rem] mt-1 fade-in">
      <div className={`rounded-xl border-2 ${colour} p-4`}>
        <p className="font-serif text-base font-bold text-ink-900">{entry.title}</p>
        {entry.detail && <p className="mt-1 text-sm text-ink-700">{entry.detail}</p>}
      </div>
    </li>
  );
}

function VerdictRow({ entry }: { entry: FeedEntry }) {
  const verdict = String(entry.meta?.verdict ?? "");
  const score = Number(entry.meta?.score ?? 0);
  const bg =
    verdict === "pass"
      ? "bg-[var(--color-pass)]"
      : verdict === "partial"
        ? "bg-[var(--color-partial)]"
        : verdict === "fail"
          ? "bg-[var(--color-fail)]"
          : "bg-ink-400";
  return (
    <li className="-ml-[1.4rem] flex items-start gap-2 fade-in">
      <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${bg}`} />
      <div className="flex-1">
        <p className="text-sm text-ink-900">{entry.title}</p>
        <p className="font-mono text-[11px] text-ink-500">
          <span className={`mr-1 rounded px-1.5 py-0.5 text-[10px] uppercase text-ink-50 ${bg}`}>
            {verdict}
          </span>
          {Number.isFinite(score) ? `${score}/4` : "—"}
        </p>
      </div>
    </li>
  );
}

function ScoreCard({ entry }: { entry: FeedEntry }) {
  const overall = Number(entry.meta?.overall ?? 0);
  return (
    <li className="-ml-[1.4rem] mt-2 fade-in">
      <div className="rounded-xl border border-ink-900 bg-ink-900 px-4 py-3 text-ink-50">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          Overall
        </p>
        <p className="font-serif text-3xl font-bold">
          {overall.toFixed(2)}
          <span className="ml-1 text-sm font-normal text-ink-400">/ 4.0</span>
        </p>
        {entry.detail && <p className="mt-1 text-xs text-ink-300">{entry.detail}</p>}
      </div>
    </li>
  );
}

// ---------- Bits ----------

function Avatar({ running }: { running: boolean }) {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-ink-50">
      <span className="font-serif text-sm font-bold tracking-tight">R</span>
      {running && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-ink-900 opacity-30" />
      )}
    </span>
  );
}

function PhaseIcon({
  phase,
  active,
  done,
}: {
  phase: Phase;
  active: boolean;
  done: boolean;
}) {
  const colour = done
    ? "bg-[var(--color-pass)] text-ink-50"
    : active
      ? "bg-ink-900 text-ink-50"
      : "bg-ink-100 text-ink-500";
  const i = PHASE_ORDER.indexOf(phase) + 1;
  return (
    <span
      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] ${colour} ${active ? "ring-2 ring-ink-200" : ""}`}
    >
      {done ? "✓" : i}
    </span>
  );
}

function CheckGlyph() {
  return (
    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-pass)]" />
  );
}

function WarnGlyph() {
  return (
    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-partial)]" />
  );
}

function FailGlyph() {
  return (
    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-fail)]" />
  );
}

function DotGlyph() {
  return <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" />;
}

function ThinkingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
      <span className="block h-1 w-1 animate-pulse rounded-full bg-ink-400 [animation-delay:0ms]" />
      <span className="block h-1 w-1 animate-pulse rounded-full bg-ink-400 [animation-delay:200ms]" />
      <span className="block h-1 w-1 animate-pulse rounded-full bg-ink-400 [animation-delay:400ms]" />
    </span>
  );
}

function ThinkingRow() {
  return (
    <li className="-ml-[1.4rem] flex items-start gap-2 text-ink-400">
      <DotGlyph />
      <p className="text-sm">working on it…</p>
    </li>
  );
}

// ---------- Helpers ----------

function groupByPhase(entries: FeedEntry[]): Record<Phase, FeedEntry[]> {
  const out: Record<Phase, FeedEntry[]> = {
    read: [],
    scan: [],
    map: [],
    check: [],
    write: [],
  };
  for (const e of entries) out[e.phase].push(e);
  return out;
}

function isLastStageOfPhase(stage: StageName): boolean {
  // The mapping is many-stages-to-one-phase; mark the phase done at the last
  // pipeline stage within it.
  return stage === "fetch" || stage === "recon" || stage === "map" || stage === "verify" || stage === "report";
}

function annexLine(annex: string[], art50: string[]): string {
  const parts: string[] = [];
  if (annex.length) parts.push(`Annex III §${annex.join(", §")}`);
  if (art50.length) parts.push(`Art 50 ${art50.join(", ")}`);
  if (parts.length === 0) return "No high-risk Annex III or Art 50 triggers fired.";
  return parts.join(" · ");
}

function scoreCaption(overall: number): string {
  if (overall >= 3) return "Strong compliance posture across in-scope clauses.";
  if (overall >= 2) return "Mixed compliance — several clauses are only partially met.";
  if (overall > 0) return "Substantial gaps detected across the in-scope clauses.";
  return "All clauses are out of scope for this repository.";
}

function describeSource(source: LiveAuditPanelProps["source"]): string {
  if (source.kind === "repo") return `${source.owner}/${source.repo}`;
  return `${source.chain}:${source.tokenId} (${source.repoUrl})`;
}

// Map a raw log event from the pipeline into a friendly, human-readable line.
// Some lines are dropped (return null) because they duplicate signal/clause
// events that already render as their own card.
function friendlyForLog(
  stage: StageName,
  text: string,
): { title: string; detail?: string } | null {
  // FETCH
  if (stage === "fetch") {
    if (/^Resolving default branch/i.test(text)) {
      return { title: "Looking up the repository on GitHub" };
    }
    const pinMatch = text.match(/^Pinned commit ([0-9a-f]+)/i);
    if (pinMatch) return { title: `Pinned commit ${pinMatch[1]}`, detail: "All findings will be anchored to this exact commit." };
    const extractMatch = text.match(/^Extracted ([\d,]+) files? · (.+)$/);
    if (extractMatch) return { title: `Downloaded ${extractMatch[1]} files`, detail: extractMatch[2] };
    const langMatch = text.match(/^Top languages: (.+)$/);
    if (langMatch) return { title: "Top languages", detail: langMatch[1] };
    if (/present$/i.test(text)) {
      return { title: `Found ${text.replace(/ present$/i, "")}`, detail: "Counts toward governance evidence." };
    }
    return { title: text };
  }

  // RECON
  if (stage === "recon") {
    if (/Running .* signal detectors/i.test(text)) {
      return { title: "Scanning every source file for AI-system signals" };
    }
    const firedMatch = text.match(/^(\d+) signals fired \(of (\d+)\)\.$/);
    if (firedMatch) {
      return { title: `${firedMatch[1]} of ${firedMatch[2]} signals fired`, detail: "Each signal is evidence that a regulation may apply." };
    }
    if (/No AI-system signals detected/i.test(text)) {
      return { title: "No AI-system signals detected", detail: "This repository doesn't look like an AI system." };
    }
    return null; // drop other recon log noise; signal events handle the detail
  }

  // SCOPE
  if (stage === "scope") {
    const m = text.match(/^Pack in scope: (.+)$/);
    if (m) {
      return { title: `Auditing against ${prettyRegId(m[1])}` };
    }
    return { title: text };
  }

  // MAP
  if (stage === "map") {
    const loadedMatch = text.match(/^Loaded (.+) \((\d+) clauses, v(.+)\)$/);
    if (loadedMatch) {
      return { title: `Loaded ${loadedMatch[1]}`, detail: `${loadedMatch[2]} clauses · version ${loadedMatch[3]}` };
    }
    if (/^Classified /.test(text)) {
      // classification event will render its own card
      return null;
    }
    if (/Annex III/i.test(text) || /Art 50/i.test(text)) {
      return { title: "Trigger", detail: text };
    }
    if (/No AI system detected/i.test(text)) {
      return null; // surfaced in classification card
    }
    if (/EU AI Act and NIST AI RMF do not apply/i.test(text)) {
      return null;
    }
    return { title: text };
  }

  // CHECK
  if (stage === "check") {
    if (/^Running deterministic checkers/i.test(text)) {
      return { title: "Scoring every in-scope clause" };
    }
    const finalMatch = text.match(/^(\d+) numeric verdicts · (\d+) external · (\d+) n\/a$/);
    if (finalMatch) {
      return {
        title: `Finished scoring`,
        detail: `${finalMatch[1]} numeric · ${finalMatch[2]} need human review · ${finalMatch[3]} not applicable`,
      };
    }
    return null;
  }

  // VERIFY
  if (stage === "verify") {
    if (/^No ambiguous clauses/i.test(text)) return { title: "All verdicts are unambiguous." };
    const m = text.match(/^(\d+) clauses landed in ambiguous band/);
    if (m) {
      return { title: `${m[1]} clauses are ambiguous`, detail: "Flagged for LLM-judge review in V1." };
    }
    return null;
  }

  // GRADE
  if (stage === "grade") {
    if (/^Overall score:/.test(text)) return null; // surfaced as ScoreCard
    return { title: text };
  }

  // REPORT
  if (stage === "report") {
    const m = text.match(/Bundle hash ([0-9a-f]+)/i);
    if (m) {
      return { title: "Sealed the audit bundle", detail: `Hash: ${m[1]}` };
    }
    return { title: text };
  }

  // INTAKE
  return null;
}

function prettyRegId(id: string): string {
  if (id === "eu-ai-act-2024-08") return "EU AI Act (2024/1689)";
  if (id === "nist-ai-rmf-1.0") return "NIST AI RMF 1.0";
  return id;
}

async function publishReport(report: AuditReport) {
  try {
    await fetch("/api/audit/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });
  } catch {
    /* swallow */
  }
}

// Silence unused-import warnings for types the file references via JSDoc-style
// hints elsewhere. (SignalId is the public type for `evt.meta.signal`.)
export type { SignalId };
