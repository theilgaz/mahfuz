/**
 * V0 Text Renderer — mevcut Unicode metin tabanli mushaf rendering.
 * MushafPage'den extract edildi.
 */

import type { ReactNode } from "react";
import type { MushafRendererProps } from "~/lib/mushaf-renderers";
import type { MushafPageLines } from "~/hooks/useQuranQuery";
import { MushafLineView } from "../MushafLineView";
import { OrnamentalSurahHeader } from "~/components/quran/OrnamentalSurahHeader";

export function V0TextRenderer({
  lineData,
  arabicFontSize,
  fontFamily,
  styleConfig,
  verseList,
  onVerseEndClick,
  surahTransitions,
  firstGroup,
}: MushafRendererProps) {
  if (!lineData) return null;

  const countEndMarkers = (lines: MushafPageLines["lines"]) =>
    lines.reduce((n, line) => n + line.words.filter((w) => w.c === "e").length, 0);

  const segments: ReactNode[] = [];
  let prevLineIdx = 0;
  let verseOffset = 0;

  // Sayfanin ilk grubu isStart ise uste baslik goster
  if (firstGroup?.isStart) {
    segments.push(
      <OrnamentalSurahHeader
        key={`sh-first-${firstGroup.surah.id}`}
        surahId={firstGroup.surah.id}
        nameArabic={firstGroup.surah.nameArabic}
        showBismillah={firstGroup.surah.bismillahPre ?? false}
        styleConfig={styleConfig}
      />,
    );
  }

  for (const { lineIndex, group } of surahTransitions) {
    // Gecisten onceki satirlar
    const segmentLines = lineData.lines.slice(prevLineIdx, lineIndex);
    const beforeLines: MushafPageLines = { lines: segmentLines };
    if (beforeLines.lines.length > 0) {
      segments.push(
        <MushafLineView
          key={`mlv-${prevLineIdx}`}
          lineData={beforeLines}
          arabicFontSize={arabicFontSize}
          onVerseEndClick={onVerseEndClick}
          verseIndexOffset={verseOffset}
        />,
      );
      verseOffset += countEndMarkers(segmentLines);
    }
    // Sure ayrac basligi
    segments.push(
      <OrnamentalSurahHeader
        key={`sh-${group.surah.id}`}
        surahId={group.surah.id}
        nameArabic={group.surah.nameArabic}
        showBismillah={group.surah.bismillahPre ?? false}
        styleConfig={styleConfig}
      />,
    );
    prevLineIdx = lineIndex;
  }

  // Kalan satirlar
  const remainingLines: MushafPageLines = { lines: lineData.lines.slice(prevLineIdx) };
  if (remainingLines.lines.length > 0) {
    segments.push(
      <MushafLineView
        key={`mlv-${prevLineIdx}-end`}
        lineData={remainingLines}
        arabicFontSize={arabicFontSize}
        onVerseEndClick={onVerseEndClick}
        verseIndexOffset={verseOffset}
      />,
    );
  }

  return <>{segments}</>;
}
