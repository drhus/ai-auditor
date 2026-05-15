"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/strings";

export function LanguageSwitcher({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function pick(loc: Locale) {
    if (loc === locale) return;
    setLocale(loc);
    startTransition(async () => {
      try {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: loc }),
        });
        router.refresh();
      } catch {
        /* swallow */
      }
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-md border border-ink-200 bg-white p-0.5 text-xs"
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => pick(l)}
            disabled={pending}
            className={`rounded px-2 py-1 transition ${
              active
                ? "bg-ink-900 text-ink-50"
                : "text-ink-600 hover:text-ink-900"
            }`}
            aria-pressed={active}
          >
            {LOCALE_NAMES[l]}
          </button>
        );
      })}
    </div>
  );
}
