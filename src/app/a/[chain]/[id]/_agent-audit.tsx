"use client";

import { useState } from "react";
import { LiveAuditPanel } from "@/app/_components/live-audit-panel";

interface Props {
  chain: string;
  tokenId: string;
  resolvedRepoUrl: string | null;
}

export function AgentAuditWithFallback({
  chain,
  tokenId,
  resolvedRepoUrl,
}: Props) {
  const [manualRepo, setManualRepo] = useState<string | null>(null);

  const effectiveRepo = resolvedRepoUrl ?? manualRepo;

  if (effectiveRepo) {
    const parsed = parseOwnerRepo(effectiveRepo);
    if (!parsed) {
      return <p className="text-sm text-ink-600">Could not parse repo URL.</p>;
    }
    return (
      <div className="space-y-3">
        <p className="font-mono text-xs text-ink-600">
          Auditing <span className="text-ink-900">{effectiveRepo}</span>
        </p>
        <LiveAuditPanel
          source={{
            kind: "agent",
            chain,
            tokenId,
            repoUrl: effectiveRepo,
          }}
          autoStart
        />
        {!resolvedRepoUrl && (
          <button
            type="button"
            onClick={() => setManualRepo(null)}
            className="text-xs text-ink-400 underline hover:text-ink-900"
          >
            ← Use a different repo
          </button>
        )}
      </div>
    );
  }

  return <RepoUrlPrompt onSubmit={setManualRepo} />;
}

function RepoUrlPrompt({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      setError("Paste a GitHub repo URL.");
      return;
    }
    if (!parseOwnerRepo(v)) {
      setError("Doesn't look like a github.com URL. Format: github.com/owner/repo");
      return;
    }
    setError(null);
    onSubmit(v);
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <p className="text-sm text-ink-600">
        This agent&rsquo;s ERC-8004 registration does not declare a source
        repository. Paste a GitHub URL pointing at the agent&rsquo;s code so
        we can audit it.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-md border border-ink-200 bg-white px-4 py-3 font-mono text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-900"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-ink-50 transition hover:bg-ink-800"
        >
          Run audit
        </button>
      </div>
      {error && (
        <p role="alert" className="font-mono text-xs text-[var(--color-fail)]">
          {error}
        </p>
      )}
    </form>
  );
}

function parseOwnerRepo(input: string): { owner: string; repo: string } | null {
  const cleaned = input.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const m = cleaned.match(/^(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}
