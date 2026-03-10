import { useState, useEffect, useCallback, memo } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { WordByWord } from "./WordByWord";
import { TranslationBlock } from "./TranslationBlock";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useTranslation } from "~/hooks/useTranslation";
import { useShallow } from "zustand/react/shallow";

interface AyahTextProps {
  verse: Verse;
  viewMode?: ViewMode;
  onPlayFromVerse?: (verseKey: string) => void;
  onTogglePlayPause?: () => void;
}

export const AyahText = memo(function AyahText({
  verse,
  viewMode: viewModeProp,
  onPlayFromVerse,
  onTogglePlayPause,
}: AyahTextProps) {
  const { t } = useTranslation();

  // Consolidated preferences selector — single subscription instead of 8
  const prefs = usePreferencesStore(useShallow((s) => ({
    viewMode: s.viewMode,
    colorizeWords: s.colorizeWords,
    colorPaletteId: s.colorPaletteId,
    normalArabicFontSize: s.normalArabicFontSize,
    normalTranslationFontSize: s.normalTranslationFontSize,
    normalShowTranslation: s.normalShowTranslation,
    normalShowWordHover: s.normalShowWordHover,
    wbwShowTranslation: s.wbwShowTranslation,
  })));

  const colors = getActiveColors({ colorPaletteId: prefs.colorPaletteId });
  const viewMode = viewModeProp ?? prefs.viewMode;
  const showTranslation = viewMode === "wordByWord" ? prefs.wbwShowTranslation : prefs.normalShowTranslation;

  // Audio selectors — only re-render when THIS verse's audio state changes
  const isCurrentVerse = useAudioStore((s) => s.currentVerseKey === verse.verse_key);
  const activeWordPos = useAudioStore((s) =>
    s.currentVerseKey === verse.verse_key && s.playbackState === "playing"
      ? s.currentWordPosition
      : null
  );
  const isAudioPlaying = useAudioStore((s) =>
    s.currentVerseKey === verse.verse_key &&
    (s.playbackState === "playing" || s.playbackState === "paused")
  );
  const playbackState = useAudioStore((s) =>
    s.currentVerseKey === verse.verse_key ? s.playbackState : null
  );

  // Tap-to-reveal: local state for temporarily showing translation
  const [revealed, setRevealed] = useState(false);

  // Reset revealed when showTranslation becomes true
  useEffect(() => {
    if (showTranslation) setRevealed(false);
  }, [showTranslation]);

  const effectiveShowTranslation = showTranslation || revealed;

  const isPlayingThisVerse = isCurrentVerse && isAudioPlaying;

  // Copy to clipboard
  const [expandedTranslations, setExpandedTranslations] = useState<Set<number>>(
    () => new Set([0]),
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const arabicText = verse.words
      ? verse.words
          .filter((w) => w.char_type_name === "word")
          .map((w) => w.text_uthmani)
          .join(" ")
      : verse.text_uthmani;

    const parts = [verse.verse_key, "", arabicText];

    if (verse.translations) {
      const expanded = verse.translations.length === 1
        ? verse.translations
        : verse.translations.filter((_, i) => expandedTranslations.has(i));

      for (const t of expanded) {
        const plainText = t.text.replace(/<[^>]*>/g, "");
        parts.push("", `${t.resource_name}: ${plainText}`);
      }
    }

    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [verse, expandedTranslations]);

  return (
    <div
      id={`verse-${verse.verse_key}`}
      role="article"
      aria-label={`${t.quranReader.verseLabel} ${verse.verse_key}`}
      className={`animate-fade-in group px-4 py-7 transition-colors sm:px-6 ${
        isCurrentVerse && isAudioPlaying
          ? "bg-[var(--theme-highlight-bg)]"
          : "hover:bg-[var(--theme-hover-bg)]"
      } ${!showTranslation && !revealed ? "cursor-pointer" : ""}`}
      onClick={
        !showTranslation && !revealed
          ? () => setRevealed(true)
          : undefined
      }
    >
      {/* Verse ref + controls */}
      <div className="mb-3 flex items-center justify-between sm:ml-[44px]">
        <span className="select-all text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
          {verse.verse_key}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
              copied
                ? "bg-green-500 text-white"
                : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
            }`}
            aria-label={t.quranReader.copy}
          >
            <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </>
              )}
            </svg>
          </button>
        {onPlayFromVerse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlayingThisVerse && onTogglePlayPause) {
                onTogglePlayPause();
              } else {
                onPlayFromVerse(verse.verse_key);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
              isPlayingThisVerse
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-secondary)]"
            }`}
            aria-label={
              isPlayingThisVerse
                ? `${t.quranReader.pauseVerseAudio} ${verse.verse_key}`
                : `${t.quranReader.playFromVerse} ${verse.verse_key}`
            }
          >
            <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="currentColor">
              {isPlayingThisVerse && playbackState === "playing" ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5.14v14l11-7-11-7z" />
              )}
            </svg>
          </button>
        )}
        </div>
      </div>
      {/* Verse number + Arabic text */}
      <div className="mb-4 flex items-start gap-4">
        <span
          className="mt-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[11px] font-semibold tabular-nums text-[var(--theme-text-secondary)]"
          aria-hidden="true"
        >
          {verse.verse_number}
        </span>
        <div className="min-w-0 flex-1" dir="rtl">
          {viewMode === "wordByWord" && verse.words ? (
            <WordByWord
              words={verse.words}
              colorizeWords={prefs.colorizeWords}
              colors={colors}
              activeWordPosition={activeWordPos}
            />
          ) : (
            <p className="arabic-text leading-[2.6] text-[var(--theme-text)]" style={{ fontSize: `calc(1.65rem * ${prefs.normalArabicFontSize})` }}>
              {verse.words
                ? verse.words
                    .filter((w) => w.char_type_name === "word")
                    .map((w, i) => {
                      const isActiveWord =
                        activeWordPos !== null && w.position === activeWordPos;
                      const hasTooltip = prefs.normalShowWordHover && (w.translation?.text || w.transliteration?.text);
                      return (
                        <span
                          key={w.id}
                          className={`word-highlight ${isActiveWord ? "active" : ""} ${hasTooltip ? "group/word relative inline-block" : ""}`}
                          style={
                            prefs.colorizeWords && colors.length > 0
                              ? { color: isActiveWord ? undefined : colors[i % colors.length] }
                              : undefined
                          }
                        >
                          {w.text_uthmani}{" "}
                          {hasTooltip && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--theme-bg-elevated)] px-2.5 py-1.5 text-center opacity-0 shadow-[var(--shadow-float)] transition-opacity group-hover/word:opacity-100 group-active/word:opacity-100" dir="ltr">
                              {w.translation?.text && (
                                <span className="block text-[12px] font-medium leading-snug text-[var(--theme-text)]">{w.translation.text}</span>
                              )}
                              {w.transliteration?.text && (
                                <span className="block text-[11px] leading-snug text-[var(--theme-text-tertiary)]">{w.transliteration.text}</span>
                              )}
                            </span>
                          )}
                        </span>
                      );
                    })
                : verse.text_uthmani}
            </p>
          )}
        </div>
      </div>

      {/* Translation */}
      {effectiveShowTranslation && verse.translations && verse.translations.length > 0 && (
        <div className="sm:ml-[44px]">
          <TranslationBlock
            translations={verse.translations}
            fontSize={prefs.normalTranslationFontSize}
            revealed={revealed && !showTranslation}
            onExpandedChange={setExpandedTranslations}
          />
        </div>
      )}

    </div>
  );
});
