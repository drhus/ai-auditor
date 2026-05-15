import Link from "next/link";

/**
 * 8RR8 brand wordmark.
 *
 * Pronunciation: "8" reads "ate" → 8R + R8 → "R-ate, R-ate" → RATE.
 * Visual hint: outer "8"s in muted weight, inner "RR" in full ink so
 * the eye reads the letters that form the spoken word. A small
 * uppercase "RATE" caption sits to the right as a pronunciation guide.
 */
export function BrandMark({
  href = "/",
  size = "md",
  showCaption = true,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  showCaption?: boolean;
}) {
  const wordSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  const captionSize = size === "lg" ? "text-[11px]" : "text-[10px]";
  return (
    <Link
      href={href}
      aria-label="8RR8 — RATE — home"
      className="group inline-flex items-baseline gap-2 no-underline"
    >
      <span
        className={`font-serif font-bold tracking-tight text-ink-900 ${wordSize}`}
      >
        <span className="text-ink-400 transition group-hover:text-ink-900">8</span>
        <span>RR</span>
        <span className="text-ink-400 transition group-hover:text-ink-900">8</span>
      </span>
      {showCaption && (
        <span
          className={`font-mono uppercase tracking-[0.25em] text-ink-400 ${captionSize}`}
          aria-hidden="true"
        >
          rate
        </span>
      )}
    </Link>
  );
}
