/**
 * V2 QCF (Quran Complex Font) Renderer.
 * 604 per-page font dosyasi, 1 glif = 1 kelime. Piksel-mukemmel rendering.
 * Endustri standardi: Quran.com web tarafindan kullanilir.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { MushafRendererProps } from "~/lib/mushaf-renderers";
import { qcfWordsQueryOptions } from "~/hooks/useQuranQuery";
import { useQcfFont } from "~/hooks/useQcfFont";
import { useAudioStore } from "~/stores/audio.store";
import { MushafSkeleton } from "../MushafSkeleton";
import { OrnamentalSurahHeader } from "~/components/quran/OrnamentalSurahHeader";

export function V2QcfRenderer({
  pageNumber,
  verseList,
  onVerseEndClick,
  styleConfig,
  surahTransitions,
  firstGroup,
}: MushafRendererProps) {
  const { data: qcfData, isLoading: dataLoading } = useQuery(qcfWordsQueryOptions(pageNumber));
  const { data: fontName, isLoading: fontLoading } = useQcfFont(pageNumber);

  // Komsu sayfa fontlarini prefetch et
  useQcfFont(pageNumber > 1 ? pageNumber - 1 : 1, pageNumber > 1);
  useQcfFont(pageNumber < 604 ? pageNumber + 1 : 604, pageNumber < 604);

  // Audio WBW highlight
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const audioWordPosition = useAudioStore((s) => s.wordPosition);
  const isPlaying = useAudioStore((s) => s.playbackState === "playing");

  // Verse end marker click: QCF verisinden verse index hesapla
  const handleEndMarkerClick = useCallback(
    (verseIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onVerseEndClick?.(verseIndex, rect);
    },
    [onVerseEndClick],
  );

  if (dataLoading || fontLoading || !qcfData || !fontName) {
    return <MushafSkeleton />;
  }

  // Sure gecis satirlarini set'e cevir
  const transitionLines = new Set(surahTransitions.map((t) => t.lineIndex));
  const transitionMap = new Map(surahTransitions.map((t) => [t.lineIndex, t.group]));

  // End marker sayaci (verse index)
  let endMarkerCount = 0;

  return (
    <div>
      {/* Sayfanin ilk grubu isStart ise baslik */}
      {firstGroup?.isStart && (
        <OrnamentalSurahHeader
          surahId={firstGroup.surah.id}
          nameArabic={firstGroup.surah.nameArabic}
          showBismillah={firstGroup.surah.bismillahPre ?? false}
          styleConfig={styleConfig}
        />
      )}

      {qcfData.lines.map((line, lineIdx) => {
        const transitionGroup = transitionMap.get(lineIdx);
        const currentEndMarkerCount = endMarkerCount;

        // Bu satirdaki end marker sayisini say (sonraki satirlar icin offset)
        const lineEndMarkers = line.words.filter((w) => w.c === "e").length;

        const lineElement = (
          <div
            key={`line-${lineIdx}`}
            className="flex justify-center items-center"
            dir="rtl"
            style={{
              fontFamily: fontName,
              fontSize: `${styleConfig.fontSizeBase * 1.6}rem`,
              lineHeight: styleConfig.lineHeight,
            }}
          >
            {(() => {
              let lineEndIdx = 0;
              return line.words.map((word, wordIdx) => {
                const isActive =
                  isPlaying &&
                  word.c === "w" &&
                  word.vk === currentVerseKey &&
                  word.p === audioWordPosition;

                if (word.c === "e") {
                  const verseIndex = currentEndMarkerCount + lineEndIdx;
                  lineEndIdx++;
                  return (
                    <span
                      key={wordIdx}
                      className="cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ fontFamily: fontName }}
                      onClick={(e) => handleEndMarkerClick(verseIndex, e)}
                    >
                      {word.g}
                    </span>
                  );
                }

                return (
                  <span
                    key={wordIdx}
                    className={
                      isActive
                        ? "word-audio-active"
                        : word.c === "w"
                          ? "hover:text-[var(--color-word-hover-text)] transition-colors duration-150 cursor-default"
                          : "cursor-default"
                    }
                    style={{ fontFamily: fontName }}
                  >
                    {word.g}
                  </span>
                );
              });
            })()}
          </div>
        );

        endMarkerCount += lineEndMarkers;

        // Sure gecisi varsa baslik + satir
        if (transitionGroup) {
          return (
            <div key={`trans-${lineIdx}`}>
              <OrnamentalSurahHeader
                surahId={transitionGroup.surah.id}
                nameArabic={transitionGroup.surah.nameArabic}
                showBismillah={transitionGroup.surah.bismillahPre ?? false}
                styleConfig={styleConfig}
              />
              {lineElement}
            </div>
          );
        }

        return lineElement;
      })}
    </div>
  );
}
