import type { ArabicLetter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface LetterCardProps {
  letter: ArabicLetter;
  showDetails?: boolean;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export function LetterCard({ letter, showDetails = true, onPlayAudio, isPlaying }: LetterCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      {/* Large Arabic glyph */}
      <div className="mb-4 flex items-center justify-center">
        <span className="arabic-text text-[72px] leading-none text-[var(--theme-text)]" dir="rtl">
          {letter.forms.isolated}
        </span>
      </div>

      {/* Name and transliteration */}
      <div className="mb-3 text-center">
        <p className="arabic-text text-lg text-[var(--theme-text-secondary)]" dir="rtl">
          {letter.nameArabic}
        </p>
        <p className="text-[14px] font-medium text-[var(--theme-text)]">
          {letter.nameRoman}
        </p>
        <p className="text-[12px] text-[var(--theme-text-tertiary)]">
          {letter.sound}
        </p>
      </div>

      {/* Audio button */}
      {onPlayAudio && (
        <button
          onClick={onPlayAudio}
          disabled={isPlaying}
          className="mx-auto mb-3 flex items-center gap-1.5 rounded-full bg-primary-600/10 px-3 py-1.5 text-[12px] font-medium text-primary-700 transition-all hover:bg-primary-600/20 active:scale-95 disabled:opacity-50"
        >
          {isPlaying ? (
            <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-primary-600" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isPlaying ? t.common.loading : t.quranReader.listen}
        </button>
      )}

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 border-t border-[var(--theme-border)] pt-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--theme-text-tertiary)]">{t.learn.makhraj}</span>
            <span className="text-[var(--theme-text-secondary)]">{letter.makhrajPoint}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--theme-text-tertiary)]">{t.learn.dots}</span>
            <span className="text-[var(--theme-text-secondary)]">
              {letter.dotsCount === 0 ? t.learn.noDots : `${letter.dotsCount} (${letter.dotsPosition === "above" ? t.learn.above : t.learn.below})`}
            </span>
          </div>
          {letter.forms.isNonConnector && (
            <p className="text-[11px] font-medium text-amber-600">
              {t.learn.nonConnector}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
