/**
 * Mushaf rendering engine tipleri ve renderer arayuzu.
 * V0: Unicode metin, V1: statik goruntu, V2: QCF glif fontlari, V3: Canvas
 */

import type { MushafPageLines } from "~/hooks/useQuranQuery";
import type { MushafStyleConfig } from "~/lib/mushaf-styles";

export type MushafRenderingEngine = "v0-text" | "v1-images" | "v2-qcf-fonts" | "v3-canvas";

export interface SurahGroupData {
  surah: {
    id: number;
    nameArabic: string;
    nameSimple: string;
    nameTranslation: string;
    bismillahPre: boolean;
  };
  isStart: boolean;
  ayahs: Array<{
    surahId: number;
    ayahNumber: number;
    textUthmani: string;
    translation: string | null;
    juzNumber: number;
    sajdah?: boolean;
    translations: Record<string, string>;
  }>;
}

export interface MushafRendererProps {
  pageNumber: number;
  verseList: Array<{ surahId: number; ayahNumber: number; textUthmani: string; translation: string | null }>;
  onVerseEndClick?: (verseIndex: number, rect: DOMRect) => void;
  lineData: MushafPageLines | undefined;
  arabicFontSize: number;
  fontFamily: string;
  styleConfig: MushafStyleConfig;
  surahTransitions: Array<{ lineIndex: number; group: SurahGroupData }>;
  firstGroup: SurahGroupData | undefined;
}
