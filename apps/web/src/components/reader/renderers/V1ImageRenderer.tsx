/**
 * V1 Static Images Renderer.
 * Pre-rendered mushaf sayfa goruntuleri + transparent interaction overlay.
 * Goruntuler /mushaf-images/p{N}.webp konumunda saklanir.
 */

import { useState, useMemo, useCallback } from "react";
import type { MushafRendererProps } from "~/lib/mushaf-renderers";
import { useAudioStore } from "~/stores/audio.store";

export function V1ImageRenderer({
  pageNumber,
  verseList,
  onVerseEndClick,
  lineData,
}: MushafRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Audio WBW highlight
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const isPlaying = useAudioStore((s) => s.playbackState === "playing");

  // Satir bazli interaction zonelari: her satirdaki end marker'lari tespit et
  const lineInteractions = useMemo(() => {
    if (!lineData) return [];
    let verseIdx = 0;
    return lineData.lines.map((line) => {
      const endMarkers: { verseIndex: number; wordPosition: number }[] = [];
      let wordCount = 0;
      for (let i = 0; i < line.words.length; i++) {
        if (line.words[i].c === "e") {
          endMarkers.push({ verseIndex: verseIdx, wordPosition: i });
          verseIdx++;
        }
        if (line.words[i].c === "w") wordCount++;
      }
      return { endMarkers, totalWords: line.words.length, wordCount };
    });
  }, [lineData]);

  const handleLineClick = useCallback(
    (verseIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onVerseEndClick?.(verseIndex, rect);
    },
    [onVerseEndClick],
  );

  // Aktif ayet satiri (audio highlight)
  const activeLineIdx = useMemo(() => {
    if (!isPlaying || !currentVerseKey || !lineData) return -1;
    let verseIdx = 0;
    const activeVerseIdx = verseList.findIndex(
      (v) => `${v.surahId}:${v.ayahNumber}` === currentVerseKey,
    );
    if (activeVerseIdx < 0) return -1;

    for (let li = 0; li < lineData.lines.length; li++) {
      for (const w of lineData.lines[li].words) {
        if (w.c === "e") {
          if (verseIdx === activeVerseIdx) return li;
          verseIdx++;
        }
      }
    }
    return -1;
  }, [isPlaying, currentVerseKey, verseList, lineData]);

  if (imageError) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-text-secondary)]">
        <div className="text-center">
          <p className="text-sm mb-2">Mushaf goruntuleri henuz olusturulmadi.</p>
          <p className="text-xs opacity-60">
            npx tsx scripts/generate-mushaf-images.ts
          </p>
        </div>
      </div>
    );
  }

  const totalLines = lineData?.lines.length ?? 15;

  return (
    <div className="relative w-full">
      {/* Ana mushaf goruntasu */}
      <img
        src={`/mushaf-images/p${pageNumber}.png`}
        alt={`Mushaf page ${pageNumber}`}
        className={`w-full h-auto transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        loading="eager"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Interaction overlay */}
      {imageLoaded && (
        <div className="absolute inset-0">
          {lineInteractions.map((lineInfo, lineIdx) => (
            <div
              key={lineIdx}
              className="absolute w-full"
              style={{
                top: `${(lineIdx / totalLines) * 100}%`,
                height: `${(1 / totalLines) * 100}%`,
              }}
            >
              {/* Audio highlight band */}
              {activeLineIdx === lineIdx && (
                <div
                  className="absolute inset-0 bg-[var(--color-accent)] pointer-events-none"
                  style={{ opacity: 0.08 }}
                />
              )}

              {/* Verse end marker click zones */}
              {lineInfo.endMarkers.map((marker) => (
                <button
                  key={marker.verseIndex}
                  className="absolute top-0 h-full opacity-0 hover:opacity-10 hover:bg-[var(--color-accent)] transition-opacity cursor-pointer"
                  style={{
                    right: `${(marker.wordPosition / lineInfo.totalWords) * 100}%`,
                    width: `${(1 / lineInfo.totalWords) * 100}%`,
                  }}
                  onClick={(e) => handleLineClick(marker.verseIndex, e)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
