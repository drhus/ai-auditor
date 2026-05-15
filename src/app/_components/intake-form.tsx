"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface IntakeFormProps {
  placeholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

export function IntakeForm({
  placeholder = "https://8004scan.io/agents/ethereum/9382  ·  github.com/owner/repo  ·  owner/repo",
  submitLabel = "Audit my agent",
  submittingLabel = "Resolving…",
}: IntakeFormProps = {}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste an 8004scan.io URL or chain:tokenId reference.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Could not resolve that input.");
          return;
        }
        if (typeof data?.auditPath === "string") {
          router.push(data.auditPath);
        } else {
          setError("Resolver returned an unexpected response.");
        }
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-ink-200 bg-white px-4 py-3 font-mono text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-900"
        disabled={pending}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? submittingLabel : submitLabel}
      </button>
      {error && (
        <p
          role="alert"
          className="basis-full font-mono text-xs text-[var(--color-fail)]"
        >
          {error}
        </p>
      )}
    </form>
  );
}
