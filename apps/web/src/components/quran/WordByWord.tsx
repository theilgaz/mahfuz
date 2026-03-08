import type { Word } from "@mahfuz/shared/types";
import { usePreferencesStore } from "~/stores/usePreferencesStore";

interface WordByWordProps {
  words: Word[];
  colorizeWords?: boolean;
  colors?: string[];
  activeWordPosition?: number | null;
}

export function WordByWord({
  words,
  colorizeWords = false,
  colors = [],
  activeWordPosition,
}: WordByWordProps) {
  const showTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const showTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const translationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const transliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const transliterationFirst = usePreferencesStore((s) => s.wbwTransliterationFirst);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);

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

        const translationEl = showTranslation && (
          <span
            key="tr"
            className="font-sans text-[var(--theme-text-tertiary)] transition-colors"
            style={{
              fontSize: `calc(11px * ${translationSize})`,
              ...(isActive
                ? { color: "var(--theme-highlight-text)" }
                : colorStyle(i, isActive)),
            }}
          >
            {word.translation?.text}
          </span>
        );

        const transliterationEl = showTransliteration && (
          <span
            key="tl"
            className="font-sans text-[var(--theme-text-quaternary)] transition-colors"
            style={{
              fontSize: `calc(10px * ${transliterationSize})`,
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
                fontSize: `calc(1.5rem * ${wbwArabicFontSize})`,
                ...(colorizeWords && colors.length > 0 && !isActive
                  ? { color: colors[i % colors.length] }
                  : isActive
                    ? {}
                    : { color: "var(--theme-text)" }),
              }}
            >
              {word.text_uthmani}
            </span>
            {transliterationFirst ? (
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
            style={{ fontSize: `calc(1.5rem * ${wbwArabicFontSize})` }}
          >
            {w.text}
          </span>
        ))}
    </div>
  );
}
