"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface Row {
  auditId: string;
  status: string;
  startedAt: string;
  repoUrl: string | null;
  commitSha: string | null;
  risk: string | null;
  score: number | null;
  owner: string | null;
  repo: string | null;
}

export function AuditsTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (risk !== "all" && r.risk !== risk) return false;
      if (!q) return true;
      return (
        r.auditId.toLowerCase().includes(q) ||
        (r.repoUrl?.toLowerCase().includes(q) ?? false) ||
        (r.commitSha?.toLowerCase().includes(q) ?? false) ||
        (r.owner?.toLowerCase().includes(q) ?? false) ||
        (r.repo?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, risk]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by audit ID, repo, commit, owner…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[240px] rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-xs text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-900"
        />
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-md border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 focus:border-ink-900"
        >
          <option value="all">All risk</option>
          <option value="high">High</option>
          <option value="limited">Limited</option>
          <option value="minimal">Minimal</option>
          <option value="gpai">GPAI</option>
          <option value="unknown">Unknown</option>
        </select>
        <p className="ml-auto font-mono text-xs text-ink-400">
          {filtered.length} of {rows.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-left font-mono text-[10px] uppercase tracking-widest text-ink-400">
            <tr>
              <th className="px-4 py-2">Audit</th>
              <th className="px-4 py-2">Repo</th>
              <th className="px-4 py-2">Commit</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.auditId} className="border-b border-ink-100 last:border-b-0">
                <td className="px-4 py-2">
                  <Link
                    href={`/audit/${r.auditId}`}
                    className="font-mono text-xs text-ink-900 no-underline hover:underline"
                  >
                    {r.auditId.slice(0, 12)}…
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-ink-900">
                  {r.owner && r.repo ? `${r.owner}/${r.repo}` : "—"}
                </td>
                <td className="px-4 py-2 font-mono text-[11px] text-ink-600">
                  {r.commitSha ? r.commitSha.slice(0, 8) : "—"}
                </td>
                <td className="px-4 py-2">
                  <RiskChip risk={r.risk ?? "unknown"} status={r.status} />
                </td>
                <td className="px-4 py-2 font-mono text-xs">
                  {r.score != null ? `${r.score.toFixed(2)} / 4.0` : "—"}
                </td>
                <td className="px-4 py-2 font-mono text-[11px] text-ink-600">
                  {timeAgo(r.startedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskChip({ risk, status }: { risk: string; status: string }) {
  if (status !== "completed") {
    return (
      <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-600">
        {status}
      </span>
    );
  }
  const colour =
    risk === "high"
      ? "bg-[var(--color-fail)]"
      : risk === "limited"
        ? "bg-[var(--color-partial)]"
        : risk === "minimal"
          ? "bg-[var(--color-pass)]"
          : "bg-ink-600";
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-50 ${colour}`}>
      {risk}
    </span>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
