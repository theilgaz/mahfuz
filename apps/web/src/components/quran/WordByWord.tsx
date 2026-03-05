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
  const showTranslation = usePreferencesStore((s) => s.showWordTranslation);
  const showTransliteration = usePreferencesStore((s) => s.showWordTransliteration);
  const translationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const transliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);

  const wordItems = words.filter((w) => w.char_type_name === "word");

  return (
    <div className="flex flex-wrap justify-end gap-x-5 gap-y-4">
      {wordItems.map((word, i) => {
        const isActive =
          activeWordPosition != null && word.position === activeWordPosition;
        return (
          <div
            key={word.id}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              isActive
                ? "bg-primary-100/60"
                : "hover:bg-[var(--theme-pill-bg)]"
            }`}
          >
            <span
              className={`word-highlight arabic-text cursor-pointer text-2xl ${isActive ? "active" : ""}`}
              style={
                colorizeWords && colors.length > 0 && !isActive
                  ? { color: colors[i % colors.length] }
                  : isActive
                    ? undefined
                    : { color: "var(--theme-text)" }
              }
            >
              {word.text_uthmani}
            </span>
            {showTranslation && (
              <span
                className="font-sans text-[var(--theme-text-tertiary)]"
                style={{
                  fontSize: `calc(11px * ${translationSize})`,
                  ...(colorizeWords && colors.length > 0 && !isActive
                    ? { color: colors[i % colors.length] }
                    : {}),
                }}
              >
                {word.translation?.text}
              </span>
            )}
            {showTransliteration && (
              <span
                className="font-sans text-[var(--theme-text-quaternary)]"
                style={{
                  fontSize: `calc(10px * ${transliterationSize})`,
                  ...(colorizeWords && colors.length > 0 && !isActive
                    ? { color: colors[i % colors.length], opacity: 0.75 }
                    : {}),
                }}
              >
                {word.transliteration?.text}
              </span>
            )}
          </div>
        );
      })}
      {words
        .filter((w) => w.char_type_name === "end")
        .map((w) => (
          <span
            key={w.id}
            className="arabic-text self-start text-2xl text-[var(--theme-text-quaternary)]"
          >
            {w.text}
          </span>
        ))}
    </div>
  );
}
