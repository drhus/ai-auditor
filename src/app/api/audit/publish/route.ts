import { NextResponse } from "next/server";
import { createState, getState, setReport } from "@/pipeline/store";
import type { AuditReport } from "@/pipeline/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Idempotently writes a completed AuditReport into the persistent store.
// Called by the live audit panel after the SSE stream finishes — gives the
// /audits directory and /audit/[id] permalink a chance to show the result
// even if the original stream ran on a different serverless instance.
export async function POST(req: Request) {
  let body: { report?: AuditReport };
  try {
    body = (await req.json()) as { report?: AuditReport };
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const report = body.report;
  if (!report || !report.auditId || !report.bundleHash) {
    return NextResponse.json({ error: "Missing report fields." }, { status: 422 });
  }

  const existing = await getState(report.auditId);
  if (!existing) {
    await createState(report.auditId);
  }
  await setReport(report.auditId, report);

  return NextResponse.json({ ok: true, auditId: report.auditId });
}
