/**
 * Günün Ayeti kartı -- mu-today-card stilinde, editorial tasarım.
 */

import { Link } from "@tanstack/react-router";
import { useDailyVerse } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName } from "~/lib/surah-names-i18n";

/** Decode HTML entities like &quot; &amp; etc. */
function decodeEntities(text: string): string {
  if (!text || !text.includes("&")) return text;
  const el = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (!el) return text.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
  el.innerHTML = text;
  return el.value;
}

export function DailyVerseCard() {
  const { t, locale } = useTranslation();
  const { data, isLoading } = useDailyVerse(locale);

  if (isLoading) {
    return (
      <div className="mu-today-card" style={{ marginBottom: 0 }}>
        <div className="animate-pulse" style={{ position: "relative" }}>
          <div style={{ height: 12, width: 100, borderRadius: 4, background: "var(--mu-line)", marginBottom: 20 }} />
          <div style={{ height: 40, width: "100%", borderRadius: 4, background: "var(--mu-line)", marginBottom: 12 }} />
          <div style={{ height: 40, width: "80%", borderRadius: 4, background: "var(--mu-line)", marginBottom: 20 }} />
          <div style={{ height: 16, width: "100%", borderRadius: 4, background: "var(--mu-line)", marginBottom: 8 }} />
          <div style={{ height: 16, width: "75%", borderRadius: 4, background: "var(--mu-line)" }} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { verse, translation, surah } = data;
  const slug = surah ? surahSlug(surah.id) : "";
  const translationText = translation ? decodeEntities(translation.text) : null;

  return (
    <div className="mu-today-card" style={{ marginBottom: 0 }}>
      <div style={{ position: "relative" }}>
        <p className="mu-eyebrow" style={{ margin: "0 0 20px" }}>
          {t.home.dailyVerse}
        </p>

        <p className="mu-today-ar" dir="rtl">
          {verse.textUthmani}
        </p>

        {translationText && (
          <p className="mu-today-tr">
            {translationText}
          </p>
        )}

        {surah && (
          <p className="mu-today-ref">
            {getSurahName(surah.id, locale)} - {t.reader?.ayah ?? "ayet"} {verse.ayahNumber}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {slug && (
            <Link
              to="/surah/$surahSlug"
              params={{ surahSlug: slug }}
              search={{ ayah: verse.ayahNumber }}
              className="mu-btn ghost small"
            >
              {t.home.readInSurah}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              const text = `${verse.textUthmani}\n\n${translationText ?? ""}\n\n${surah ? getSurahName(surah.id, locale) : ""} ${verse.ayahNumber} - Mahfuz\nmahfuz.ilg.az`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="mu-icon-btn sm"
            aria-label={t.home.share}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
