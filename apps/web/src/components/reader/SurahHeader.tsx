/**
 * Sure başlık bileşeni — mushaf tarzı süslü ayraç + besmele + play butonu.
 * Sayfa görünümünde sure başında gösterilir.
 */

import { PlaySurahButton } from "./PlaySurahButton";

interface SurahHeaderProps {
  surahId?: number;
  nameArabic: string;
  nameSimple: string;
  showBismillah: boolean;
  /** Mushaf sayfası içinde — minimal dikey boşluk */
  compact?: boolean;
}

export function SurahHeader({ surahId, nameArabic, nameSimple, showBismillah, compact }: SurahHeaderProps) {
  const label = nameSimple;
  return (
    <div className={`${compact ? "my-2" : "my-6"} select-none`}>
      {/* Üst süslü çizgi */}
      <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-3"}`}>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] opacity-60" />
        </div>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Sure adı kutusu */}
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 mx-auto max-w-xs
        border border-[var(--color-accent)]/40 rounded
        bg-[var(--color-accent)]/5">
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
        <span className="text-sm text-[var(--color-text-secondary)] shrink-0">{label}</span>
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

      {/* Alt süslü çizgi */}
      <div className={`flex items-center gap-2 ${compact ? "mt-1.5" : "mt-3"}`}>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] opacity-60" />
        </div>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>
    </div>
  );
}
