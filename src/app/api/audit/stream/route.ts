import { runAudit } from "@/pipeline/run";
import { createState, setError } from "@/pipeline/store";
import { generateAuditId } from "@/pipeline/id";
import type { AuditInput } from "@/pipeline/types";
import type { AuditEvent } from "@/pipeline/events";

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
    return jsonError("Body must be JSON.", 400);
  }

  const auditId = generateAuditId();
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
    if (!m) return jsonError("Could not parse repoUrl into owner/repo.", 422);
    input = {
      auditId,
      source: { kind: "repo", owner: m[1], repo: m[2] },
      repoUrl: body.source.repoUrl,
      regulations: body.regulations ?? DEFAULT_REGS,
      agentId: body.source.tokenId,
      chain: body.source.chain,
    };
  } else {
    return jsonError("Provide either a repo source or an agent source with repoUrl.", 422);
  }

  await createState(auditId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AuditEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* controller closed */
        }
      };
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          /* closed */
        }
      }, 15_000);

      try {
        await runAudit(input, send);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await setError(auditId, msg);
        send({ kind: "error", message: msg });
      } finally {
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
