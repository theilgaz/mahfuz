/**
 * Sure başlık bileşeni — tezhip tarzı süslü ayraç + besmele + play butonu.
 * Sayfa görünümünde sure başında gösterilir.
 */

import { PlaySurahButton } from "./PlaySurahButton";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";

interface SurahHeaderProps {
  surahId?: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation?: string;
  showBismillah: boolean;
  /** Mushaf sayfası içinde — minimal dikey boşluk */
  compact?: boolean;
}

/** Küçük elmas motifi — bant kenarlarında dekoratif süs. */
function DiamondAccent() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true" className="shrink-0">
      <rect
        x="4" y="0.5"
        width="5" height="5"
        rx="0.5"
        transform="rotate(45 4 0.5)"
        fill="var(--color-accent)"
        opacity="0.5"
      />
    </svg>
  );
}

export function SurahHeader({ surahId, nameArabic, nameSimple, nameTranslation, showBismillah, compact }: SurahHeaderProps) {
  const locale = useLocaleStore((s) => s.locale);
  const localizedSimple = surahId ? (getSurahName(surahId, locale) || nameSimple) : nameSimple;
  const localizedMeaning = surahId ? (getSurahMeaning(surahId, locale) || nameTranslation) : nameTranslation;

  return (
    <div className={`${compact ? "my-2" : "my-6"} select-none`}>
      {/* Üst tezhip bandı */}
      <div className={`flex items-center gap-1.5 ${compact ? "mb-1.5" : "mb-3"}`}>
        <div className="flex-1 h-[1.5px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.3 }} />
        <DiamondAccent />
        <div className="flex-1 h-[1.5px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.3 }} />
      </div>

      {/* Sure adı kutusu — zengin bordür + iç parıltı */}
      <div
        className="flex flex-col items-center gap-1 px-4 py-2.5 w-full rounded border border-[var(--color-border)]"
      >
        <div className="flex items-center justify-center gap-3">
          {surahId && (
            <PlaySurahButton surahId={surahId} surahName={nameSimple} />
          )}
          <span
            className="text-2xl text-[var(--color-text-primary)] leading-none"
            dir="rtl"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {nameArabic}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)] shrink-0">{localizedSimple}</span>
        </div>
        {localizedMeaning && (
          <span className="text-[0.65rem] text-[var(--color-text-secondary)] opacity-60 tracking-wide">
            {localizedMeaning}
          </span>
        )}
      </div>

      {/* Besmele */}
      {showBismillah && (
        <p
          className={`${compact ? "mt-2" : "mt-4"} text-center text-[var(--color-text-primary)]`}
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: compact ? "clamp(1.2rem, 3.5vw, 2rem)" : "clamp(1.6rem, 4vw, 2.8rem)" }}
        >
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Alt tezhip bandı */}
      <div className={`flex items-center gap-1.5 ${compact ? "mt-1.5" : "mt-3"}`}>
        <div className="flex-1 h-[1.5px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.3 }} />
        <DiamondAccent />
        <div className="flex-1 h-[1.5px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.3 }} />
      </div>
    </div>
  );
}
