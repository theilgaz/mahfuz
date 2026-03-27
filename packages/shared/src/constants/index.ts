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

/** Berkenar (Ottoman/Turkish) layout: each juz = 20 pages */
export const BERKENAR_TOTAL_PAGES = 600;
export const BERKENAR_PAGES_PER_JUZ = 20;

/** Page layout type */
export type PageLayout = "medine" | "berkenar";

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
  { id: "elmali-yeni", name: "Elmalılı Yeni Meali", author: "Elmalılı Hamdi Yazır (Sadeleştirilmiş)", source: "local" as const, language: "turkish" as const },
  { id: "omer-celik", name: "Ömer Çelik", author: "Prof. Dr. Ömer Çelik", source: "local" as const, language: "turkish" as const },
  { id: "diyanet", name: "Diyanet İşleri", author: "Diyanet İşleri Başkanlığı", source: "local" as const, language: "turkish" as const },
  { id: "omer-nasuhi-bilmen", name: "Ömer Nasuhi Bilmen", author: "Ömer Nasuhi Bilmen", source: "local" as const, language: "turkish" as const },
  { id: "ali-fikri-yavuz", name: "Ali Fikri Yavuz", author: "Ali Fikri Yavuz", source: "local" as const, language: "turkish" as const },
  { id: "muhammed-esed", name: "Muhammed Esed", author: "Muhammed Esed", source: "local" as const, language: "turkish" as const },
  { id: "sahih-international", name: "Sahih International", author: "Sahih International", source: "local" as const, language: "english" as const },
  { id: "taisirul-quran", name: "Taisirul Quran", author: "Taisirul Quran", source: "local" as const, language: "bengali" as const },
  { id: "islamhouse-fa", name: "IslamHouse.com", author: "IslamHouse.com", source: "local" as const, language: "persian" as const },
  { id: "montada-fr", name: "Montada Islamic Foundation", author: "Montada Islamic Foundation", source: "local" as const, language: "french" as const },
  { id: "kfqpc-id", name: "King Fahad Quran Complex", author: "King Fahad Quran Complex", source: "local" as const, language: "indonesian" as const },
  { id: "piccardo", name: "Hamza Roberto Piccardo", author: "Hamza Roberto Piccardo", source: "local" as const, language: "italian" as const },
  { id: "abdalsalaam-nl", name: "Malak Faris Abdalsalaam", author: "Malak Faris Abdalsalaam", source: "local" as const, language: "dutch" as const },
  { id: "helmi-nasr", name: "Helmi Nasr", author: "Helmi Nasr", source: "local" as const, language: "portuguese" as const },
  { id: "kuliev", name: "Elmir Kuliev", author: "Elmir Kuliev", source: "local" as const, language: "russian" as const },
  { id: "nahi", name: "Hasan Efendi Nahi", author: "Hasan Efendi Nahi", source: "local" as const, language: "albanian" as const },
  { id: "kfqpc-th", name: "King Fahad Quran Complex", author: "King Fahad Quran Complex", source: "local" as const, language: "thai" as const },
  { id: "junagarhi", name: "Muhammad Junagarhi", author: "Muhammad Junagarhi", source: "local" as const, language: "urdu" as const },
  { id: "ma-jian", name: "Ma Jian", author: "Ma Jian", source: "local" as const, language: "chinese" as const },
  { id: "basmeih", name: "Abdullah Muhammad Basmeih", author: "Abdullah Muhammad Basmeih", source: "local" as const, language: "malay" as const },
  { id: "isa-garcia", name: "Sheikh Isa Garcia", author: "Sheikh Isa Garcia", source: "local" as const, language: "spanish" as const },
  { id: "barwani", name: "Ali Muhsin Al-Barwani", author: "Ali Muhsin Al-Barwani", source: "local" as const, language: "swahili" as const },
  { id: "ruwwad-vi", name: "Ruwwad Center", author: "Ruwwad Center", source: "local" as const, language: "vietnamese" as const },
] as const;

export type TranslationId = (typeof LOCAL_TRANSLATIONS)[number]["id"];
export type TranslationLanguage = keyof typeof LANGUAGE_BADGE_LABELS;

/** Short badge labels for translation languages */
export const LANGUAGE_BADGE_LABELS = {
  turkish: "TR",
  english: "EN",
  arabic: "AR",
  bengali: "BN",
  persian: "FA",
  french: "FR",
  indonesian: "ID",
  italian: "IT",
  dutch: "NL",
  portuguese: "PT",
  russian: "RU",
  albanian: "SQ",
  thai: "TH",
  urdu: "UR",
  chinese: "ZH",
  malay: "MS",
  spanish: "ES",
  swahili: "SW",
  vietnamese: "VI",
} as const;

/** Full display names for translation languages */
export const LANGUAGE_DISPLAY_NAMES: Record<TranslationLanguage, string> = {
  turkish: "Türkçe",
  english: "English",
  arabic: "العربية",
  bengali: "বাংলা",
  persian: "فارسی",
  french: "Français",
  indonesian: "Indonesia",
  italian: "Italiano",
  dutch: "Dutch",
  portuguese: "Português",
  russian: "русский",
  albanian: "Shqip",
  thai: "ภาษาไทย",
  urdu: "اردو",
  chinese: "简体中文",
  malay: "Melayu",
  spanish: "Español",
  swahili: "Kiswahili",
  vietnamese: "Tiếng Việt",
} as const;

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
export const SUPPORTED_LANGUAGES = [
  "tr", "en", "ar", "bn", "fa", "fr", "id", "it", "nl", "pt",
  "ru", "sq", "th", "ur", "zh", "ms", "es", "sw", "vi",
] as const;

/** Breakpoints for responsive design */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;
