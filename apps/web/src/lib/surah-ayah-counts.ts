/**
 * Static surah data for Ayet 2048 game.
 * Three game modes with different surah orderings.
 */

export interface SurahInfo {
  id: number;
  nameSimple: string;
  nameArabic: string;
  ayahCount: number;
}

// All 114 surahs with ayah counts
export const SURAHS: SurahInfo[] = [
  { id: 1, nameSimple: "Al-Fatiha", nameArabic: "الفاتحة", ayahCount: 7 },
  { id: 2, nameSimple: "Al-Baqarah", nameArabic: "البقرة", ayahCount: 286 },
  { id: 3, nameSimple: "Ali 'Imran", nameArabic: "آل عمران", ayahCount: 200 },
  { id: 4, nameSimple: "An-Nisa", nameArabic: "النساء", ayahCount: 176 },
  { id: 5, nameSimple: "Al-Ma'idah", nameArabic: "المائدة", ayahCount: 120 },
  { id: 6, nameSimple: "Al-An'am", nameArabic: "الأنعام", ayahCount: 165 },
  { id: 7, nameSimple: "Al-A'raf", nameArabic: "الأعراف", ayahCount: 206 },
  { id: 8, nameSimple: "Al-Anfal", nameArabic: "الأنفال", ayahCount: 75 },
  { id: 9, nameSimple: "At-Tawbah", nameArabic: "التوبة", ayahCount: 129 },
  { id: 10, nameSimple: "Yunus", nameArabic: "يونس", ayahCount: 109 },
  { id: 11, nameSimple: "Hud", nameArabic: "هود", ayahCount: 123 },
  { id: 12, nameSimple: "Yusuf", nameArabic: "يوسف", ayahCount: 111 },
  { id: 13, nameSimple: "Ar-Ra'd", nameArabic: "الرعد", ayahCount: 43 },
  { id: 14, nameSimple: "Ibrahim", nameArabic: "إبراهيم", ayahCount: 52 },
  { id: 15, nameSimple: "Al-Hijr", nameArabic: "الحجر", ayahCount: 99 },
  { id: 16, nameSimple: "An-Nahl", nameArabic: "النحل", ayahCount: 128 },
  { id: 17, nameSimple: "Al-Isra", nameArabic: "الإسراء", ayahCount: 111 },
  { id: 18, nameSimple: "Al-Kahf", nameArabic: "الكهف", ayahCount: 110 },
  { id: 19, nameSimple: "Maryam", nameArabic: "مريم", ayahCount: 98 },
  { id: 20, nameSimple: "Taha", nameArabic: "طه", ayahCount: 135 },
  { id: 21, nameSimple: "Al-Anbiya", nameArabic: "الأنبياء", ayahCount: 112 },
  { id: 22, nameSimple: "Al-Hajj", nameArabic: "الحج", ayahCount: 78 },
  { id: 23, nameSimple: "Al-Mu'minun", nameArabic: "المؤمنون", ayahCount: 118 },
  { id: 24, nameSimple: "An-Nur", nameArabic: "النور", ayahCount: 64 },
  { id: 25, nameSimple: "Al-Furqan", nameArabic: "الفرقان", ayahCount: 77 },
  { id: 26, nameSimple: "Ash-Shu'ara", nameArabic: "الشعراء", ayahCount: 227 },
  { id: 27, nameSimple: "An-Naml", nameArabic: "النمل", ayahCount: 93 },
  { id: 28, nameSimple: "Al-Qasas", nameArabic: "القصص", ayahCount: 88 },
  { id: 29, nameSimple: "Al-Ankabut", nameArabic: "العنكبوت", ayahCount: 69 },
  { id: 30, nameSimple: "Ar-Rum", nameArabic: "الروم", ayahCount: 60 },
  { id: 31, nameSimple: "Luqman", nameArabic: "لقمان", ayahCount: 34 },
  { id: 32, nameSimple: "As-Sajdah", nameArabic: "السجدة", ayahCount: 30 },
  { id: 33, nameSimple: "Al-Ahzab", nameArabic: "الأحزاب", ayahCount: 73 },
  { id: 34, nameSimple: "Saba", nameArabic: "سبأ", ayahCount: 54 },
  { id: 35, nameSimple: "Fatir", nameArabic: "فاطر", ayahCount: 45 },
  { id: 36, nameSimple: "Ya-Sin", nameArabic: "يس", ayahCount: 83 },
  { id: 37, nameSimple: "As-Saffat", nameArabic: "الصافات", ayahCount: 182 },
  { id: 38, nameSimple: "Sad", nameArabic: "ص", ayahCount: 88 },
  { id: 39, nameSimple: "Az-Zumar", nameArabic: "الزمر", ayahCount: 75 },
  { id: 40, nameSimple: "Ghafir", nameArabic: "غافر", ayahCount: 85 },
  { id: 41, nameSimple: "Fussilat", nameArabic: "فصلت", ayahCount: 54 },
  { id: 42, nameSimple: "Ash-Shura", nameArabic: "الشورى", ayahCount: 53 },
  { id: 43, nameSimple: "Az-Zukhruf", nameArabic: "الزخرف", ayahCount: 89 },
  { id: 44, nameSimple: "Ad-Dukhan", nameArabic: "الدخان", ayahCount: 59 },
  { id: 45, nameSimple: "Al-Jathiyah", nameArabic: "الجاثية", ayahCount: 37 },
  { id: 46, nameSimple: "Al-Ahqaf", nameArabic: "الأحقاف", ayahCount: 35 },
  { id: 47, nameSimple: "Muhammad", nameArabic: "محمد", ayahCount: 38 },
  { id: 48, nameSimple: "Al-Fath", nameArabic: "الفتح", ayahCount: 29 },
  { id: 49, nameSimple: "Al-Hujurat", nameArabic: "الحجرات", ayahCount: 18 },
  { id: 50, nameSimple: "Qaf", nameArabic: "ق", ayahCount: 45 },
  { id: 51, nameSimple: "Adh-Dhariyat", nameArabic: "الذاريات", ayahCount: 60 },
  { id: 52, nameSimple: "At-Tur", nameArabic: "الطور", ayahCount: 49 },
  { id: 53, nameSimple: "An-Najm", nameArabic: "النجم", ayahCount: 62 },
  { id: 54, nameSimple: "Al-Qamar", nameArabic: "القمر", ayahCount: 55 },
  { id: 55, nameSimple: "Ar-Rahman", nameArabic: "الرحمن", ayahCount: 78 },
  { id: 56, nameSimple: "Al-Waqi'ah", nameArabic: "الواقعة", ayahCount: 96 },
  { id: 57, nameSimple: "Al-Hadid", nameArabic: "الحديد", ayahCount: 29 },
  { id: 58, nameSimple: "Al-Mujadila", nameArabic: "المجادلة", ayahCount: 22 },
  { id: 59, nameSimple: "Al-Hashr", nameArabic: "الحشر", ayahCount: 24 },
  { id: 60, nameSimple: "Al-Mumtahanah", nameArabic: "الممتحنة", ayahCount: 13 },
  { id: 61, nameSimple: "As-Saf", nameArabic: "الصف", ayahCount: 14 },
  { id: 62, nameSimple: "Al-Jumu'ah", nameArabic: "الجمعة", ayahCount: 11 },
  { id: 63, nameSimple: "Al-Munafiqun", nameArabic: "المنافقون", ayahCount: 11 },
  { id: 64, nameSimple: "At-Taghabun", nameArabic: "التغابن", ayahCount: 18 },
  { id: 65, nameSimple: "At-Talaq", nameArabic: "الطلاق", ayahCount: 12 },
  { id: 66, nameSimple: "At-Tahrim", nameArabic: "التحريم", ayahCount: 12 },
  { id: 67, nameSimple: "Al-Mulk", nameArabic: "الملك", ayahCount: 30 },
  { id: 68, nameSimple: "Al-Qalam", nameArabic: "القلم", ayahCount: 52 },
  { id: 69, nameSimple: "Al-Haqqah", nameArabic: "الحاقة", ayahCount: 52 },
  { id: 70, nameSimple: "Al-Ma'arij", nameArabic: "المعارج", ayahCount: 44 },
  { id: 71, nameSimple: "Nuh", nameArabic: "نوح", ayahCount: 28 },
  { id: 72, nameSimple: "Al-Jinn", nameArabic: "الجن", ayahCount: 28 },
  { id: 73, nameSimple: "Al-Muzzammil", nameArabic: "المزمل", ayahCount: 20 },
  { id: 74, nameSimple: "Al-Muddaththir", nameArabic: "المدثر", ayahCount: 56 },
  { id: 75, nameSimple: "Al-Qiyamah", nameArabic: "القيامة", ayahCount: 40 },
  { id: 76, nameSimple: "Al-Insan", nameArabic: "الإنسان", ayahCount: 31 },
  { id: 77, nameSimple: "Al-Mursalat", nameArabic: "المرسلات", ayahCount: 50 },
  { id: 78, nameSimple: "An-Naba", nameArabic: "النبأ", ayahCount: 40 },
  { id: 79, nameSimple: "An-Nazi'at", nameArabic: "النازعات", ayahCount: 46 },
  { id: 80, nameSimple: "Abasa", nameArabic: "عبس", ayahCount: 42 },
  { id: 81, nameSimple: "At-Takwir", nameArabic: "التكوير", ayahCount: 29 },
  { id: 82, nameSimple: "Al-Infitar", nameArabic: "الانفطار", ayahCount: 19 },
  { id: 83, nameSimple: "Al-Mutaffifin", nameArabic: "المطففين", ayahCount: 36 },
  { id: 84, nameSimple: "Al-Inshiqaq", nameArabic: "الانشقاق", ayahCount: 25 },
  { id: 85, nameSimple: "Al-Buruj", nameArabic: "البروج", ayahCount: 22 },
  { id: 86, nameSimple: "At-Tariq", nameArabic: "الطارق", ayahCount: 17 },
  { id: 87, nameSimple: "Al-A'la", nameArabic: "الأعلى", ayahCount: 19 },
  { id: 88, nameSimple: "Al-Ghashiyah", nameArabic: "الغاشية", ayahCount: 26 },
  { id: 89, nameSimple: "Al-Fajr", nameArabic: "الفجر", ayahCount: 30 },
  { id: 90, nameSimple: "Al-Balad", nameArabic: "البلد", ayahCount: 20 },
  { id: 91, nameSimple: "Ash-Shams", nameArabic: "الشمس", ayahCount: 15 },
  { id: 92, nameSimple: "Al-Layl", nameArabic: "الليل", ayahCount: 21 },
  { id: 93, nameSimple: "Ad-Duha", nameArabic: "الضحى", ayahCount: 11 },
  { id: 94, nameSimple: "Ash-Sharh", nameArabic: "الشرح", ayahCount: 8 },
  { id: 95, nameSimple: "At-Tin", nameArabic: "التين", ayahCount: 8 },
  { id: 96, nameSimple: "Al-Alaq", nameArabic: "العلق", ayahCount: 19 },
  { id: 97, nameSimple: "Al-Qadr", nameArabic: "القدر", ayahCount: 5 },
  { id: 98, nameSimple: "Al-Bayyinah", nameArabic: "البينة", ayahCount: 8 },
  { id: 99, nameSimple: "Az-Zalzalah", nameArabic: "الزلزلة", ayahCount: 8 },
  { id: 100, nameSimple: "Al-Adiyat", nameArabic: "العاديات", ayahCount: 11 },
  { id: 101, nameSimple: "Al-Qari'ah", nameArabic: "القارعة", ayahCount: 11 },
  { id: 102, nameSimple: "At-Takathur", nameArabic: "التكاثر", ayahCount: 8 },
  { id: 103, nameSimple: "Al-Asr", nameArabic: "العصر", ayahCount: 3 },
  { id: 104, nameSimple: "Al-Humazah", nameArabic: "الهمزة", ayahCount: 9 },
  { id: 105, nameSimple: "Al-Fil", nameArabic: "الفيل", ayahCount: 5 },
  { id: 106, nameSimple: "Quraysh", nameArabic: "قريش", ayahCount: 4 },
  { id: 107, nameSimple: "Al-Ma'un", nameArabic: "الماعون", ayahCount: 7 },
  { id: 108, nameSimple: "Al-Kawthar", nameArabic: "الكوثر", ayahCount: 3 },
  { id: 109, nameSimple: "Al-Kafirun", nameArabic: "الكافرون", ayahCount: 6 },
  { id: 110, nameSimple: "An-Nasr", nameArabic: "النصر", ayahCount: 3 },
  { id: 111, nameSimple: "Al-Masad", nameArabic: "المسد", ayahCount: 5 },
  { id: 112, nameSimple: "Al-Ikhlas", nameArabic: "الإخلاص", ayahCount: 4 },
  { id: 113, nameSimple: "Al-Falaq", nameArabic: "الفلق", ayahCount: 5 },
  { id: 114, nameSimple: "An-Nas", nameArabic: "الناس", ayahCount: 6 },
];

