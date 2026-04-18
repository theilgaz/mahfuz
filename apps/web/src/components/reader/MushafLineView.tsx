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
  /** Called with sequential verse index (0-based) on this segment */
  onVerseEndClick?: (verseIndex: number, rect: DOMRect) => void;
  /** Offset for verse index when this is a segment of a larger page */
  verseIndexOffset?: number;
}

export function MushafLineView({ lineData, arabicFontSize, onVerseEndClick, verseIndexOffset = 0 }: MushafLineViewProps) {
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

    // zoom'u sıfırla, ölç, hemen geri yükle — React senkronizasyon sorununu önler
    const prevZoom = inner.style.zoom;
    inner.style.zoom = "1";
    void inner.offsetWidth; // reflow zorla (zoom=1 anında)

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // RTL sola-taşmayı scrollWidth yakalayamaz — getBoundingClientRect kullan
    const items = inner.querySelectorAll<HTMLElement>(".mushaf-line > *");
    let minLeft = Infinity;
    let maxRight = -Infinity;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) {
        minLeft = Math.min(minLeft, r.left);
        maxRight = Math.max(maxRight, r.right);
      }
    });

    // Zoom'u ölçüm tamamlanır tamamlanmaz geri yükle — setScale aynı değerse
    // React re-render yapmaz ve DOM'daki zoom=1 kalıcı olurdu
    inner.style.zoom = prevZoom;

    if (containerWidth === 0) return;

    const contentWidth =
      minLeft < Infinity ? maxRight - minLeft : inner.scrollWidth;

    if (contentWidth > containerWidth + 0.5) {
      setScale(Math.max(0.35, containerWidth / contentWidth));
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
          let endMarkerCounter = 0;
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
                  const currentVerseIdx = verseIndexOffset + endMarkerCounter;
                  endMarkerCounter++;
                  return (
                    <span key={wordIdx} className="self-center shrink-0 inline-flex">
                      <VerseEndMarker
                        ayahNumber={ayahNum}
                        size={markerSize}
                        variant="inline"
                        onClick={onVerseEndClick ? (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          onVerseEndClick(currentVerseIdx, rect);
                        } : undefined}
                      />
                    </span>
                  );
                }
                return (
                  <span
                    key={wordIdx}
                    className={
                      word.c === "p"
                        ? "mushaf-pause-marker text-[var(--color-text-secondary)] text-[0.7em] self-center select-none whitespace-nowrap"
                        : "mushaf-word transition-colors duration-150 cursor-default rounded-sm px-[0.04em] hover:text-[var(--color-word-hover-text)] whitespace-nowrap"
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
