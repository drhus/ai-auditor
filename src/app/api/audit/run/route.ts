import { NextResponse } from "next/server";
import { runAudit } from "@/pipeline/run";
import { createState, setError } from "@/pipeline/store";
import { generateAuditId } from "@/pipeline/id";
import type { AuditInput } from "@/pipeline/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro

const DEFAULT_REGS = ["eu-ai-act-2024-08", "nist-ai-rmf-1.0"];

interface StartRequest {
  source:
    | { kind: "repo"; owner: string; repo: string; ref?: string }
    | { kind: "agent"; chain: string; tokenId: string; repoUrl?: string };
  regulations?: string[];
}

export async function POST(req: Request) {
  let body: StartRequest;
  try {
    body = (await req.json()) as StartRequest;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const auditId = generateAuditId();
  createState(auditId);

  // Build the AuditInput. For 8004-agent sources without an attached repoUrl
  // we refuse — front-end must collect repoUrl first.
  let input: AuditInput;
  if (body.source.kind === "repo") {
    input = {
      auditId,
      source: body.source,
      repoUrl: `https://github.com/${body.source.owner}/${body.source.repo}`,
      ref: body.source.ref,
      regulations: body.regulations ?? DEFAULT_REGS,
    };
  } else if (body.source.kind === "agent" && body.source.repoUrl) {
    const m = body.source.repoUrl.match(
      /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/,
    );
    if (!m) {
      return NextResponse.json(
        { error: "Could not parse repoUrl into owner/repo." },
        { status: 422 },
      );
    }
    input = {
      auditId,
      source: { kind: "repo", owner: m[1], repo: m[2] },
      repoUrl: body.source.repoUrl,
      regulations: body.regulations ?? DEFAULT_REGS,
      agentId: body.source.tokenId,
      chain: body.source.chain,
    };
  } else {
    return NextResponse.json(
      { error: "Provide either a repo source or an agent source with repoUrl." },
      { status: 422 },
    );
  }

  // Fire-and-forget: caller polls /api/audit/[id] for status.
  void runAudit(input).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    setError(auditId, msg);
  });

  return NextResponse.json({ auditId, status: "queued" }, { status: 202 });
}
