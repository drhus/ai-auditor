import { cookies } from "next/headers";
import { LOCALES, tFor, type Locale } from "./strings";

const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw && (LOCALES as readonly string[]).includes(raw)) {
    return raw as Locale;
  }
  return "en";
}

export async function getT(): Promise<(key: string) => string> {
  const locale = await getLocale();
  return tFor(locale);
}

export { LOCALE_COOKIE };
