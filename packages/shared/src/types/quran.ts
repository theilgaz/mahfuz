/** Quran chapter (surah). Matches quran.com API v4 response. */
export interface Chapter {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name: TranslatedName;
}

export interface TranslatedName {
  name: string;
  language_name: string;
}

/** Verse (ayah) */
export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string; // e.g. "2:255"
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani?: string;
  text_imlaei?: string;
  words?: Word[];
  translations?: Translation[];
  audio?: VerseAudio;
}

/** Word-by-word data */
export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: "word" | "end" | "pause";
  text_uthmani: string;
  text_imlaei: string;
  text: string;
  page_number: number;
  line_number: number;
  translation: WordTranslation;
  transliteration: WordTransliteration;
}

export interface WordTranslation {
  text: string;
  language_name: string;
}

export interface WordTransliteration {
  text: string;
  language_name: string;
}

/** Translation */
export interface Translation {
  id: number;
  resource_id: number;
  resource_name: string;
  text: string;
  language_name: string;
}

/** Tafsir (exegesis) */
export interface Tafsir {
  id: number;
  resource_id: number;
  resource_name: string;
  text: string;
  language_name: string;
}

/** Juz (part) */
export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>; // { "1": "1-7", "2": "1-141" }
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

/** Page (mushaf page) */
export interface MushafPage {
  page_number: number;
  verses: Verse[];
}

/** Verse audio timing */
export interface VerseAudio {
  url: string;
  segments: AudioSegment[];
}

/** Audio segment for word-level sync [word_position, start_ms, end_ms] */
export type AudioSegment = [number, number, number];

/** Reciter (qari) */
export interface Reciter {
  id: number;
  reciter_name: string;
  style: ReciterStyle | null;
  translated_name: TranslatedName;
}

export interface ReciterStyle {
  name: string;
  language_name: string;
  description: string;
}

/** Translation resource info */
export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

/** Tafsir resource info */
export interface TafsirResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

/** Search result */
export interface SearchResult {
  query: string;
  total_results: number;
  current_page: number;
  total_pages: number;
  results: SearchResultItem[];
}

export interface SearchResultItem {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted: string | null;
  translations: SearchTranslation[];
}

export interface SearchTranslation {
  resource_id: number;
  text: string;
  name: string;
}

/** Verse key helper type "surahId:verseNumber" */
export type VerseKey = `${number}:${number}`;

/** Text script type for static Tanzil data */
export type TextType = "uthmani" | "simple";

/** Static chapter metadata from meta.json */
export interface StaticChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_translation: string;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  verses_count: number;
  pages: [number, number];
}

/** Per-surah Tanzil JSON shape */
export interface TanzilSurahData {
  bismillah?: string;
  verses: TanzilVerse[];
}

/** Compact verse entry from Tanzil JSON */
export interface TanzilVerse {
  v: number;   // verse number
  t: string;   // text
  p: number;   // page number
  j: number;   // juz number
  h: number;   // hizb quarter number
  rk: number;  // ruku number
  m: number;   // manzil number
  sj?: number; // sajdah (1=recommended, 2=obligatory)
}

/** meta.json shape */
export interface QuranMeta {
  chapters: StaticChapter[];
  pageToSurahs: Record<number, number[]>;
  juzBoundaries: Record<number, { start: string; end: string }>;
}