const SURAH_BY_ID = new Map(SURAHS.map((s) => [s.id, s]));

// ── Game mode sequences ────────────────────────────────────

/** Namaz sureleri: Duha'dan Nas'a kadar (93 -> 114) */
export const SEQ_NAMAZ: number[] = [
  93,  // 0  Ad-Duha
  94,  // 1  Ash-Sharh
  95,  // 2  At-Tin
  96,  // 3  Al-Alaq
  97,  // 4  Al-Qadr
  98,  // 5  Al-Bayyinah
  99,  // 6  Az-Zalzalah
  100, // 7  Al-Adiyat
  101, // 8  Al-Qari'ah
  102, // 9  At-Takathur
  103, // 10 Al-Asr
  104, // 11 Al-Humazah
  105, // 12 Al-Fil
  106, // 13 Quraysh
  107, // 14 Al-Ma'un
  108, // 15 Al-Kawthar
  109, // 16 Al-Kafirun
  110, // 17 An-Nasr
  111, // 18 Al-Masad
  112, // 19 Al-Ikhlas
  113, // 20 Al-Falaq
  114, // 21 An-Nas
];

/** Sure sirasi: Mushaf order (1 -> 23) */
export const SEQ_MUSHAF: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23,
];

/** Nuzul sirasi: Revelation order (Egyptian standard, first 23) */
export const SEQ_NUZUL: number[] = [
  96,  // Al-Alaq
  68,  // Al-Qalam
  73,  // Al-Muzzammil
  74,  // Al-Muddaththir
  1,   // Al-Fatiha
  111, // Al-Masad
  81,  // At-Takwir
  87,  // Al-A'la
  92,  // Al-Layl
  89,  // Al-Fajr
  93,  // Ad-Duha
  94,  // Ash-Sharh
  103, // Al-Asr
  100, // Al-Adiyat
  108, // Al-Kawthar
  102, // At-Takathur
  107, // Al-Ma'un
  109, // Al-Kafirun
  105, // Al-Fil
  113, // Al-Falaq
  114, // An-Nas
  112, // Al-Ikhlas
  53,  // An-Najm
];

export interface GameMode {
  id: string;
  sequence: number[];
  gridSize: number;
  winTarget: number; // level index to reach for win
}

export const GAME_MODES: GameMode[] = [
  { id: "mushaf", sequence: SEQ_MUSHAF, gridSize: 4, winTarget: 11 },
  { id: "nuzul", sequence: SEQ_NUZUL, gridSize: 4, winTarget: 11 },
  { id: "namaz", sequence: SEQ_NAMAZ, gridSize: 5, winTarget: 21 },
];

/** Get surah info for a given level within a sequence. */
export function getSurahForLevel(sequence: number[], level: number): SurahInfo | undefined {
  const surahId = sequence[level];
  if (surahId === undefined) return undefined;
  return SURAH_BY_ID.get(surahId);
}

/** Spawn values: mostly level 0, 10% level 1. */
export const SPAWN_VALUES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
