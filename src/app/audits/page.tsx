import Link from "next/link";
import { BrandMark } from "@/app/_components/brand-mark";
import { listRecent } from "@/pipeline/store";
import { AuditsTable } from "./_audits-table";

export const dynamic = "force-dynamic";

export default async function AuditsDirectory() {
  const states = await listRecent(200);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <BrandMark />
        <Link
          href="/"
          className="text-sm text-ink-600 no-underline hover:text-ink-900"
        >
          ← New audit
        </Link>
      </header>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-400">
        Public directory
      </p>
      <h1 className="mb-2 font-serif text-4xl font-bold text-ink-900">
        Audits
      </h1>
      <p className="mb-8 max-w-3xl text-ink-600">
        Every audit run on 8RR8 lands here, searchable by audit ID, repo,
        commit SHA, or risk class. Click through to a full report.
      </p>

      {states.length === 0 ? (
        <div className="rounded-lg border border-ink-200 bg-white p-10 text-center">
          <p className="mb-2 font-serif text-xl font-bold text-ink-900">
            No audits yet
          </p>
          <p className="text-sm text-ink-600">
            Run the first one from{" "}
            <Link href="/">the landing page</Link>.
          </p>
        </div>
      ) : (
        <AuditsTable
          rows={states.map((s) => ({
            auditId: s.auditId,
            status: s.status,
            startedAt: s.startedAt,
            repoUrl: s.report?.fetch?.repoUrl ?? null,
            commitSha: s.report?.fetch?.commitSha ?? null,
            risk: s.report?.map?.classification ?? null,
            score: s.report?.grade?.overallScore ?? null,
            owner: s.report?.fetch?.owner ?? null,
            repo: s.report?.fetch?.repo ?? null,
          }))}
        />
      )}
    </main>
  );
}
