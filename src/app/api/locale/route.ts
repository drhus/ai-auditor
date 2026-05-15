import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/i18n/strings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { locale?: unknown };
  try {
    body = (await req.json()) as { locale?: unknown };
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const loc = String(body.locale ?? "");
  if (!(LOCALES as readonly string[]).includes(loc)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 422 });
  }
  const res = NextResponse.json({ ok: true, locale: loc });
  res.cookies.set("locale", loc as Locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
