export interface ArabicLetter {
  id: string;
  arabic: string;
  name: string; // transliterated name
  nameAr: string; // Arabic name
  order: number;
}

/** Letters that do not connect to the following letter (only have isolated & final forms) */
const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

const ZWJ = "\u200D"; // Zero Width Joiner

/** Get the four positional forms of an Arabic letter */
export function getLetterForms(letter: string) {
  const nc = NON_CONNECTORS.has(letter);
  return {
    isolated: letter,
    initial: nc ? letter : letter + ZWJ,
    medial: nc ? ZWJ + letter : ZWJ + letter + ZWJ,
    final: ZWJ + letter,
  };
}

export const ARABIC_LETTERS: ArabicLetter[] = [
  { id: "alif", arabic: "ا", name: "Elif", nameAr: "أَلِف", order: 1 },
  { id: "ba", arabic: "ب", name: "Ba", nameAr: "بَاء", order: 2 },
  { id: "ta", arabic: "ت", name: "Ta", nameAr: "تَاء", order: 3 },
  { id: "tha", arabic: "ث", name: "Sa", nameAr: "ثَاء", order: 4 },
  { id: "jim", arabic: "ج", name: "Cim", nameAr: "جِيم", order: 5 },
  { id: "ha", arabic: "ح", name: "Ha", nameAr: "حَاء", order: 6 },
  { id: "kha", arabic: "خ", name: "Hı", nameAr: "خَاء", order: 7 },
  { id: "dal", arabic: "د", name: "Dal", nameAr: "دَال", order: 8 },
  { id: "dhal", arabic: "ذ", name: "Zel", nameAr: "ذَال", order: 9 },
  { id: "ra", arabic: "ر", name: "Ra", nameAr: "رَاء", order: 10 },
  { id: "zay", arabic: "ز", name: "Ze", nameAr: "زَاي", order: 11 },
  { id: "sin", arabic: "س", name: "Sin", nameAr: "سِين", order: 12 },
  { id: "shin", arabic: "ش", name: "Şın", nameAr: "شِين", order: 13 },
  { id: "sad", arabic: "ص", name: "Sad", nameAr: "صَاد", order: 14 },
  { id: "dad", arabic: "ض", name: "Dad", nameAr: "ضَاد", order: 15 },
  { id: "taa", arabic: "ط", name: "Tı", nameAr: "طَاء", order: 16 },
  { id: "dhaa", arabic: "ظ", name: "Zı", nameAr: "ظَاء", order: 17 },
  { id: "ayn", arabic: "ع", name: "Ayın", nameAr: "عَيْن", order: 18 },
  { id: "ghayn", arabic: "غ", name: "Gayın", nameAr: "غَيْن", order: 19 },
  { id: "fa", arabic: "ف", name: "Fe", nameAr: "فَاء", order: 20 },
  { id: "qaf", arabic: "ق", name: "Kaf", nameAr: "قَاف", order: 21 },
  { id: "kaf", arabic: "ك", name: "Kef", nameAr: "كَاف", order: 22 },
  { id: "lam", arabic: "ل", name: "Lam", nameAr: "لَام", order: 23 },
  { id: "mim", arabic: "م", name: "Mim", nameAr: "مِيم", order: 24 },
  { id: "nun", arabic: "ن", name: "Nun", nameAr: "نُون", order: 25 },
  { id: "haa", arabic: "ه", name: "He", nameAr: "هَاء", order: 26 },
  { id: "waw", arabic: "و", name: "Vav", nameAr: "وَاو", order: 27 },
  { id: "ya", arabic: "ي", name: "Ye", nameAr: "يَاء", order: 28 },
];
