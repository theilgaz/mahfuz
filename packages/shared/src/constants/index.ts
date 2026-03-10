/** quran.com API v4 base URL */
export const QURAN_API_BASE_URL = "https://api.quran.com/api/v4";

/** Total number of chapters in the Quran */
export const TOTAL_CHAPTERS = 114;

/** Total number of verses in the Quran */
export const TOTAL_VERSES = 6236;

/** Total number of juz (parts) */
export const TOTAL_JUZ = 30;

/** Total number of pages in the Uthmani mushaf */
export const TOTAL_PAGES = 604;

/** Default reciter ID (Mishary Rashid Alafasy) */
export const DEFAULT_RECITER_ID = 7;

/** Turkish translation resource IDs */
export const TURKISH_TRANSLATIONS = {
  DIYANET: 77,
  ELMALILI: 52,
  SUAT_YILDIRIM: 169,
} as const;

/** Local translation registry */
export const LOCAL_TRANSLATIONS = [
  { id: "diyanet", name: "Diyanet İşleri", author: "Diyanet İşleri Başkanlığı", source: "local" as const },
  { id: "omer-celik", name: "Ömer Çelik", author: "Prof. Dr. Ömer Çelik", source: "local" as const },
  { id: "omer-nasuhi-bilmen", name: "Ömer Nasuhi Bilmen", author: "Ömer Nasuhi Bilmen", source: "local" as const },
  { id: "ali-fikri-yavuz", name: "Ali Fikri Yavuz", author: "Ali Fikri Yavuz", source: "local" as const },
] as const;

export type TranslationId = (typeof LOCAL_TRANSLATIONS)[number]["id"];

/** Turkish tafsir resource IDs */
export const TURKISH_TAFSIRS = {
  DIYANET: 171,
} as const;

/** Default pagination */
export const DEFAULT_PER_PAGE = 10;
export const VERSES_PER_PAGE_MAX = 50;

/** Cache TTLs (in milliseconds) */
export const CACHE_TTL = {
  /** Chapter list: 30 days (static data) */
  CHAPTERS: 30 * 24 * 60 * 60 * 1000,
  /** Verses: 30 days (static data) */
  VERSES: 30 * 24 * 60 * 60 * 1000,
  /** Translations: 7 days */
  TRANSLATIONS: 7 * 24 * 60 * 60 * 1000,
  /** Reciters: 7 days */
  RECITERS: 7 * 24 * 60 * 60 * 1000,
  /** Search results: 5 minutes */
  SEARCH: 5 * 60 * 1000,
  /** Audio files: 30 days */
  AUDIO: 30 * 24 * 60 * 60 * 1000,
} as const;

/** SM-2 algorithm defaults */
export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 1,
  PASSING_GRADE: 3,
} as const;

/** Gamification Sevap Point values */
export { SEVAP_POINT_VALUES } from "../types/gamification";

/** QDC audio API base URL */
export const QDC_API_BASE_URL = "https://api.qurancdn.com/api/qdc";

/** Curated reciters */
export { CURATED_RECITERS, FEATURED_RECITERS } from "./reciters";
export type { CuratedReciter, ReciterStyleTag } from "./reciters";

/** Supported app languages */
export const SUPPORTED_LANGUAGES = ["tr", "en", "ar"] as const;

/** Breakpoints for responsive design */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;
