/**
 * Types matching the Drizzle schema rows returned by /api/v1/* endpoints.
 * These are the server DB shapes, not quran.com API shapes.
 */

export interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  revelation: string;
  ayahCount: number;
  pageStart: number;
  pageEnd: number;
  revelationOrder: number;
  bismillahPre: boolean;
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  textUthmani: string;
  textSimple: string | null;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rukuNumber: number;
  sajdah: boolean | null;
}

/** Ayah enriched with translation(s), as returned by surah/page data endpoints */
export interface AyahWithTranslation {
  id: number;
  surahId: number;
  ayahNumber: number;
  textUthmani: string;
  translation: string | null;
  translations: Record<string, string>;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  sajdah: boolean;
}

/** Surah data with ayahs and translations */
export interface SurahData {
  surah: Surah;
  ayahs: AyahWithTranslation[];
}

/** Page data grouped by surah */
export interface PageData {
  pageNumber: number;
  juzNumber: number;
  surahGroups: SurahGroup[];
  totalAyahs: number;
}

export interface SurahGroup {
  surah: Surah;
  ayahs: AyahWithTranslation[];
  isStart: boolean;
}

/** Daily verse response */
export interface DailyVerse {
  verse: Ayah;
  translation: TranslationRow | null;
  surah: Surah | null;
}

export interface TranslationRow {
  id: number;
  surahId: number;
  ayahNumber: number;
  sourceId: number;
  text: string;
}

export interface TranslationSource {
  id: number;
  slug: string;
  language: string;
  author: string;
  name: string;
  isDefault: boolean | null;
}

export interface ReciterRow {
  id: number;
  slug: string;
  name: string;
  nameArabic: string | null;
  country: string | null;
  style: string | null;
  audioBaseUrl: string;
  audioFormat: string;
  isDefault: boolean | null;
  isActive: boolean | null;
}

export interface ApiError {
  error: string;
  status: number;
}

// ── Games ──

export interface GameQuestion {
  verseKey: string;
  surahName: string;
  surahNameSimple: string;
  displayText: string;
  correctWord: string;
  correctIndex: number;
  options: string[];
  blankIndex: number;
}

export interface GameScoreSubmit {
  gameId: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
}

export interface GameScoreResult {
  ok: boolean;
  rank: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  playCount: number;
}
