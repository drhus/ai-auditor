import Link from "next/link";
import { BrandMark } from "@/app/_components/brand-mark";
import { LanguageSwitcher } from "@/app/_components/language-switcher";
import type { Locale } from "@/i18n/strings";

export function DocsShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-5 text-sm text-ink-600">
          <Link href="/" className="no-underline hover:text-ink-900">
            ← Audit an agent
          </Link>
          <LanguageSwitcher initialLocale={locale} />
        </div>
      </header>

      <nav className="mb-10 flex flex-wrap gap-x-5 gap-y-2 border-b border-ink-200 pb-4 text-sm">
        <Link href="/docs" className="no-underline text-ink-900 hover:underline">
          Overview
        </Link>
        <Link href="/docs/methodology" className="no-underline text-ink-600 hover:text-ink-900">
          Methodology
        </Link>
        <Link href="/docs/rating" className="no-underline text-ink-600 hover:text-ink-900">
          How rating works
        </Link>
        <Link href="/docs/regulations" className="no-underline text-ink-600 hover:text-ink-900">
          Regulations
        </Link>
        <a
          href="https://github.com/drhus/ai-auditor/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="no-underline text-ink-600 hover:text-ink-900"
        >
          Full docs ↗
        </a>
      </nav>

      <article className="prose prose-ink max-w-none">{children}</article>
    </main>
  );
}
