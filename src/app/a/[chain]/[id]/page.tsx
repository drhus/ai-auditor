import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupportedSlug } from "@/lib/chains";
import { resolveAgent, type AgentRegistration } from "@/lib/erc8004";
import { WaitlistForm } from "./_waitlist-form";
import { BrandMark } from "@/app/_components/brand-mark";

interface PageProps {
  params: Promise<{ chain: string; id: string }>;
}

export default async function AgentPage({ params }: PageProps) {
  const { chain, id } = await params;

  if (!isSupportedSlug(chain) || !/^\d+$/.test(id)) {
    notFound();
  }

  let agent: AgentRegistration | null = null;
  let error: string | null = null;

  try {
    agent = await resolveAgent(chain, BigInt(id));
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not resolve agent.";
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <BrandMark />
        <Link href="/" className="text-sm text-ink-600 no-underline hover:text-ink-900">
          ← New audit
        </Link>
      </header>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        ERC-8004 · {chain} · agent #{id}
      </p>

      {error ? (
        <ErrorPanel message={error} chain={chain} id={id} />
      ) : agent ? (
        <ResolvedAgent agent={agent} />
      ) : (
        <p className="text-ink-600">Resolving…</p>
      )}
    </main>
  );
}

function ResolvedAgent({ agent }: { agent: AgentRegistration }) {
  const name = agent.metadata?.name ?? "Unnamed agent";
  const description = agent.metadata?.description ?? "No description provided.";
  return (
    <>
      <h1 className="mb-4 font-serif text-4xl font-bold text-ink-900">{name}</h1>
      <p className="mb-8 max-w-2xl text-ink-600">{description}</p>

      <div className="mb-10 grid gap-4 rounded-lg border border-ink-200 bg-white p-6 sm:grid-cols-2">
        <Field
          label="Repository"
          value={
            agent.repoUrl ? (
              <a href={agent.repoUrl} target="_blank" rel="noreferrer">
                {agent.repoUrl}
              </a>
            ) : (
              <span className="text-ink-400">No repository in registration</span>
            )
          }
        />
        <Field label="Token URI" value={<code className="break-all text-xs">{agent.tokenURI}</code>} />
        <Field label="Owner" value={agent.owner ? <code className="text-xs">{agent.owner}</code> : "—"} />
        <Field label="Agent wallet" value={agent.wallet ? <code className="text-xs">{agent.wallet}</code> : "—"} />
        <Field label="Registry" value={<code className="text-xs">{agent.registryAddress}</code>} />
        <Field label="Chain ID" value={agent.chainId.toString()} />
      </div>

      <section className="mb-10 rounded-lg border-2 border-ink-900 bg-white p-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
          Audit status
        </p>
        <h2 className="mb-3 font-serif text-2xl font-bold text-ink-900">
          Full audit pipeline coming soon
        </h2>
        <p className="mb-6 text-ink-600">
          We&rsquo;ve identified your agent on ERC-8004. The full audit pipeline
          (EU AI Act + NIST AI RMF, on-chain attestation) is in active build.
          Drop your email and we&rsquo;ll notify you the moment we audit this
          agent.
        </p>
        <WaitlistForm auditRef={`${agent.chain}/${agent.agentId}`} />
      </section>
    </>
  );
}

function ErrorPanel({ message, chain, id }: { message: string; chain: string; id: string }) {
  return (
    <div className="rounded-lg border-2 border-[var(--color-fail)] bg-white p-6">
      <h1 className="mb-3 font-serif text-2xl font-bold text-ink-900">
        Couldn&rsquo;t resolve this agent
      </h1>
      <p className="mb-4 text-ink-600">
        We tried to look up agent #{id} on {chain} but the registry call
        failed. This usually means one of:
      </p>
      <ul className="mb-4 list-disc pl-6 text-ink-600">
        <li>The agent is not registered on this chain.</li>
        <li>The registry address is not yet configured in our environment.</li>
        <li>The chain RPC endpoint is temporarily unavailable.</li>
      </ul>
      <p className="font-mono text-xs text-[var(--color-fail)]">{message}</p>
    </div>
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
