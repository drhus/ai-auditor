import { NextResponse } from "next/server";
import { parseAgentInput, ParseError } from "@/lib/parse-url";
import { resolveAgent } from "@/lib/erc8004";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const input =
    typeof body === "object" && body !== null && "input" in body
      ? (body as { input: unknown }).input
      : null;

  if (typeof input !== "string") {
    return NextResponse.json(
      { error: "Body must include `input` (string)." },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = parseAgentInput(input);
  } catch (e) {
    if (e instanceof ParseError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Could not parse input." }, { status: 422 });
  }

  if (parsed.kind === "repo") {
    return NextResponse.json(
      {
        kind: "repo",
        owner: parsed.owner,
        repo: parsed.repo,
        ref: parsed.ref ?? null,
        repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
        auditPath: `/r/${parsed.owner}/${parsed.repo}`,
      },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      },
    );
  }

  try {
    const agent = await resolveAgent(parsed.chain, parsed.tokenId);
    return NextResponse.json(
      { kind: "agent", auditPath: `/a/${parsed.chain}/${parsed.tokenId}`, ...agent },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolution failed.";
    return NextResponse.json(
      { error: message, hint: "The agent may not be registered on this chain, or the registry address is not yet configured." },
      { status: 502 },
    );
  }
}
