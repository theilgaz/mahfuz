export interface ArabicLetter {
  id: string;
  arabic: string;
  name: string; // transliterated name
  nameAr: string; // Arabic name
  order: number;
}

export type FormPosition = "isolated" | "initial" | "medial" | "final";

export interface LetterExample {
  arabic: string;
  transliteration: string;
  meaning: string;
  position: FormPosition;
  verseRef?: string; // "1:1" format
}

/** Letters that do not connect to the following letter (only have isolated & final forms) */
export const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

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

/**
 * Groups of visually similar letters (same base shape, differ in dots or diacritics).
 * Used to generate harder, more educational quiz distractors.
 */
export const SIMILAR_LETTERS: Record<string, string[]> = {
  alif:  ["lam", "waw", "dal"],
  ba:    ["ta", "tha", "nun", "ya"],
  ta:    ["ba", "tha", "nun", "ya"],
  tha:   ["ba", "ta", "nun", "ya"],
  jim:   ["ha", "kha"],
  ha:    ["jim", "kha", "haa"],
  kha:   ["jim", "ha"],
  dal:   ["dhal", "ra", "zay"],
  dhal:  ["dal", "ra", "zay"],
  ra:    ["zay", "dal", "dhal", "waw"],
  zay:   ["ra", "dal", "dhal"],
  sin:   ["shin", "sad", "dad"],
  shin:  ["sin", "sad", "dad"],
  sad:   ["dad", "taa", "sin", "shin"],
  dad:   ["sad", "taa", "dhaa", "sin", "shin"],
  taa:   ["dhaa", "sad", "dad"],
  dhaa:  ["taa", "sad", "dad"],
  ayn:   ["ghayn"],
  ghayn: ["ayn"],
  fa:    ["qaf", "waw"],
  qaf:   ["fa"],
  kaf:   ["lam", "alif"],
  lam:   ["alif", "kaf"],
  mim:   ["waw", "haa"],
  nun:   ["ba", "ta", "tha", "ya"],
  haa:   ["ha", "mim"],
  waw:   ["ra", "zay", "fa"],
  ya:    ["ba", "ta", "tha", "nun"],
};

/**
 * Returns `count` distractor letters that are visually similar to the given letter,
 * falling back to random letters if not enough similar ones exist.
 */
