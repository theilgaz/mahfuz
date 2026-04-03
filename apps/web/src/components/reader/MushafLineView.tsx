/**
 * Mushaf satır görünümü — fiziksel Mushaf'taki satır kırılımlarını birebir takip eder.
 * Her sayfa 15 satır (Medine Mushafı), kelimeler justify-between ile dağıtılır.
 *
 * Auto-scaling: Kullanıcının tercih ettiği font boyutu taşma yaparsa,
 * container genişliğine sığacak şekilde CSS transform ile küçültülür.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import type { MushafPageLines } from "~/hooks/useQuranQuery";
import { useSettingsStore, COLOR_PALETTES } from "~/stores/settings.store";

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

    // Temporarily reset scale to measure natural width
    inner.style.transform = "none";
    inner.style.transformOrigin = "top right";

    const containerWidth = container.clientWidth;
    const contentWidth = inner.scrollWidth;

    if (contentWidth > containerWidth && containerWidth > 0) {
      const newScale = Math.max(0.5, containerWidth / contentWidth);
      setScale(newScale);
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

    const observer = new ResizeObserver(() => {
      computeScale();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [computeScale]);

  return (
    <div
      ref={containerRef}
      className="mushaf-line-container overflow-hidden"
      dir="rtl"
      style={{
        // Reserve the scaled height so parent layout stays correct
        height: scale < 1 ? `calc(${scale} * 100%)` : undefined,
      }}
    >
      <div
        ref={innerRef}
        style={{
          fontFamily: "var(--font-arabic)",
          fontSize: `${arabicFontSize}rem`,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top right",
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
                return (
                  <span
                    key={wordIdx}
                    className={
                      word.c === "e"
                        ? "mushaf-end-marker text-[var(--marker-g2)] text-[0.55em] self-center select-none whitespace-nowrap"
                        : word.c === "p"
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
