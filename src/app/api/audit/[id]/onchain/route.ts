import { NextResponse } from "next/server";
import { getState } from "@/pipeline/store";
import { encodeOnchainPayload } from "@/pipeline/anchor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preview of the exact payload AiAuditorV1.publishAudit would receive plus
// the companion ValidationRegistry.validationResponse arguments. Lets the UI
// show "this is what we're about to anchor on Sepolia" and lets reviewers
// reproduce the hashes locally.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const state = await getState(id);
  if (!state) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }
  if (state.status !== "completed" || !state.report) {
    return NextResponse.json(
      { error: `Audit not ready. Status: ${state.status}.` },
      { status: 409 },
    );
  }
  try {
    const payload = await encodeOnchainPayload(state.report);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
