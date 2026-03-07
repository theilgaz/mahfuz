import { useState, useEffect } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { WordByWord } from "./WordByWord";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";

interface AyahTextProps {
  verse: Verse;
  viewMode?: ViewMode;
  showTranslation?: boolean;
  onPlayFromVerse?: (verseKey: string) => void;
  onTogglePlayPause?: () => void;
}

export function AyahText({
  verse,
  viewMode: viewModeProp,
  showTranslation = true,
  onPlayFromVerse,
  onTogglePlayPause,
}: AyahTextProps) {
  const storeViewMode = usePreferencesStore((s) => s.viewMode);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const viewMode = viewModeProp ?? storeViewMode;

  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);

  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);
  const playbackState = useAudioStore((s) => s.playbackState);

  const isCurrentVerse = currentVerseKey === verse.verse_key;
  const isAudioPlaying = playbackState === "playing" || playbackState === "paused";
  const activeWordPos =
    isCurrentVerse && playbackState === "playing" ? currentWordPosition : null;

  // Tap-to-reveal: local state for temporarily showing translation
  const [revealed, setRevealed] = useState(false);

  // Reset revealed when showTranslation becomes true
  useEffect(() => {
    if (showTranslation) setRevealed(false);
  }, [showTranslation]);

  const effectiveShowTranslation = showTranslation || revealed;

  const isPlayingThisVerse = isCurrentVerse && isAudioPlaying;

  return (
    <div
      id={`verse-${verse.verse_key}`}
      role="article"
      aria-label={`Ayet ${verse.verse_key}`}
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
                ? `Ayet ${verse.verse_key} kaydını duraklat`
                : `Ayet ${verse.verse_key}'den dinle`
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
              colorizeWords={colorizeWords}
              colors={colors}
              activeWordPosition={activeWordPos}
            />
          ) : (
            <p className="arabic-text leading-[2.6] text-[var(--theme-text)]" style={{ fontSize: `calc(1.65rem * ${normalArabicFontSize})` }}>
              {verse.words
                ? verse.words
                    .filter((w) => w.char_type_name === "word")
                    .map((w, i) => {
                      const isActiveWord =
                        activeWordPos !== null && w.position === activeWordPos;
                      return (
                        <span
                          key={w.id}
                          className={`word-highlight ${isActiveWord ? "active" : ""}`}
                          style={
                            colorizeWords && colors.length > 0
                              ? { color: isActiveWord ? undefined : colors[i % colors.length] }
                              : undefined
                          }
                        >
                          {w.text_uthmani}{" "}
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
        <div
          className={`border-l-2 border-[var(--theme-translation-accent)] py-1 pl-4 sm:ml-[44px] ${
            revealed && !showTranslation ? "animate-reveal" : ""
          }`}
        >
          {verse.translations.map((t) => (
            <div key={t.id}>
              <p
                className="translation-text leading-[1.8] text-[var(--theme-text-secondary)]"
                style={{ fontSize: `calc(15px * ${normalTranslationFontSize})` }}
                dangerouslySetInnerHTML={{ __html: t.text }}
              />
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)]">
                {t.resource_name}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
