import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/app/_components/brand-mark";
import { getState } from "@/pipeline/store";
import { RichReport } from "./_rich-report";
import { LiveStatus } from "./_live-status";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ auditId: string }>;
}

export default async function AuditDetailPage({ params }: PageProps) {
  const { auditId } = await params;
  const state = await getState(auditId);

  if (!state) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <BrandMark />
        <Link
          href="/audits"
          className="text-sm text-ink-600 no-underline hover:text-ink-900"
        >
          ← All audits
        </Link>
      </header>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        Audit · {state.auditId}
      </p>

      {state.status !== "completed" ? (
        <LiveStatus initialState={state} />
      ) : state.report ? (
        <RichReport report={state.report} />
      ) : (
        <p className="text-ink-600">No report attached.</p>
      )}

      <footer className="mt-16 border-t border-ink-200 pt-8 text-xs text-ink-400">
        <p>
          Audits are reproducible: clone our checker at the noted commit, run
          against the same SHA, get the same <code>bundleHash</code>. Mismatch
          means one of the inputs drifted.
        </p>
      </footer>
    </main>
  );
}
