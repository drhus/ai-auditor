import Link from "next/link";
import { DocsShell } from "./_layout-shell";
import { getLocale } from "@/i18n/server";

export const metadata = {
  title: "Docs — 8RR8",
};

export default async function DocsHome() {
  const locale = await getLocale();
  return (
    <DocsShell locale={locale}>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
        Documentation
      </p>
      <h1 className="font-serif text-4xl font-bold text-ink-900">
        How 8RR8 works
      </h1>
      <p className="text-lg text-ink-600">
        8RR8 reads an AI agent&rsquo;s source code, runs a multi-stage audit
        against region-specific AI regulations, and publishes a verifiable
        score on chain. These docs explain how the pipeline runs, how the
        score is calculated, and which regulations are in scope.
      </p>

      <section className="not-prose mt-10 grid gap-4 sm:grid-cols-2">
        <Card
          href="/docs/methodology"
          title="Methodology"
          body="The 9-stage pipeline that turns a repo URL into a per-clause verdict."
        />
        <Card
          href="/docs/rating"
          title="How rating works"
          body="The 0–4 ordinal scoring, rule weights, polarity, and aggregation rules."
        />
        <Card
          href="/docs/regulations"
          title="Regulations"
          body="The packs we audit against today: EU AI Act, NIST AI RMF — and what's planned next."
        />
        <Card
          href="https://github.com/drhus/ai-auditor/tree/main/regulations"
          title="Regulation YAML packs ↗"
          body="The source-of-truth clause definitions are public on GitHub. Open them, propose changes, fork your own."
          external
        />
      </section>

      <h2 className="mt-12 font-serif text-2xl font-bold text-ink-900">
        Why open the methodology?
      </h2>
      <p>
        Trust scales with verifiability, not reputation. Every audit emits a
        deterministic <code>bundleHash</code> — anyone running our open-source
        checker at the same version, against the same repo commit, against the
        same regulations pack, will produce the same hash. If they don&rsquo;t,
        one of the inputs drifted. That&rsquo;s the contract.
      </p>
      <p>
        The clauses are public. The checker library is open source. The
        regulations packs are versioned in this repo. The on-chain
        attestations are independently queryable. There is nowhere for a
        manipulated audit to hide.
      </p>
    </DocsShell>
  );
}

function Card({
  href,
  title,
  body,
  external,
}: {
  href: string;
  title: string;
  body: string;
  external?: boolean;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noreferrer" as const }
    : {};
  const inner = (
    <div className="h-full rounded-lg border border-ink-200 bg-white p-5 transition hover:border-ink-900">
      <p className="mb-1 font-serif text-xl font-bold text-ink-900">{title}</p>
      <p className="text-sm text-ink-600">{body}</p>
    </div>
  );
  return external ? (
    <a href={href} className="no-underline" {...linkProps}>
      {inner}
    </a>
  ) : (
    <Link href={href} className="no-underline">
      {inner}
    </Link>
  );
}
