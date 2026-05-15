import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditPanel } from "@/app/_components/audit-panel";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, repo } = await params;

  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    notFound();
  }

  const repoUrl = `https://github.com/${owner}/${repo}`;

  // Probe whether the repo exists publicly — non-blocking; renders even on error.
  let exists: boolean | null = null;
  let defaultBranch: string | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      exists = true;
      defaultBranch = typeof data?.default_branch === "string" ? data.default_branch : null;
    } else if (res.status === 404) {
      exists = false;
    }
  } catch {
    /* swallow */
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-ink-900 no-underline">
          AiAuditor
        </Link>
        <Link href="/" className="text-sm text-ink-600 no-underline hover:text-ink-900">
          ← New audit
        </Link>
      </header>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        Direct repo · GitHub · {owner}/{repo}
      </p>

      <h1 className="mb-4 font-serif text-4xl font-bold text-ink-900">
        {owner}/{repo}
      </h1>
      <p className="mb-8 max-w-2xl text-ink-600">
        Direct GitHub audit. This repository isn&rsquo;t registered on ERC-8004
        yet — we&rsquo;ll auto-register it on Sepolia under our custodial
        wallet when the full pipeline ships, so every audit anchors in the
        canonical Validation Registry. You can claim the registered agentId
        later.
      </p>

      <div className="mb-10 grid gap-4 rounded-lg border border-ink-200 bg-white p-6 sm:grid-cols-2">
        <Field
          label="Repository"
          value={
            <a href={repoUrl} target="_blank" rel="noreferrer">
              {repoUrl}
            </a>
          }
        />
        <Field
          label="Public status"
          value={
            exists === true ? (
              <span className="text-[var(--color-pass)]">Public · accessible</span>
            ) : exists === false ? (
              <span className="text-[var(--color-fail)]">Not found · private or non-existent</span>
            ) : (
              <span className="text-ink-400">Could not probe</span>
            )
          }
        />
        {defaultBranch && <Field label="Default branch" value={defaultBranch} />}
        <Field label="ERC-8004 status" value="Not registered (V1.5 auto-register)" />
      </div>

      <section className="mb-10 space-y-6">
        <div className="rounded-lg border border-ink-200 bg-white p-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
            Audit
          </p>
          <h2 className="mb-3 font-serif text-2xl font-bold text-ink-900">
            Run an audit against EU AI Act + NIST AI RMF
          </h2>
          <AuditPanel source={{ kind: "repo", owner, repo }} />
        </div>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-400">
        {label}
      </p>
      <p className="text-sm text-ink-900">{value}</p>
    </div>
  );
}
