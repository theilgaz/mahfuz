/**
 * Mushaf satır görünümü — fiziksel Mushaf'taki satır kırılımlarını birebir takip eder.
 * Her sayfa 15 satır (Medine Mushafı), kelimeler justify-between ile dağıtılır.
 *
 * Auto-scaling: CSS zoom kullanılır (transform aksine layout'u da etkiler,
 * overflow:hidden klipleme sorununu önler).
 */

import { useRef, useEffect, useState, useCallback } from "react";
import type { MushafPageLines } from "~/hooks/useQuranQuery";
import { useSettingsStore, COLOR_PALETTES } from "~/stores/settings.store";
import { VerseEndMarker } from "~/components/quran/VerseEndMarker";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
function fromArabicIndic(s: string): number {
  return parseInt(s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d))), 10);
}

interface MushafLineViewProps {
  lineData: MushafPageLines;
  arabicFontSize: number;
}

export function MushafLineView({ lineData, arabicFontSize }: MushafLineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const colorizeWords = useSettingsStore((s) => s.colorizeWords);
  const colorPaletteId = useSettingsStore((s) => s.colorPaletteId);
  const wordColors = colorizeWords ? COLOR_PALETTES[colorPaletteId].colors : null;

  const computeScale = useCallback(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    // zoom'u sıfırla → doğal boyutu ölç
    inner.style.zoom = "1";
    void inner.offsetWidth; // reflow zorla

    const containerWidth = container.clientWidth;
    const contentWidth = inner.scrollWidth;

    if (contentWidth > containerWidth && containerWidth > 0) {
      setScale(Math.max(0.5, containerWidth / contentWidth));
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    computeScale();
  }, [arabicFontSize, lineData, computeScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => computeScale());
    observer.observe(container);
    return () => observer.disconnect();
  }, [computeScale]);

  return (
    <div
      ref={containerRef}
      className="mushaf-line-container overflow-hidden"
      dir="rtl"
    >
      <div
        ref={innerRef}
        style={{
          fontFamily: "var(--font-arabic)",
          fontSize: `${arabicFontSize}rem`,
          // zoom layout'u da etkiler — transform:scale'in aksine overflow sorununa yol açmaz
          zoom: scale < 1 ? scale : undefined,
        }}
      >
        {(() => {
          let wordCounter = 0;
          return lineData.lines.map((line, lineIdx) => (
            <div
              key={lineIdx}
              className="mushaf-line flex justify-between flex-nowrap"
              style={{ lineHeight: 2.6 }}
            >
              {line.words.map((word, wordIdx) => {
                const isWord = word.c !== "e" && word.c !== "p";
                const colorIdx = isWord ? wordCounter++ : 0;
                if (word.c === "e") {
                  const ayahNum = fromArabicIndic(word.t);
                  const markerSize = Math.max(20, Math.round(arabicFontSize * 14));
                  return (
                    <span key={wordIdx} className="self-center shrink-0 inline-flex">
                      <VerseEndMarker ayahNumber={ayahNum} size={markerSize} variant="inline" />
                    </span>
                  );
                }
                return (
                  <span
                    key={wordIdx}
                    className={
                      word.c === "p"
                        ? "mushaf-pause-marker text-[var(--color-text-secondary)] text-[0.7em] self-center select-none whitespace-nowrap"
                        : "mushaf-word transition-colors duration-150 cursor-default rounded-sm px-[0.04em] hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)] whitespace-nowrap"
                    }
                    style={wordColors && isWord ? { color: wordColors[colorIdx % wordColors.length] } : undefined}
                  >
                    {word.t}
                  </span>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
