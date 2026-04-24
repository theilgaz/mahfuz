/**
 * Mushaf stil konfigürasyonları.
 * Her stil bir basılı mushaf edisyonunu temsil eder:
 * çerçeve tasarımı, font, ölçüler ve ornamental varyantlar.
 */

export type MushafStyleId = "medine" | "beirut" | "turkish";

export interface MushafStyleConfig {
  id: MushafStyleId;
  name: string;
  nameAr: string;
  fontFamily: string;
  fontSizeBase: number; // rem
  lineHeight: number;
  linesPerPage: number;
  /** width / height */
  aspectRatio: number;
  /** Çerçeve içindeki metin alanı padding'i (% cinsinden) */
  padding: { top: number; right: number; bottom: number; left: number };
  /** Sure başlığı için ayrılacak satır sayısı */
  headerLines: number;
  verseMarkerStyle: "rosette" | "circle";
  surahHeaderVariant: "cartouche" | "oval" | "rectangle";
  bismillahVariant: "ornate" | "text";
}

export const MUSHAF_STYLES: Record<MushafStyleId, MushafStyleConfig> = {
  medine: {
    id: "medine",
    name: "Medine Mushafi",
    nameAr: "مصحف المدينة",
    fontFamily: "'KFGQPCUthmanicScriptHAFS', 'Scheherazade New', serif",
    fontSizeBase: 1.9,
    lineHeight: 2.6,
    linesPerPage: 15,
    aspectRatio: 0.68,
    padding: { top: 8, right: 6, bottom: 6, left: 6 },
    headerLines: 2,
    verseMarkerStyle: "rosette",
    surahHeaderVariant: "cartouche",
    bismillahVariant: "ornate",
  },
  beirut: {
    id: "beirut",
    name: "Beyrut / Sam",
    nameAr: "مصحف بيروت",
    fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif",
    fontSizeBase: 1.8,
    lineHeight: 2.7,
    linesPerPage: 15,
    aspectRatio: 0.68,
    padding: { top: 9, right: 7, bottom: 7, left: 7 },
    headerLines: 2,
    verseMarkerStyle: "rosette",
    surahHeaderVariant: "oval",
    bismillahVariant: "ornate",
  },
  turkish: {
    id: "turkish",
    name: "Turk Mushafi",
    nameAr: "المصحف التركي",
    fontFamily: "'Scheherazade New', serif",
    fontSizeBase: 1.8,
    lineHeight: 2.6,
    linesPerPage: 15,
    aspectRatio: 0.68,
    padding: { top: 8, right: 5, bottom: 5, left: 5 },
    headerLines: 1,
    verseMarkerStyle: "circle",
    surahHeaderVariant: "rectangle",
    bismillahVariant: "text",
  },
};

export function getMushafStyle(id: MushafStyleId): MushafStyleConfig {
  return MUSHAF_STYLES[id];
}
