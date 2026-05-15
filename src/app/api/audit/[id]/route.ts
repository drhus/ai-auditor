import { NextResponse } from "next/server";
import { getState } from "@/pipeline/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const state = getState(id);
  if (!state) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
