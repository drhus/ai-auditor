import Link from "next/link";

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-ink-900 no-underline">
          AiAuditor
        </Link>
        <Link href="/" className="text-sm text-ink-600 no-underline hover:text-ink-900">
          ← Audit an agent
        </Link>
      </header>

      <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.05] text-ink-900">
        The FDA stamp for AI agents.
      </h1>

      <div className="prose-paragraphs space-y-6 text-lg text-ink-600">
        <p>
          AI is global. Regulation is local. World-class AI agents are being
          built in many markets — but compliance is not transferable. A team
          that built a stellar agent in one jurisdiction has to spend months
          and tens of thousands of euros proving it complies with the rules of
          every other jurisdiction they want to sell into. That gap is
          killing cross-border AI commerce.
        </p>
        <p>
          The EU AI Act becomes fully applicable on{" "}
          <strong className="text-ink-900">2 August 2026</strong> with
          high-risk conformity assessment, CE marking, and Article 50
          transparency obligations all in force. Penalties for prohibited-practice
          violations reach €35M or 7% of global turnover. Manual audits cost
          €25k–€150k and take weeks.
        </p>
        <p>
          In parallel,{" "}
          <strong className="text-ink-900">ERC-8004</strong> — Ethereum&rsquo;s
          standard for trustless AI agents — went live on mainnet on 29 January
          2026. Forty-five thousand agents are already registered. None of them
          yet have a standard verifiable record of compliance.
        </p>
        <p>
          AiAuditor is that record. Paste an ERC-8004 agent URL, we resolve the
          registered repository, run a multi-stage audit pipeline against the
          EU AI Act and NIST AI RMF, and publish a per-clause score on chain.
          Every finding cites a file and line in the audited code.
        </p>
        <p>
          The audit pipeline is multi-stage. RECON discovers your agent&rsquo;s
          framework, model usage, and data signals. MAP determines whether you
          fall under high-risk classification. CHECK runs deterministic and
          LLM-judge probes against each in-scope clause. VERIFY confirms
          findings with a second pass. GRADE scores. REPORT anchors on chain.
        </p>
        <p>
          V1 runs on Sepolia and audits only ERC-8004-registered agents. Each
          audit emits one packed{" "}
          <code className="font-mono text-base">AuditScored</code> event from
          our open-source contract plus a canonical{" "}
          <code className="font-mono text-base">validationResponse</code> on
          the ERC-8004 Validation Registry — so audits show up in standard
          8004 discovery queries.
        </p>
        <p>
          Everything is open source on{" "}
          <a href="https://github.com/drhus/ai-auditor" target="_blank" rel="noreferrer">
            GitHub
          </a>
          . The regulations are public; what compounds is the checker
          library — an evolving open-source canonical implementation that
          anyone can re-run against the same commit to independently verify
          our verdicts.
        </p>
      </div>

      <footer className="mt-16 border-t border-ink-200 pt-8 text-sm text-ink-400">
        <p>This is V0 — an early scaffold. The full audit pipeline is in active build.</p>
      </footer>
    </main>
  );
}
