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
      <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 animate-pulse">
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
    <div className="mb-4 rounded-2xl border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)] overflow-hidden">
      {/* Üst şerit */}
      <div className="px-4 pt-3 pb-0 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-[var(--color-accent)] uppercase opacity-70">
          {t.home.dailyVerse}
        </span>
        {surah && (
          <span className="text-[10px] text-[var(--color-text-secondary)]">
            {getSurahName(surah.id, locale)} · {verse.ayahNumber}
          </span>
        )}
      </div>

      {/* Arapça metin */}
      <div className="px-4 pt-2 pb-1">
        <p
          className="text-right leading-loose text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "1.45rem", direction: "rtl" }}
        >
          {verse.textUthmani}
        </p>
      </div>

      {/* Türkçe meal */}
      {translation && (
        <div className="px-4 pb-3 border-t border-[var(--color-border)]/40 pt-2 mt-1">
          <p className="text-sm text-[var(--color-text-translation)] leading-relaxed line-clamp-3">
            {translation.text}
          </p>
        </div>
      )}

      {/* Devam et butonu */}
      {slug && (
        <div className="px-4 pb-3 flex items-center justify-between">
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: slug }}
            search={{ ayah: verse.ayahNumber }}
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            {t.home.readInSurah}
          </Link>
          <button
            type="button"
            onClick={() => {
              const text = `${verse.textUthmani}\n\n${translation?.text ?? ""}\n\n${getSurahName(surah.id, locale)} ${verse.ayahNumber} · İkra`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {t.home.share}
          </button>
        </div>
      )}
    </div>
  );
}
