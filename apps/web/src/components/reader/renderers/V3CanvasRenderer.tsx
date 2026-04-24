/**
 * V3 Canvas Renderer.
 * HTML5 Canvas 2D context ile mushaf sayfasi rendering.
 * Tarayicinin built-in Arabic text shaping motoru kullanilir.
 * Kelimeler arasi bosluk dagitimi ile justify efekti saglanir.
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import type { MushafRendererProps } from "~/lib/mushaf-renderers";
import { useAudioStore } from "~/stores/audio.store";
import { OrnamentalSurahHeader } from "~/components/quran/OrnamentalSurahHeader";

interface WordRect {
  x: number;
  y: number;
  width: number;
  height: number;
  lineIdx: number;
  wordIdx: number;
  charType: "w" | "e" | "p";
  verseIndex?: number;
}

export function V3CanvasRenderer({
  pageNumber,
  verseList,
  onVerseEndClick,
  lineData,
  arabicFontSize,
  fontFamily,
  styleConfig,
  surahTransitions,
  firstGroup,
}: MushafRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordRects, setWordRects] = useState<WordRect[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Audio WBW highlight
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const audioWordPosition = useAudioStore((s) => s.wordPosition);
  const isPlaying = useAudioStore((s) => s.playbackState === "playing");

  // Sure gecis satirlari
  const transitionLines = useMemo(
    () => new Set(surahTransitions.map((t) => t.lineIndex)),
    [surahTransitions],
  );

  // Aktif kelime (audio highlight)
  const activeWord = useMemo(() => {
    if (!isPlaying || !currentVerseKey || !lineData) return null;
    let verseIdx = 0;
    let wordPosInVerse = 1;

    for (let li = 0; li < lineData.lines.length; li++) {
      for (let wi = 0; wi < lineData.lines[li].words.length; wi++) {
        const w = lineData.lines[li].words[wi];
        if (w.c === "w") {
          const verse = verseList[verseIdx];
          if (
            verse &&
            `${verse.surahId}:${verse.ayahNumber}` === currentVerseKey &&
            wordPosInVerse === audioWordPosition
          ) {
            return { lineIdx: li, wordIdx: wi };
          }
          wordPosInVerse++;
        } else if (w.c === "e") {
          verseIdx++;
          wordPosInVerse = 1;
        }
      }
    }
    return null;
  }, [isPlaying, currentVerseKey, audioWordPosition, lineData, verseList]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !lineData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    if (width === 0) return;

    // Satirlari filtrele (sure gecisleri icin bos satirlar)
    const renderableLines = lineData.lines.filter(
      (_, idx) => !transitionLines.has(idx),
    );
    const totalRenderLines = renderableLines.length || 15;
    const lineHeight = (arabicFontSize * 16 * styleConfig.lineHeight);
    const height = totalRenderLines * lineHeight;

    // Canvas boyutlarini ayarla
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    setCanvasSize({ width, height });

    // Temizle
    ctx.clearRect(0, 0, width, height);

    // Font ayarla
    const fontSize = arabicFontSize * 16; // rem -> px
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";

    // Renkleri CSS'den al
    const computedStyle = getComputedStyle(document.documentElement);
    const textColor =
      computedStyle.getPropertyValue("--color-text").trim() || "#1a1a1a";
    const accentColor =
      computedStyle.getPropertyValue("--color-accent").trim() || "#9a7b2d";

    const padding = 8;
    const availableWidth = width - padding * 2;
    const rects: WordRect[] = [];
    let endMarkerCount = 0;
    let renderLineIdx = 0;

    for (let lineIdx = 0; lineIdx < lineData.lines.length; lineIdx++) {
      // Sure gecis satirlarini atla (DOM'da render edilecek)
      if (transitionLines.has(lineIdx)) continue;

      const line = lineData.lines[lineIdx];
      const y = renderLineIdx * lineHeight + lineHeight / 2;

      // Kelimelerin dogal genisliklerini olc
      const wordMetrics = line.words.map((w) => ({
        text: w.t,
        width: ctx.measureText(w.t).width,
        charType: w.c,
      }));

      const totalNaturalWidth = wordMetrics.reduce((s, m) => s + m.width, 0);
      const gap =
        wordMetrics.length > 1
          ? Math.max(0, (availableWidth - totalNaturalWidth) / (wordMetrics.length - 1))
          : 0;

      // RTL: sagdan sola ciz
      let x = width - padding;
      let lineEndIdx = 0;

      for (let wordIdx = 0; wordIdx < line.words.length; wordIdx++) {
        const word = line.words[wordIdx];
        const metric = wordMetrics[wordIdx];

        // Highlight aktif kelime
        const isActiveWord =
          activeWord?.lineIdx === lineIdx && activeWord?.wordIdx === wordIdx;

        if (isActiveWord) {
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(
            x - metric.width - 2,
            y - fontSize * 0.45,
            metric.width + 4,
            fontSize * 0.9,
          );
          ctx.globalAlpha = 1;
        }

        // Metin rengini ayarla
        if (isActiveWord) {
          ctx.fillStyle = accentColor;
        } else {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = word.c === "p" ? 0.4 : 1;
        }

        // RTL metin: x konumu kelimenin sağ kenarını gösterir
        ctx.textAlign = "right";
        ctx.direction = "rtl";
        ctx.fillText(word.t, x, y);
        ctx.globalAlpha = 1;

        // Rect kaydet
        const verseIndex = word.c === "e" ? endMarkerCount + lineEndIdx : undefined;
        rects.push({
          x: x - metric.width,
          y: y - fontSize * 0.45,
          width: metric.width,
          height: fontSize * 0.9,
          lineIdx,
          wordIdx,
          charType: word.c,
          verseIndex,
        });

        if (word.c === "e") lineEndIdx++;

        x -= metric.width + gap;
      }

      endMarkerCount += line.words.filter((w) => w.c === "e").length;
      renderLineIdx++;
    }

    setWordRects(rects);
  }, [
    lineData,
    arabicFontSize,
    fontFamily,
    styleConfig,
    transitionLines,
    activeWord,
  ]);

  const handleRectClick = useCallback(
    (rect: WordRect, e: React.MouseEvent) => {
      if (rect.charType === "e" && rect.verseIndex !== undefined) {
        e.stopPropagation();
        const domRect = new DOMRect(
          rect.x + (containerRef.current?.getBoundingClientRect().left ?? 0),
          rect.y + (containerRef.current?.getBoundingClientRect().top ?? 0),
          rect.width,
          rect.height,
        );
        onVerseEndClick?.(rect.verseIndex, domRect);
      }
    },
    [onVerseEndClick],
  );

  if (!lineData) return null;

  // Sure gecis satirlarini DOM'da render et (canvas disinda)
  const transitionMap = new Map(
    surahTransitions.map((t) => [t.lineIndex, t.group]),
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Sure basligi (ilk grup) */}
      {firstGroup?.isStart && (
        <OrnamentalSurahHeader
          surahId={firstGroup.surah.id}
          nameArabic={firstGroup.surah.nameArabic}
          showBismillah={firstGroup.surah.bismillahPre ?? false}
          styleConfig={styleConfig}
        />
      )}

      {/* Sure gecis basliklari + canvas parcalari */}
      {(() => {
        const elements: React.ReactNode[] = [];
        let lastCanvasStart = 0;

        // Gecisleri sirala
        const sortedTransitions = [...surahTransitions].sort(
          (a, b) => a.lineIndex - b.lineIndex,
        );

        for (const transition of sortedTransitions) {
          elements.push(
            <OrnamentalSurahHeader
              key={`trans-${transition.lineIndex}`}
              surahId={transition.group.surah.id}
              nameArabic={transition.group.surah.nameArabic}
              showBismillah={transition.group.surah.bismillahPre ?? false}
              styleConfig={styleConfig}
            />,
          );
        }

        return elements;
      })()}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ direction: "rtl" }}
      />

      {/* Interaction overlay */}
      {wordRects
        .filter((r) => r.charType === "e")
        .map((rect) => (
          <button
            key={`end-${rect.verseIndex}`}
            className="absolute opacity-0 hover:opacity-10 hover:bg-[var(--color-accent)] transition-opacity cursor-pointer"
            style={{
              left: rect.x,
              top: rect.y + (firstGroup?.isStart ? 48 : 0),
              width: rect.width,
              height: rect.height,
            }}
            onClick={(e) => handleRectClick(rect, e)}
          />
        ))}
    </div>
  );
}
