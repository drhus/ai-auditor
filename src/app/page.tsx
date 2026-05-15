import Link from "next/link";
import { IntakeForm } from "./_components/intake-form";
import { NutritionalFactsPanel } from "./_components/nutritional-facts";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <header className="mb-12 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-ink-900 no-underline">
          AiAuditor
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-600">
          <Link href="/about" className="no-underline hover:text-ink-900">
            About
          </Link>
          <a
            href="https://github.com/drhus/ai-auditor"
            className="no-underline hover:text-ink-900"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <section className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-400">
            For ERC-8004 registered agents · Sepolia testnet · V0
          </p>
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.05] text-ink-900 sm:text-6xl">
            The FDA stamp
            <br />
            for AI agents.
          </h1>
          <p className="mb-10 max-w-xl text-lg text-ink-600">
            Paste your ERC-8004 agent — or a plain GitHub repo. Get a
            verifiable EU AI Act score in minutes, anchored on chain in the
            canonical ERC-8004 Validation Registry, recognisable across
            markets. Every finding cited file-and-line in your code.
          </p>
          <IntakeForm />
          <p className="mt-6 max-w-xl font-mono text-xs text-ink-400">
            Examples:{" "}
            <code>https://8004scan.io/agents/ethereum/9382</code>,{" "}
            <code>github.com/owner/repo</code>, or shorthand{" "}
            <code>base:1380</code> / <code>owner/repo</code>.
          </p>
        </div>

        <div className="lg:pt-2">
          <NutritionalFactsPanel />
        </div>
      </section>

      <section className="mt-24 grid gap-8 border-t border-ink-200 pt-16 sm:grid-cols-3">
        <Step
          n="01"
          title="Connect"
          body="Paste any ERC-8004 agent URL. We resolve the registered repository through the on-chain Identity Registry."
        />
        <Step
          n="02"
          title="Audit"
          body="A multi-stage pipeline reads your code against the EU AI Act and NIST AI RMF. Every finding is anchored to a file and line."
        />
        <Step
          n="03"
          title="Verify"
          body="Your score lands on chain as a packed event plus a canonical ERC-8004 validation response. Anyone can independently verify."
        />
      </section>

      <section className="mt-24 border-t border-ink-200 pt-16">
        <h2 className="mb-6 font-serif text-3xl font-bold text-ink-900">
          AI is global. Regulation is local.
        </h2>
        <p className="mb-8 max-w-3xl text-lg text-ink-600">
          Excellent AI agents are being built everywhere — but compliance
          isn&rsquo;t transferable. A team shipping a stellar agent into a
          new market spends months and tens of thousands of euros proving it
          complies with rules it was never designed against. AiAuditor turns
          that into <strong className="text-ink-900">60 seconds of on-chain attestation</strong> any buyer, anywhere,
          can independently verify.
        </p>
        <div className="grid gap-8 text-ink-600 sm:grid-cols-2">
          <p>
            The EU AI Act becomes fully applicable on{" "}
            <strong className="text-ink-900">2 August 2026</strong> — high-risk
            conformity assessment, CE marking, Article 50 transparency
            obligations all in force. Penalties reach{" "}
            <strong className="text-ink-900">€35M or 7% of global turnover</strong>.
          </p>
          <p>
            ERC-8004 went live on Ethereum mainnet on 29 January 2026.{" "}
            <strong className="text-ink-900">200,000+ AI agents</strong> are
            registered. None of them yet have a standard verifiable record of
            compliance. AiAuditor is that record.
          </p>
        </div>
      </section>

      <footer className="mt-24 flex flex-col gap-4 border-t border-ink-200 pt-8 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© AiAuditor · open source on GitHub</p>
        <p className="font-mono text-xs">v0.0.1 · Sepolia testnet</p>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs text-ink-400">{n}</p>
      <h3 className="mb-2 font-serif text-xl font-bold text-ink-900">{title}</h3>
      <p className="text-ink-600">{body}</p>
    </div>
  );
}
