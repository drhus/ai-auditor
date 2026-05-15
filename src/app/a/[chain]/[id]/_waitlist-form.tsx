"use client";

import { useState, useTransition } from "react";

export function WaitlistForm({ auditRef }: { auditRef: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, audit_ref: auditRef }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Could not save your email.");
          return;
        }
        setDone(true);
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  if (done) {
    return (
      <p className="rounded-md bg-ink-100 px-4 py-3 text-sm text-ink-900">
        You&rsquo;re on the list. We&rsquo;ll email you when this audit is
        ready.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-md border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-900"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Notify me"}
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
