import { memo } from "react";
import type { Word } from "@mahfuz/shared/types";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useShallow } from "zustand/react/shallow";

interface WordByWordProps {
  words: Word[];
  colorizeWords?: boolean;
  colors?: string[];
  activeWordPosition?: number | null;
}

export const WordByWord = memo(function WordByWord({
  words,
  colorizeWords = false,
  colors = [],
  activeWordPosition,
}: WordByWordProps) {
  // Consolidated preferences selector — single subscription instead of 6
  const prefs = usePreferencesStore(useShallow((s) => ({
    showTranslation: s.wbwShowWordTranslation,
    showTransliteration: s.wbwShowWordTransliteration,
    translationSize: s.wordTranslationSize,
    transliterationSize: s.wordTransliterationSize,
    transliterationFirst: s.wbwTransliterationFirst,
    wbwArabicFontSize: s.wbwArabicFontSize,
  })));

  const wordItems = words.filter((w) => w.char_type_name === "word");

  const colorStyle = (i: number, isActive: boolean, opacity?: number) =>
    colorizeWords && colors.length > 0 && !isActive
      ? { color: colors[i % colors.length], ...(opacity != null ? { opacity } : {}) }
      : {};

  return (
    <div className="flex flex-wrap justify-end gap-x-5 gap-y-4">
      {wordItems.map((word, i) => {
        const isActive =
          activeWordPosition != null && word.position === activeWordPosition;

        const translationEl = prefs.showTranslation && (
          <span
            key="tr"
            className="font-sans text-[var(--theme-text-tertiary)] transition-colors"
            style={{
              fontSize: `calc(11px * ${prefs.translationSize})`,
              ...(isActive
                ? { color: "var(--theme-highlight-text)" }
                : colorStyle(i, isActive)),
            }}
          >
            {word.translation?.text}
          </span>
        );

        const transliterationEl = prefs.showTransliteration && (
          <span
            key="tl"
            className="font-sans text-[var(--theme-text-quaternary)] transition-colors"
            style={{
              fontSize: `calc(10px * ${prefs.transliterationSize})`,
              ...(isActive
                ? { color: "var(--theme-highlight-text)" }
                : colorStyle(i, isActive, 0.75)),
            }}
          >
            {word.transliteration?.text}
          </span>
        );

        return (
          <div
            key={word.id}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              isActive ? "" : "hover:bg-[var(--theme-pill-bg)]"
            }`}
          >
            <span
              className={`word-highlight arabic-text cursor-pointer ${isActive ? "active" : ""}`}
              style={{
                fontSize: `calc(1.5rem * ${prefs.wbwArabicFontSize})`,
                ...(colorizeWords && colors.length > 0 && !isActive
                  ? { color: colors[i % colors.length] }
                  : isActive
                    ? {}
                    : { color: "var(--theme-text)" }),
              }}
            >
              {word.text_uthmani}
            </span>
            {prefs.transliterationFirst ? (
              <>{transliterationEl}{translationEl}</>
            ) : (
              <>{translationEl}{transliterationEl}</>
            )}
          </div>
        );
      })}
      {words
        .filter((w) => w.char_type_name === "end")
        .map((w) => (
          <span
            key={w.id}
            className="arabic-text self-start text-[var(--theme-text-quaternary)]"
            style={{ fontSize: `calc(1.5rem * ${prefs.wbwArabicFontSize})` }}
          >
            {w.text}
          </span>
        ))}
    </div>
  );
});
