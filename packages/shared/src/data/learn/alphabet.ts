import type { ArabicLetter } from "../../types/learn";

/** All 28 Arabic letters with forms, makhraj, and shape families */
export const ARABIC_ALPHABET: ArabicLetter[] = [
  {
    id: 1,
    forms: { isolated: "ا", initial: "ا", medial: "ـا", final: "ـا", isNonConnector: true },
    nameArabic: "أَلِف", nameRoman: "Elif", sound: "a/e",
    makhraj: "chest", makhrajPoint: "Göğüsten (boş ses)",
    shapeFamily: "alif", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "اَ", sound: "e" },
      { harakat: "\u0650", combined: "اِ", sound: "i" },
      { harakat: "\u064F", combined: "اُ", sound: "u" },
    ],
  },
  {
    id: 2,
    forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب", isNonConnector: false },
    nameArabic: "بَاء", nameRoman: "Be", sound: "b",
    makhraj: "lips", makhrajPoint: "İki dudağın birleşmesi",
    shapeFamily: "ba", dotsCount: 1, dotsPosition: "below",
    harakatCombinations: [
      { harakat: "\u064E", combined: "بَ", sound: "be" },
      { harakat: "\u0650", combined: "بِ", sound: "bi" },
      { harakat: "\u064F", combined: "بُ", sound: "bu" },
    ],
  },
  {
    id: 3,
    forms: { isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت", isNonConnector: false },
    nameArabic: "تَاء", nameRoman: "Te", sound: "t",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst dişlerin arkasına",
    shapeFamily: "ba", dotsCount: 2, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "تَ", sound: "te" },
      { harakat: "\u0650", combined: "تِ", sound: "ti" },
      { harakat: "\u064F", combined: "تُ", sound: "tu" },
    ],
  },
  {
    id: 4,
    forms: { isolated: "ث", initial: "ثـ", medial: "ـثـ", final: "ـث", isNonConnector: false },
    nameArabic: "ثَاء", nameRoman: "Se", sound: "s (th)",
    makhraj: "tongue", makhrajPoint: "Dilin ucu dişlerin arasından",
    shapeFamily: "ba", dotsCount: 3, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "ثَ", sound: "se" },
      { harakat: "\u0650", combined: "ثِ", sound: "si" },
      { harakat: "\u064F", combined: "ثُ", sound: "su" },
    ],
  },
  {
    id: 5,
    forms: { isolated: "ج", initial: "جـ", medial: "ـجـ", final: "ـج", isNonConnector: false },
    nameArabic: "جِيم", nameRoman: "Cim", sound: "c",
    makhraj: "tongue", makhrajPoint: "Dilin ortası damağa",
    shapeFamily: "jim", dotsCount: 1, dotsPosition: "below",
    harakatCombinations: [
      { harakat: "\u064E", combined: "جَ", sound: "ce" },
      { harakat: "\u0650", combined: "جِ", sound: "ci" },
      { harakat: "\u064F", combined: "جُ", sound: "cu" },
    ],
  },
  {
    id: 6,
    forms: { isolated: "ح", initial: "حـ", medial: "ـحـ", final: "ـح", isNonConnector: false },
    nameArabic: "حَاء", nameRoman: "Ha", sound: "h (boğaz)",
    makhraj: "throat", makhrajPoint: "Boğazın ortası",
    shapeFamily: "jim", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "حَ", sound: "ha" },
      { harakat: "\u0650", combined: "حِ", sound: "hi" },
      { harakat: "\u064F", combined: "حُ", sound: "hu" },
    ],
  },
  {
    id: 7,
    forms: { isolated: "خ", initial: "خـ", medial: "ـخـ", final: "ـخ", isNonConnector: false },
    nameArabic: "خَاء", nameRoman: "Hı", sound: "h (kalın)",
    makhraj: "throat", makhrajPoint: "Boğazın üst kısmı",
    shapeFamily: "jim", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "خَ", sound: "ha" },
      { harakat: "\u0650", combined: "خِ", sound: "hi" },
      { harakat: "\u064F", combined: "خُ", sound: "hu" },
    ],
  },
  {
    id: 8,
    forms: { isolated: "د", initial: "د", medial: "ـد", final: "ـد", isNonConnector: true },
    nameArabic: "دَال", nameRoman: "Dal", sound: "d",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst dişlerin arkasına",
    shapeFamily: "dal", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "دَ", sound: "de" },
      { harakat: "\u0650", combined: "دِ", sound: "di" },
      { harakat: "\u064F", combined: "دُ", sound: "du" },
    ],
  },
  {
    id: 9,
    forms: { isolated: "ذ", initial: "ذ", medial: "ـذ", final: "ـذ", isNonConnector: true },
    nameArabic: "ذَال", nameRoman: "Zel", sound: "z (dh)",
    makhraj: "tongue", makhrajPoint: "Dilin ucu dişlerin arasından",
    shapeFamily: "dal", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "ذَ", sound: "ze" },
      { harakat: "\u0650", combined: "ذِ", sound: "zi" },
      { harakat: "\u064F", combined: "ذُ", sound: "zu" },
    ],
  },
  {
    id: 10,
    forms: { isolated: "ر", initial: "ر", medial: "ـر", final: "ـر", isNonConnector: true },
    nameArabic: "رَاء", nameRoman: "Ra", sound: "r",
    makhraj: "tongue", makhrajPoint: "Dilin ucu damağa yakın",
    shapeFamily: "ra", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "رَ", sound: "ra" },
      { harakat: "\u0650", combined: "رِ", sound: "ri" },
      { harakat: "\u064F", combined: "رُ", sound: "ru" },
    ],
  },
  {
    id: 11,
    forms: { isolated: "ز", initial: "ز", medial: "ـز", final: "ـز", isNonConnector: true },
    nameArabic: "زَاي", nameRoman: "Ze", sound: "z",
    makhraj: "tongue", makhrajPoint: "Dilin ucu alt dişlerin ucuna",
    shapeFamily: "ra", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "زَ", sound: "ze" },
      { harakat: "\u0650", combined: "زِ", sound: "zi" },
      { harakat: "\u064F", combined: "زُ", sound: "zu" },
    ],
  },
  {
    id: 12,
    forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس", isNonConnector: false },
    nameArabic: "سِين", nameRoman: "Sin", sound: "s",
    makhraj: "tongue", makhrajPoint: "Dilin ucu alt dişlerin ucuna",
    shapeFamily: "sin", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "سَ", sound: "se" },
      { harakat: "\u0650", combined: "سِ", sound: "si" },
      { harakat: "\u064F", combined: "سُ", sound: "su" },
    ],
  },
  {
    id: 13,
    forms: { isolated: "ش", initial: "شـ", medial: "ـشـ", final: "ـش", isNonConnector: false },
    nameArabic: "شِين", nameRoman: "Şın", sound: "ş",
    makhraj: "tongue", makhrajPoint: "Dilin ortası damağa",
    shapeFamily: "sin", dotsCount: 3, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "شَ", sound: "şe" },
      { harakat: "\u0650", combined: "شِ", sound: "şi" },
      { harakat: "\u064F", combined: "شُ", sound: "şu" },
    ],
  },
  {
    id: 14,
    forms: { isolated: "ص", initial: "صـ", medial: "ـصـ", final: "ـص", isNonConnector: false },
    nameArabic: "صَاد", nameRoman: "Sad", sound: "s (kalın)",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst dişlerin arkasına (kalın)",
    shapeFamily: "sad", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "صَ", sound: "sa" },
      { harakat: "\u0650", combined: "صِ", sound: "sı" },
      { harakat: "\u064F", combined: "صُ", sound: "su" },
    ],
  },
  {
    id: 15,
    forms: { isolated: "ض", initial: "ضـ", medial: "ـضـ", final: "ـض", isNonConnector: false },
    nameArabic: "ضَاد", nameRoman: "Dad", sound: "d (kalın)",
    makhraj: "tongue", makhrajPoint: "Dilin yanları üst azı dişlerine",
    shapeFamily: "sad", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "ضَ", sound: "da" },
      { harakat: "\u0650", combined: "ضِ", sound: "dı" },
      { harakat: "\u064F", combined: "ضُ", sound: "du" },
    ],
  },
  {
    id: 16,
    forms: { isolated: "ط", initial: "طـ", medial: "ـطـ", final: "ـط", isNonConnector: false },
    nameArabic: "طَاء", nameRoman: "Tı", sound: "t (kalın)",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst dişlerin arkasına (kalın)",
    shapeFamily: "ta", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "طَ", sound: "ta" },
      { harakat: "\u0650", combined: "طِ", sound: "tı" },
      { harakat: "\u064F", combined: "طُ", sound: "tu" },
    ],
  },
  {
    id: 17,
    forms: { isolated: "ظ", initial: "ظـ", medial: "ـظـ", final: "ـظ", isNonConnector: false },
    nameArabic: "ظَاء", nameRoman: "Zı", sound: "z (kalın)",
    makhraj: "tongue", makhrajPoint: "Dilin ucu dişlerin arasından (kalın)",
    shapeFamily: "ta", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "ظَ", sound: "za" },
      { harakat: "\u0650", combined: "ظِ", sound: "zı" },
      { harakat: "\u064F", combined: "ظُ", sound: "zu" },
    ],
  },
  {
    id: 18,
    forms: { isolated: "ع", initial: "عـ", medial: "ـعـ", final: "ـع", isNonConnector: false },
    nameArabic: "عَيْن", nameRoman: "Ayn", sound: "' (ayn)",
    makhraj: "throat", makhrajPoint: "Boğazın ortası",
    shapeFamily: "ayn", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "عَ", sound: "a" },
      { harakat: "\u0650", combined: "عِ", sound: "i" },
      { harakat: "\u064F", combined: "عُ", sound: "u" },
    ],
  },
  {
    id: 19,
    forms: { isolated: "غ", initial: "غـ", medial: "ـغـ", final: "ـغ", isNonConnector: false },
    nameArabic: "غَيْن", nameRoman: "Ğayn", sound: "ğ",
    makhraj: "throat", makhrajPoint: "Boğazın üst kısmı",
    shapeFamily: "ayn", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "غَ", sound: "ğa" },
      { harakat: "\u0650", combined: "غِ", sound: "ğı" },
      { harakat: "\u064F", combined: "غُ", sound: "ğu" },
    ],
  },
  {
    id: 20,
    forms: { isolated: "ف", initial: "فـ", medial: "ـفـ", final: "ـف", isNonConnector: false },
    nameArabic: "فَاء", nameRoman: "Fe", sound: "f",
    makhraj: "lips", makhrajPoint: "Alt dudağın iç kısmı üst dişlere",
    shapeFamily: "fa", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "فَ", sound: "fe" },
      { harakat: "\u0650", combined: "فِ", sound: "fi" },
      { harakat: "\u064F", combined: "فُ", sound: "fu" },
    ],
  },
  {
    id: 21,
    forms: { isolated: "ق", initial: "قـ", medial: "ـقـ", final: "ـق", isNonConnector: false },
    nameArabic: "قَاف", nameRoman: "Kaf", sound: "k (kalın)",
    makhraj: "tongue", makhrajPoint: "Dilin arkası üst damağa",
    shapeFamily: "qaf", dotsCount: 2, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "قَ", sound: "ka" },
      { harakat: "\u0650", combined: "قِ", sound: "kı" },
      { harakat: "\u064F", combined: "قُ", sound: "ku" },
    ],
  },
  {
    id: 22,
    forms: { isolated: "ك", initial: "كـ", medial: "ـكـ", final: "ـك", isNonConnector: false },
    nameArabic: "كَاف", nameRoman: "Kef", sound: "k",
    makhraj: "tongue", makhrajPoint: "Dilin arkası damağa (ince)",
    shapeFamily: "kaf", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "كَ", sound: "ke" },
      { harakat: "\u0650", combined: "كِ", sound: "ki" },
      { harakat: "\u064F", combined: "كُ", sound: "ku" },
    ],
  },
  {
    id: 23,
    forms: { isolated: "ل", initial: "لـ", medial: "ـلـ", final: "ـل", isNonConnector: false },
    nameArabic: "لَام", nameRoman: "Lam", sound: "l",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst damağa",
    shapeFamily: "lam", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "لَ", sound: "le" },
      { harakat: "\u0650", combined: "لِ", sound: "li" },
      { harakat: "\u064F", combined: "لُ", sound: "lu" },
    ],
  },
  {
    id: 24,
    forms: { isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم", isNonConnector: false },
    nameArabic: "مِيم", nameRoman: "Mim", sound: "m",
    makhraj: "lips", makhrajPoint: "İki dudağın birleşmesi",
    shapeFamily: "mim", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "مَ", sound: "me" },
      { harakat: "\u0650", combined: "مِ", sound: "mi" },
      { harakat: "\u064F", combined: "مُ", sound: "mu" },
    ],
  },
  {
    id: 25,
    forms: { isolated: "ن", initial: "نـ", medial: "ـنـ", final: "ـن", isNonConnector: false },
    nameArabic: "نُون", nameRoman: "Nun", sound: "n",
    makhraj: "tongue", makhrajPoint: "Dilin ucu üst damağa",
    shapeFamily: "nun", dotsCount: 1, dotsPosition: "above",
    harakatCombinations: [
      { harakat: "\u064E", combined: "نَ", sound: "ne" },
      { harakat: "\u0650", combined: "نِ", sound: "ni" },
      { harakat: "\u064F", combined: "نُ", sound: "nu" },
    ],
  },
  {
    id: 26,
    forms: { isolated: "ه", initial: "هـ", medial: "ـهـ", final: "ـه", isNonConnector: false },
    nameArabic: "هَاء", nameRoman: "He", sound: "h",
    makhraj: "throat", makhrajPoint: "Boğazın alt kısmı",
    shapeFamily: "ha", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "هَ", sound: "he" },
      { harakat: "\u0650", combined: "هِ", sound: "hi" },
      { harakat: "\u064F", combined: "هُ", sound: "hu" },
    ],
  },
  {
    id: 27,
    forms: { isolated: "و", initial: "و", medial: "ـو", final: "ـو", isNonConnector: true },
    nameArabic: "وَاو", nameRoman: "Vav", sound: "v/w",
    makhraj: "lips", makhrajPoint: "İki dudağın yuvarlaklaşması",
    shapeFamily: "waw", dotsCount: 0, dotsPosition: "none",
    harakatCombinations: [
      { harakat: "\u064E", combined: "وَ", sound: "ve" },
      { harakat: "\u0650", combined: "وِ", sound: "vi" },
      { harakat: "\u064F", combined: "وُ", sound: "vu" },
    ],
  },
  {
    id: 28,
    forms: { isolated: "ي", initial: "يـ", medial: "ـيـ", final: "ـي", isNonConnector: false },
    nameArabic: "يَاء", nameRoman: "Ya", sound: "y",
    makhraj: "tongue", makhrajPoint: "Dilin ortası damağa",
    shapeFamily: "ya", dotsCount: 2, dotsPosition: "below",
    harakatCombinations: [
      { harakat: "\u064E", combined: "يَ", sound: "ye" },
      { harakat: "\u0650", combined: "يِ", sound: "yi" },
      { harakat: "\u064F", combined: "يُ", sound: "yu" },
    ],
  },
];

/** Letters grouped by shape family for teaching */
export const SHAPE_FAMILY_GROUPS: Record<string, number[]> = {
  "alif": [1],          // ا
  "ba": [2, 3, 4],      // ب ت ث
  "jim": [5, 6, 7],     // ج ح خ
  "dal": [8, 9],        // د ذ
  "ra": [10, 11],       // ر ز
  "sin": [12, 13],      // س ش
  "sad": [14, 15],      // ص ض
  "ta": [16, 17],       // ط ظ
  "ayn": [18, 19],      // ع غ
  "fa": [20],           // ف
  "qaf": [21],          // ق
  "kaf": [22],          // ك
  "lam": [23],          // ل
  "mim": [24],          // م
  "nun": [25],          // ن
  "ha": [26],           // ه
  "waw": [27],          // و
  "ya": [28],           // ي
};

/** Non-connecting letters (don't connect to the following letter) */
export const NON_CONNECTING_LETTERS = [1, 8, 9, 10, 11, 27]; // ا د ذ ر ز و

/** Get a letter by ID */
export function getLetterById(id: number): ArabicLetter | undefined {
  return ARABIC_ALPHABET.find((l) => l.id === id);
}