export function getSimilarDistractors(letterId: string, count: number): ArabicLetter[] {
  const similarIds = SIMILAR_LETTERS[letterId] ?? [];
  const pool = shuffle([...ARABIC_LETTERS]);
  const similar = pool.filter((l) => similarIds.includes(l.id));
  const rest = pool.filter((l) => l.id !== letterId && !similarIds.includes(l.id));
  return [...similar, ...rest].slice(0, count);
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

/**
 * Kuran'dan her harf için konum örneği.
 *
 * Seçim kuralı: örnek kelimede hedef harf belirtilen konumda açıkça görünmeli.
 *
 * BAĞLANMA MANTIĞI:
 *   initial  → kelime başında, sola bağlanır         (hedef harf ilk harf)
 *   medial   → ortada, sağdan bağ alır + sola bağlar (hedef harf tam ortada)
 *   final    → sağdan bağ alır, solda bağ yok        (hedef harf son harf veya bağlanmaz harfin hemen önü)
 *   isolated → hiçbir yandan bağ yok                 (kelime başında veya bağlanmaz harften sonra)
 *
 * BAĞLANMAZ HARFLER (ا د ذ ر ز و): yalnızca isolated + final.
 */
export const LETTER_EXAMPLES: Record<string, LetterExample[]> = {
  // ا — bağlanmaz; isolated: kelime başında / final: connector → ا
  alif: [
    { arabic: "أَحَدٌ",  transliteration: "aḥad",  meaning: "Bir",    position: "isolated", verseRef: "112:1" },
    { arabic: "يَا",    transliteration: "yā",    meaning: "Ey",     position: "final",    verseRef: "2:21"  },
  ],
  // ب — connector
  ba: [
    { arabic: "بِسْمِ",  transliteration: "bismi",  meaning: "Adıyla",     position: "initial", verseRef: "1:1"   },
    { arabic: "نَبِيٌّ", transliteration: "nabī",   meaning: "Peygamber",  position: "medial",  verseRef: "2:61"  },
    { arabic: "كَتَبَ",  transliteration: "kataba", meaning: "Yazdı",      position: "final",   verseRef: "2:79"  },
  ],
  // ت — connector
  ta: [
    { arabic: "تَوْبَةٌ", transliteration: "tawbah", meaning: "Tövbe", position: "initial", verseRef: "2:37"  },
    { arabic: "كِتَابٌ", transliteration: "kitāb",  meaning: "Kitap", position: "medial",  verseRef: "2:2"   },
    { arabic: "بَيْتٌ",  transliteration: "bayt",   meaning: "Ev",    position: "final",   verseRef: "2:125" },
  ],
  // ث — connector
  tha: [
    { arabic: "ثَمَرَةٍ", transliteration: "thamara", meaning: "Meyve",  position: "initial", verseRef: "2:25" },
    { arabic: "مِيثَٰقٌ", transliteration: "mīthāq", meaning: "Misak",  position: "medial",  verseRef: "2:27" },
    { arabic: "حَدِيثٌ",  transliteration: "ḥadīth", meaning: "Söz",    position: "final",   verseRef: "4:87" },
  ],
  // ج — connector
  jim: [
    { arabic: "جَنَّةٌ", transliteration: "jannah", meaning: "Cennet",      position: "initial", verseRef: "2:25"  },
    { arabic: "سَجَدَ",  transliteration: "sajada", meaning: "Secde etti",  position: "medial",  verseRef: "3:43"  },
    { arabic: "حَجٌّ",   transliteration: "ḥajj",   meaning: "Hac",         position: "final",   verseRef: "2:197" },
  ],
  // ح — connector; dikkat: ر bağlanmaz → الرحمن'de ح initial'dir, medial değil
  ha: [
    { arabic: "حَقٌّ",     transliteration: "ḥaqq",    meaning: "Hak",   position: "initial", verseRef: "2:26" },
    { arabic: "سَحَابٌ",   transliteration: "saḥāb",   meaning: "Bulut", position: "medial",  verseRef: "2:19" },
    { arabic: "سَبَّحَ",   transliteration: "sabbaḥa", meaning: "Tesbih etti", position: "final", verseRef: "57:1" },
  ],
  // خ — connector
  kha: [
    { arabic: "خَلَقَ",  transliteration: "khalaqa", meaning: "Yarattı",   position: "initial", verseRef: "2:21"  },
    { arabic: "نَخِيلٌ", transliteration: "nakhīl",  meaning: "Hurmalık",  position: "medial",  verseRef: "13:4"  },
    { arabic: "نَسَخَ",  transliteration: "nasakha", meaning: "Neshetti",  position: "final",   verseRef: "2:106" },
  ],
  // د — bağlanmaz; isolated: kelime başında / final: connector → د
  dal: [
    { arabic: "دِينِ", transliteration: "dīn",  meaning: "Din",      position: "isolated", verseRef: "1:4" },
    { arabic: "هُدًى", transliteration: "hudā", meaning: "Hidayet",  position: "final",    verseRef: "2:2" },
  ],
  // ذ — bağlanmaz
  dhal: [
    { arabic: "ذَٰلِكَ", transliteration: "dhālika", meaning: "İşte bu", position: "isolated", verseRef: "2:2"  },
    { arabic: "هَٰذَا",  transliteration: "hādhā",   meaning: "Bu",      position: "final",    verseRef: "2:35" },
  ],
  // ر — bağlanmaz
  ra: [
    { arabic: "رَبِّ",  transliteration: "rabb",  meaning: "Rab",    position: "isolated", verseRef: "1:2"  },
    { arabic: "خَيْرٌ", transliteration: "khayr", meaning: "Hayır",  position: "final",    verseRef: "2:54" },
  ],
  // ز — bağlanmaz
  zay: [
    { arabic: "زَكَوٰةَ", transliteration: "zakāh",  meaning: "Zekat",  position: "isolated", verseRef: "2:43"  },
    { arabic: "عَزِيزٌ",  transliteration: "ʿazīz",  meaning: "Güçlü",  position: "final",    verseRef: "2:129" },
  ],
  // س — connector
  sin: [
    { arabic: "سَمِيعٌ",   transliteration: "samīʿ",  meaning: "İşiten", position: "initial", verseRef: "2:137" },
    { arabic: "إِنْسَانٌ", transliteration: "insān",  meaning: "İnsan",  position: "medial",  verseRef: "95:4"  },
    { arabic: "شَمْسٌ",    transliteration: "shams",  meaning: "Güneş",  position: "final",   verseRef: "91:1"  },
  ],
  // ش — connector
  shin: [
    { arabic: "شَيْءٍ",   transliteration: "shayʾ",   meaning: "Şey",     position: "initial", verseRef: "2:20"  },
    { arabic: "بَشِيرٌ",  transliteration: "bashīr",  meaning: "Müjdeci", position: "medial",  verseRef: "2:119" },
    { arabic: "قُرَيْشٌ", transliteration: "Quraysh", meaning: "Kureyş",  position: "final",   verseRef: "106:1" },
  ],
  // ص — connector
  sad: [
    { arabic: "صَلَوٰةَ",   transliteration: "ṣalāh",     meaning: "Namaz",       position: "initial", verseRef: "2:3"   },
    { arabic: "ٱلصِّرَٰطَ", transliteration: "aṣ-ṣirāṭ",  meaning: "Yol",         position: "medial",  verseRef: "1:6"   },
    { arabic: "حَرِيصٌ",    transliteration: "ḥarīṣ",     meaning: "Çok isteyen", position: "final",   verseRef: "9:128" },
  ],
  // ض — connector
  dad: [
    { arabic: "ضَرَبَ",        transliteration: "ḍaraba",     meaning: "Vurdu",       position: "initial", verseRef: "2:26" },
    { arabic: "ٱلضَّآلِّينَ", transliteration: "aḍ-ḍāllīn",  meaning: "Sapıtanlar",  position: "medial",  verseRef: "1:7"  },
    { arabic: "نَقَضَ",        transliteration: "naqaḍa",     meaning: "Bozdu",       position: "final",   verseRef: "2:27" },
  ],
  // ط — connector
  taa: [
    { arabic: "طَيِّبًا",      transliteration: "ṭayyib",       meaning: "Helal/Hoş", position: "initial", verseRef: "2:57"  },
    { arabic: "ٱلطَّيِّبَٰتِ", transliteration: "aṭ-ṭayyibāt", meaning: "Temizler",  position: "medial",  verseRef: "2:168" },
    { arabic: "بَسَطَ",        transliteration: "basaṭa",       meaning: "Uzattı",    position: "final",   verseRef: "2:245" },
  ],
  // ظ — connector
  dhaa: [
    { arabic: "ظَٰلِمِينَ", transliteration: "ẓālimīn", meaning: "Zalimler",   position: "initial", verseRef: "2:35"  },
    { arabic: "عَظِيمٌ",   transliteration: "ʿaẓīm",   meaning: "Büyük",      position: "medial",  verseRef: "2:49"  },
    { arabic: "حَفِيظٌ",   transliteration: "ḥafīẓ",   meaning: "Koruyucu",   position: "final",   verseRef: "11:57" },
  ],
  // ع — connector
  ayn: [
    { arabic: "عَٰلَمِينَ", transliteration: "ʿālamīn", meaning: "Alemler", position: "initial", verseRef: "1:2"  },
    { arabic: "نِعْمَةٌ",   transliteration: "niʿmah",  meaning: "Nimet",   position: "medial",  verseRef: "2:211"},
    { arabic: "جَمِيعٌ",   transliteration: "jamīʿ",   meaning: "Hepsi",   position: "final",   verseRef: "2:29" },
  ],
  // غ — connector
  ghayn: [
    { arabic: "غَيْرِ",    transliteration: "ghayri",   meaning: "Başka",             position: "initial", verseRef: "1:7"   },
    { arabic: "مَغْضُوبِ", transliteration: "maghḍūb",  meaning: "Gazaba uğramış",    position: "medial",  verseRef: "1:7"   },
    { arabic: "مَبْلَغٌ",  transliteration: "mablagha", meaning: "Ulaşma noktası",    position: "final",   verseRef: "18:60" },
  ],
  // ف — connector; dikkat: فِيهَا'da ف initial'dir (kelime başı), medial değil
  fa: [
    { arabic: "فَاطِرِ",    transliteration: "fāṭir",    meaning: "Yaratan",    position: "initial", verseRef: "12:101" },
    { arabic: "مُفْلِحُونَ", transliteration: "mufliḥūn", meaning: "Kurtulanlar", position: "medial", verseRef: "2:5"    },
    { arabic: "كَشَفَ",     transliteration: "kashafa",  meaning: "Kaldırdı",   position: "final",   verseRef: "7:134"  },
  ],
  // ق — connector
  qaf: [
    { arabic: "قُلْ",       transliteration: "qul",      meaning: "De ki",          position: "initial", verseRef: "112:1" },
    { arabic: "مُتَّقِينَ", transliteration: "muttaqīn", meaning: "Takva sahipleri", position: "medial", verseRef: "2:2"   },
    { arabic: "حَقٌّ",      transliteration: "ḥaqq",     meaning: "Hak",            position: "final",   verseRef: "2:26"  },
  ],
  // ك — connector
  kaf: [
    { arabic: "كِتَابٌ", transliteration: "kitāb",  meaning: "Kitap",    position: "initial", verseRef: "2:2"  },
    { arabic: "شَكَرَ",  transliteration: "shakara", meaning: "Şükretti", position: "medial",  verseRef: "2:52" },
    { arabic: "مَلِكٌ",  transliteration: "malik",  meaning: "Kral",     position: "final",   verseRef: "1:4"  },
  ],
  // ل — connector
  lam: [
    { arabic: "لِلَّهِ", transliteration: "lillāhi", meaning: "Allah'a", position: "initial", verseRef: "1:2"   },
    { arabic: "عَلِيمٌ", transliteration: "ʿalīm",   meaning: "Bilen",   position: "medial",  verseRef: "2:29"  },
    { arabic: "قُلْ",    transliteration: "qul",     meaning: "De ki",   position: "final",   verseRef: "112:1" },
  ],
  // م — connector
  mim: [
    { arabic: "مَٰلِكِ",    transliteration: "mālik",   meaning: "Sahibi",    position: "initial", verseRef: "1:4"  },
    { arabic: "حِكْمَةٌ",   transliteration: "ḥikma",   meaning: "Hikmet",    position: "medial",  verseRef: "2:129"},
    { arabic: "مُسْتَقِيمَ", transliteration: "mustaqīm", meaning: "Doğru yol", position: "final",  verseRef: "1:6"  },
  ],
  // ن — connector
  nun: [
    { arabic: "نَعْبُدُ", transliteration: "naʿbudu", meaning: "İbadet ederiz", position: "initial", verseRef: "1:5" },
    { arabic: "مِنَّا",   transliteration: "minnā",   meaning: "Bizden",        position: "medial",  verseRef: "2:32"},
    { arabic: "مُؤْمِنٌ", transliteration: "muʾmin",  meaning: "Mümin",         position: "final",   verseRef: "2:8" },
  ],
  // ه — connector
  haa: [
    { arabic: "هُوَ",     transliteration: "huwa",     meaning: "O",          position: "initial", verseRef: "112:1" },
    { arabic: "جَهَنَّمُ", transliteration: "jahannam", meaning: "Cehennem",   position: "medial",  verseRef: "2:206" },
    { arabic: "ٱللَّهِ",  transliteration: "Allāhi",   meaning: "Allah'ın",   position: "final",   verseRef: "1:1"   },
  ],
  // و — bağlanmaz; isolated: kelime başında / final: connector → و
  waw: [
    { arabic: "وَلَا",   transliteration: "walā",   meaning: "Ve de",   position: "isolated", verseRef: "1:7"   },
    { arabic: "تَقْوَى", transliteration: "taqwā",  meaning: "Takva",   position: "final",    verseRef: "2:197" },
  ],
  // ي — connector
  ya: [
    { arabic: "يَوْمِ",  transliteration: "yawm",   meaning: "Günü",       position: "initial", verseRef: "1:4"   },
    { arabic: "رَحِيمٌ", transliteration: "raḥīm",  meaning: "Merhametli", position: "medial",  verseRef: "1:1"   },
    { arabic: "وَلِيٌّ", transliteration: "walī",   meaning: "Dost",       position: "final",   verseRef: "2:257" },
  ],
};
