/**
 * Mushaf satır görünümü — fiziksel Mushaf'taki satır kırılımlarını birebir takip eder.
 * Her sayfa 15 satır (Medine Mushafı), kelimeler justify-between ile dağıtılır.
 */

import type { MushafPageLines } from "~/hooks/useQuranQuery";

interface MushafLineViewProps {
  lineData: MushafPageLines;
  arabicFontSize: number;
}

export function MushafLineView({ lineData, arabicFontSize }: MushafLineViewProps) {
  return (
    <div
      className="mushaf-line-container overflow-hidden"
      dir="rtl"
      style={{
        fontFamily: "var(--font-arabic)",
        fontSize: `${arabicFontSize}rem`,
      }}
    >
      {lineData.lines.map((line, lineIdx) => (
        <div
          key={lineIdx}
          className="mushaf-line flex justify-between flex-nowrap"
          style={{ lineHeight: 2.6 }}
        >
          {line.words.map((word, wordIdx) => (
            <span
              key={wordIdx}
              className={
                word.c === "e"
                  ? "mushaf-end-marker text-[var(--color-text-secondary)] text-[0.55em] self-center select-none whitespace-nowrap"
                  : word.c === "p"
                    ? "mushaf-pause-marker text-[var(--color-text-secondary)] text-[0.7em] self-center select-none whitespace-nowrap"
                    : "mushaf-word transition-colors duration-150 cursor-default rounded-sm px-[0.04em] hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)] whitespace-nowrap"
              }
            >
              {word.t}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
