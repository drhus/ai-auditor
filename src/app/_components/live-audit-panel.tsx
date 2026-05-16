"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { AuditEvent, StageName } from "@/pipeline/events";
import type { AuditReport, SignalId } from "@/pipeline/types";
import { LiveReport } from "./live-report";

interface LiveAuditPanelProps {
  source:
    | { kind: "repo"; owner: string; repo: string; ref?: string }
    | { kind: "agent"; chain: string; tokenId: string; repoUrl: string };
  autoStart?: boolean;
}

interface LogLine {
  id: number;
  stage: StageName;
  text: string;
  tone?: "info" | "warn" | "ok" | "muted";
  at: number;
}

interface StageState {
  name: StageName;
  status: "pending" | "running" | "done";
  startedAt?: number;
  durationMs?: number;
}

const STAGE_ORDER: StageName[] = [
  "intake",
  "fetch",
  "recon",
  "scope",
  "map",
  "check",
  "verify",
  "grade",
  "report",
];

const STAGE_LABEL: Record<StageName, string> = {
  intake: "INTAKE",
  fetch: "FETCH",
  recon: "RECON",
  scope: "SCOPE",
  map: "MAP",
  check: "CHECK",
  verify: "VERIFY",
  grade: "GRADE",
  report: "REPORT",
};

export function LiveAuditPanel({ source, autoStart = false }: LiveAuditPanelProps) {
  const [running, setRunning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [stages, setStages] = useState<StageState[]>(() =>
    STAGE_ORDER.map((s) => ({ name: s, status: "pending" })),
  );
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [signals, setSignals] = useState<
    Array<{ signal: SignalId; strength: number; hits: number; label: string }>
  >([]);
  const [classification, setClassification] = useState<{
    classification: string;
    annexIii: string[];
    art50: string[];
  } | null>(null);
  const [clauses, setClauses] = useState<
    Array<{
      clauseId: string;
      article: string;
      title: string;
      verdict: string;
      score: number;
      regulationId: string;
    }>
  >([]);
  const [finalReport, setFinalReport] = useState<AuditReport | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const pushLog = useCallback((line: Omit<LogLine, "id" | "at">) => {
    logIdRef.current += 1;
    setLogs((prev) => [...prev, { ...line, id: logIdRef.current, at: Date.now() }]);
  }, []);

  // Auto-scroll the transcript as new lines arrive.
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs.length, signals.length, clauses.length]);

  const handleEvent = useCallback(
    (evt: AuditEvent) => {
      switch (evt.kind) {
        case "ready":
          setAuditId(evt.auditId);
          pushLog({ stage: "intake", text: `Audit ID ${evt.auditId}`, tone: "muted" });
          setStages((prev) =>
            prev.map((s) => (s.name === "intake" ? { ...s, status: "done" } : s)),
          );
          return;
        case "stage": {
          setStages((prev) =>
            prev.map((s) => {
              if (s.name !== evt.stage) return s;
              if (evt.phase === "start") {
                return { ...s, status: "running", startedAt: Date.now() };
              }
              return {
                ...s,
                status: "done",
                durationMs: evt.durationMs ?? (s.startedAt ? Date.now() - s.startedAt : undefined),
              };
            }),
          );
          if (evt.phase === "start") {
            pushLog({
              stage: evt.stage,
              text: `▸ ${STAGE_LABEL[evt.stage]} started${evt.note ? ` — ${evt.note}` : ""}`,
              tone: "info",
            });
          } else {
            pushLog({
              stage: evt.stage,
              text: `✓ ${STAGE_LABEL[evt.stage]} complete${evt.durationMs ? ` (${formatMs(evt.durationMs)})` : ""}`,
              tone: "ok",
            });
          }
          return;
        }
        case "log":
          pushLog({ stage: evt.stage, text: evt.text, tone: evt.tone });
          return;
        case "signal":
          setSignals((prev) => [
            ...prev,
            {
              signal: evt.signal,
              strength: evt.strength,
              hits: evt.hits,
              label: evt.label ?? evt.signal,
            },
          ]);
          pushLog({
            stage: "recon",
            text: `◉ ${evt.label ?? evt.signal} — strength ${evt.strength.toFixed(2)} · ${evt.hits} hit${evt.hits === 1 ? "" : "s"}`,
            tone: "ok",
          });
          return;
        case "classification":
          setClassification({
            classification: evt.classification,
            annexIii: evt.annexIii,
            art50: evt.art50,
          });
          pushLog({
            stage: "map",
            text: `★ Risk class: ${evt.classification.toUpperCase()}${evt.annexIii.length ? ` · Annex III: ${evt.annexIii.join(", ")}` : ""}${evt.art50.length ? ` · Art 50: ${evt.art50.join(", ")}` : ""}`,
            tone: "info",
          });
          return;
        case "clause":
          setClauses((prev) => [
            ...prev,
            {
              clauseId: evt.clauseId,
              article: evt.article,
              title: evt.title,
              verdict: evt.verdict,
              score: evt.score,
              regulationId: evt.regulationId,
            },
          ]);
          pushLog({
            stage: "check",
            text: `${verdictGlyph(evt.verdict)} ${evt.article} ${evt.title} — ${evt.verdict.toUpperCase()} (${evt.score}/4)`,
            tone: verdictTone(evt.verdict),
          });
          return;
        case "score":
          pushLog({
            stage: "grade",
            text: `Σ Overall ${evt.overall.toFixed(2)}/4`,
            tone: "info",
          });
          return;
        case "report":
          setFinalReport(evt.report);
          setRunning(false);
          publishReport(evt.report).catch(() => {});
          return;
        case "error":
          setError(evt.message);
          setRunning(false);
          pushLog({ stage: "report", text: `✗ ${evt.message}`, tone: "warn" });
          return;
      }
    },
    [pushLog],
  );

  const run = useCallback(() => {
    setError(null);
    setRunning(true);
    setFinalReport(null);
    setLogs([]);
    setSignals([]);
    setClauses([]);
    setClassification(null);
    setStages(STAGE_ORDER.map((s) => ({ name: s, status: "pending" })));
    pushLog({ stage: "intake", text: `▸ INTAKE — accepting ${describeSource(source)}`, tone: "info" });

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
                const evt = JSON.parse(payload) as AuditEvent;
                handleEvent(evt);
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
  }, [source, handleEvent, pushLog]);

  // Auto-start when the page navigates directly into the audit view.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart) return;
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, [autoStart, run]);

  // ---------- render ----------

  if (finalReport) {
    return (
      <div className="space-y-6">
        <LiveTranscript
          stages={stages}
          logs={logs}
          signals={signals}
          classification={classification}
          clauses={clauses}
          transcriptRef={transcriptRef}
          collapsed
          auditId={auditId}
        />
        <LiveReport report={finalReport} />
      </div>
    );
  }

  if (!running && !error && logs.length === 0) {
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
          Audit streams live, stage by stage. Pipeline clones the repo tarball,
          scans for AI-system signals, classifies risk, scores ~35 atomic
          clauses across EU AI Act + NIST AI RMF, and returns evidence-anchored
          verdicts in one session.
        </p>
      </div>
    );
  }

  return (
    <LiveTranscript
      stages={stages}
      logs={logs}
      signals={signals}
      classification={classification}
      clauses={clauses}
      transcriptRef={transcriptRef}
      error={error}
      onRetry={run}
      auditId={auditId}
    />
  );
}

