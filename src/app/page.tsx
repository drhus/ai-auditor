import Link from "next/link";
import { IntakeForm } from "./_components/intake-form";
import { NutritionalFactsPanel } from "./_components/nutritional-facts";
import { BrandMark } from "./_components/brand-mark";
import { LanguageSwitcher } from "./_components/language-switcher";
import { getLocale, getT } from "@/i18n/server";

export default async function Home() {
  const locale = await getLocale();
  const t = await getT();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-5 text-sm text-ink-600">
          <Link href="/audits" className="no-underline hover:text-ink-900">
            {t("nav.audits")}
          </Link>
          <Link href="/docs" className="no-underline hover:text-ink-900">
            {t("nav.docs")}
          </Link>
          <Link href="/about" className="no-underline hover:text-ink-900">
            {t("nav.about")}
          </Link>
          <a
            href="https://github.com/drhus/ai-auditor"
            className="no-underline hover:text-ink-900"
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.github")}
          </a>
          <LanguageSwitcher initialLocale={locale} />
        </div>
      </header>

      <section className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-400">
            {t("landing.eyebrow")}
          </p>
          <h1 className="mb-4 font-serif text-5xl font-bold leading-[1.05] text-ink-900 sm:text-6xl">
            {t("landing.hero.line1")}
            <br />
            {t("landing.hero.line2")}
          </h1>
          <p className="mb-6 max-w-xl text-base font-medium text-ink-900">
            {t("landing.hero.subhead")}
          </p>
          <p className="mb-10 max-w-xl text-lg text-ink-600">
            {t("landing.hero.description")}
          </p>
          <IntakeForm
            placeholder={t("landing.hero.placeholder")}
            submitLabel={t("landing.hero.submit")}
            submittingLabel={t("landing.hero.submitting")}
          />
          <p className="mt-6 max-w-xl font-mono text-xs text-ink-400">
            {t("landing.hero.examples")}
          </p>
        </div>

        <div className="lg:pt-2">
          <NutritionalFactsPanel />
        </div>
      </section>

      <section className="mt-24 grid gap-8 border-t border-ink-200 pt-16 sm:grid-cols-3">
        <Step n="01" title={t("landing.steps.01.title")} body={t("landing.steps.01.body")} />
        <Step n="02" title={t("landing.steps.02.title")} body={t("landing.steps.02.body")} />
        <Step n="03" title={t("landing.steps.03.title")} body={t("landing.steps.03.body")} />
      </section>

      <section className="mt-24 border-t border-ink-200 pt-16">
        <h2 className="mb-6 font-serif text-3xl font-bold text-ink-900">
          {t("landing.why.title")}
        </h2>
        <p className="mb-8 max-w-3xl text-lg text-ink-600">
          {t("landing.why.lead")}
        </p>
        <div className="grid gap-8 text-ink-600 sm:grid-cols-2">
          <p>{t("landing.why.eu")}</p>
          <p>{t("landing.why.8004")}</p>
        </div>
      </section>

      <footer className="mt-24 flex flex-col gap-4 border-t border-ink-200 pt-8 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("landing.footer.copyright")}</p>
        <p className="font-mono text-xs">{t("landing.footer.version")}</p>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs text-ink-400">{n}</p>
      <h3 className="mb-2 font-serif text-xl font-bold text-ink-900">{title}</h3>
      <p className="text-ink-600">{body}</p>
    </div>
  );
}
