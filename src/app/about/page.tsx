import Link from "next/link";
import { BrandMark } from "../_components/brand-mark";
import { LanguageSwitcher } from "../_components/language-switcher";
import { getLocale, getT } from "@/i18n/server";

export default async function About() {
  const locale = await getLocale();
  const t = await getT();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-5 text-sm text-ink-600">
          <Link href="/" className="no-underline hover:text-ink-900">
            {t("nav.audit_agent")}
          </Link>
          <LanguageSwitcher initialLocale={locale} />
        </div>
      </header>

      <h1 className="mb-4 font-serif text-5xl font-bold leading-[1.05] text-ink-900">
        {t("about.title")}
      </h1>
      <p className="mb-6 max-w-2xl text-lg font-medium text-ink-900">
        {t("about.subhead")}
      </p>

      <div className="space-y-6 text-lg text-ink-600">
        <p>{t("about.global")}</p>
        <p>{t("about.eu")}</p>
        <p>{t("about.8004")}</p>
        <p>{t("about.product")}</p>
        <p>{t("about.pipeline")}</p>
        <p>{t("about.v1")}</p>
        <p>{t("about.open_source")}</p>
      </div>

      <footer className="mt-16 border-t border-ink-200 pt-8 text-sm text-ink-400">
        <p>{t("about.footer")}</p>
      </footer>
    </main>
  );
}
