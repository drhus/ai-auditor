import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : null;
  const auditRef =
    typeof body === "object" && body !== null && "audit_ref" in body
      ? (body as { audit_ref: unknown }).audit_ref
      : null;

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Provide a valid email." }, { status: 422 });
  }

  const entry = {
    email,
    audit_ref: typeof auditRef === "string" ? auditRef : null,
    at: new Date().toISOString(),
  };

  // V0: append to a flat file in /tmp (Vercel serverless is read-only on /var/task).
  // In Vercel, /tmp is writable per-instance only — set WAITLIST_STORAGE=memory or replace
  // with Vercel KV / Postgres for durability.
  if (process.env.WAITLIST_STORAGE === "file") {
    try {
      const dir = "/tmp";
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(
        path.join(dir, "ai-auditor-waitlist.jsonl"),
        JSON.stringify(entry) + "\n",
      );
    } catch {
      // Swallow — V0 prioritises UX over persistence
    }
  }

  // Always log so it appears in Vercel function logs even if storage is off.
  console.log("[waitlist]", JSON.stringify(entry));

  return NextResponse.json({ ok: true });
}
