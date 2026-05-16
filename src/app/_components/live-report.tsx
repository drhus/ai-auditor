"use client";

import { RichReport } from "@/app/audit/[auditId]/_rich-report";
import type { AuditReport } from "@/pipeline/types";

export function LiveReport({ report }: { report: AuditReport }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-pass)] bg-white px-5 py-3">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-pass)]">
          ✓ Audit complete
        </p>
        <div className="flex gap-2 text-xs">
          <a
            href={`/audit/${report.auditId}`}
            className="rounded bg-ink-900 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-50 no-underline"
          >
            Permalink
          </a>
          <a
            href="/audits"
            className="rounded border border-ink-200 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-900 no-underline"
          >
            All audits
          </a>
        </div>
      </div>
      <RichReport report={report} />
    </div>
  );
}
