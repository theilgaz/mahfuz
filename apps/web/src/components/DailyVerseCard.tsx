/**
 * Günün Ayeti kartı — tarihe göre deterministik ayet, güzel tasarım.
 */

import { Link } from "@tanstack/react-router";
import { useDailyVerse } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName } from "~/lib/surah-names-i18n";

export function DailyVerseCard() {
  const { data, isLoading } = useDailyVerse();
  const { t, locale } = useTranslation();

  if (isLoading) {
    return (
      <div className="mb-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 animate-pulse">
        <div className="h-3 w-20 rounded bg-[var(--color-border)] mb-3" />
        <div className="h-8 w-full rounded bg-[var(--color-border)] mb-2" />
        <div className="h-8 w-4/5 rounded bg-[var(--color-border)] mb-3" />
        <div className="h-3 w-full rounded bg-[var(--color-border)] mb-1" />
        <div className="h-3 w-3/4 rounded bg-[var(--color-border)]" />
      </div>
    );
  }

  if (!data) return null;

  const { verse, translation, surah } = data;
  const slug = surah ? surahSlug(surah.id) : "";

  return (
    <div className="mb-4 rounded border border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Ust serit */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase">
          {t.home.dailyVerse}
        </span>
        {surah && (
          <span className="text-[11px] text-[var(--color-text-secondary)]">
            {getSurahName(surah.id, locale)} · {verse.ayahNumber}
          </span>
        )}
      </div>

      {/* Arapca metin */}
      <div className="px-4 pt-3 pb-2">
        <p
          className="text-right leading-[2] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "1.5rem", direction: "rtl" }}
        >
          {verse.textUthmani}
        </p>
      </div>

      {/* Meal */}
      {translation && (
        <div className="px-4 pb-3">
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
            {translation.text}
          </p>
        </div>
      )}

      {/* Alt linkler */}
      {slug && (
        <div className="mx-4 py-2.5 flex items-center justify-between border-t border-[var(--color-border)] mb-2.5">
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: slug }}
            search={{ ayah: verse.ayahNumber }}
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            {t.home.readInSurah} →
          </Link>
          <button
            type="button"
            onClick={() => {
              const text = `${verse.textUthmani}\n\n${translation?.text ?? ""}\n\n${getSurahName(surah.id, locale)} ${verse.ayahNumber} · Mahfuz`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            aria-label={t.home.share}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