// ---------------------------------------------------------------------------
// Transcript (terminal-style)
// ---------------------------------------------------------------------------

interface TranscriptProps {
  stages: StageState[];
  logs: LogLine[];
  signals: Array<{ signal: SignalId; strength: number; hits: number; label: string }>;
  classification: {
    classification: string;
    annexIii: string[];
    art50: string[];
  } | null;
  clauses: Array<{
    clauseId: string;
    article: string;
    title: string;
    verdict: string;
    score: number;
    regulationId: string;
  }>;
  transcriptRef: React.RefObject<HTMLDivElement | null>;
  error?: string | null;
  collapsed?: boolean;
  onRetry?: () => void;
  auditId?: string | null;
}

function LiveTranscript({
  stages,
  logs,
  signals,
  classification,
  clauses,
  transcriptRef,
  error,
  collapsed,
  onRetry,
  auditId,
}: TranscriptProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-900 bg-ink-900 text-ink-50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-fail)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-partial)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-pass)]" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-ink-400">
            8rr8 · live audit session
          </span>
        </div>
        {auditId && (
          <span className="font-mono text-[10px] text-ink-400">
            {auditId}
          </span>
        )}
      </div>

      <div className="grid gap-0 md:grid-cols-[180px_1fr]">
        {/* Stage rail */}
        <div className="border-r border-ink-700 bg-ink-900 px-4 py-4">
          <ul className="space-y-2">
            {stages.map((s) => (
              <li
                key={s.name}
                className={`flex items-center justify-between font-mono text-xs ${
                  s.status === "running"
                    ? "text-ink-50"
                    : s.status === "done"
                      ? "text-ink-400"
                      : "text-ink-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      s.status === "running"
                        ? "animate-pulse bg-[var(--color-partial)]"
                        : s.status === "done"
                          ? "bg-[var(--color-pass)]"
                          : "bg-ink-700"
                    }`}
                  />
                  {STAGE_LABEL[s.name]}
                </span>
                {s.durationMs !== undefined && (
                  <span className="text-[10px] text-ink-600">{formatMs(s.durationMs)}</span>
                )}
              </li>
            ))}
          </ul>

          {classification && (
            <div className="mt-6 border-t border-ink-700 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                Risk class
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-ink-50">
                {classification.classification.toUpperCase()}
              </p>
              {classification.annexIii.length > 0 && (
                <p className="mt-2 font-mono text-[10px] text-ink-400">
                  Annex III: {classification.annexIii.join(", ")}
                </p>
              )}
              {classification.art50.length > 0 && (
                <p className="font-mono text-[10px] text-ink-400">
                  Art 50: {classification.art50.join(", ")}
                </p>
              )}
            </div>
          )}

          {signals.length > 0 && (
            <div className="mt-6 border-t border-ink-700 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                Signals
              </p>
              <ul className="mt-2 space-y-1">
                {signals.slice(0, 12).map((s, i) => (
                  <li key={`${s.signal}-${i}`} className="font-mono text-[10px] text-ink-300">
                    {s.signal}
                    <span className="ml-1 text-ink-600">·{(s.strength * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div
          ref={transcriptRef}
          className={`relative bg-ink-950 px-4 py-4 font-mono text-[12px] leading-relaxed ${
            collapsed ? "max-h-72 overflow-y-auto" : "max-h-[36rem] overflow-y-auto"
          }`}
          style={{ background: "#0a0a0a" }}
        >
          {logs.map((l) => (
            <div key={l.id} className="flex gap-2">
              <span className="w-12 shrink-0 text-ink-700">[{STAGE_LABEL[l.stage]}]</span>
              <span className={toneColor(l.tone)}>{l.text}</span>
            </div>
          ))}
          {!error && logs.length > 0 && logs[logs.length - 1].stage !== "report" && (
            <span className="inline-block h-3 w-2 animate-pulse bg-ink-200" />
          )}
          {error && (
            <div className="mt-4 rounded border border-[var(--color-fail)] p-3 text-[var(--color-fail)]">
              {error}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-3 rounded bg-ink-50 px-2 py-1 text-[10px] font-semibold uppercase text-ink-900"
                >
                  retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {clauses.length > 0 && (
        <div className="border-t border-ink-700 bg-ink-900 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Verdicts so far · {clauses.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {clauses.map((c) => (
              <span
                key={c.clauseId}
                title={`${c.article} ${c.title} — ${c.verdict} (${c.score}/4)`}
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${verdictBg(c.verdict)}`}
              >
                {c.article}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function toneColor(tone?: LogLine["tone"]): string {
  switch (tone) {
    case "ok":
      return "text-[var(--color-pass)]";
    case "warn":
      return "text-[var(--color-partial)]";
    case "muted":
      return "text-ink-500";
    case "info":
    default:
      return "text-ink-200";
  }
}

function verdictTone(v: string): LogLine["tone"] {
  if (v === "pass") return "ok";
  if (v === "partial") return "warn";
  if (v === "fail") return "warn";
  return "muted";
}

function verdictGlyph(v: string): string {
  if (v === "pass") return "✓";
  if (v === "partial") return "◐";
  if (v === "fail") return "✗";
  return "·";
}

function verdictBg(v: string): string {
  if (v === "pass") return "bg-[var(--color-pass)] text-ink-50";
  if (v === "partial") return "bg-[var(--color-partial)] text-ink-50";
  if (v === "fail") return "bg-[var(--color-fail)] text-ink-50";
  return "bg-ink-700 text-ink-50";
}

function describeSource(source: LiveAuditPanelProps["source"]): string {
  if (source.kind === "repo") return `${source.owner}/${source.repo}`;
  return `${source.chain}:${source.tokenId} (${source.repoUrl})`;
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
