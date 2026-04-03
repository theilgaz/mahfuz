export interface ArabicLetter {
  id: string;
  arabic: string;
  name: string; // transliterated name
  nameAr: string; // Arabic name
  order: number;
}

export interface LetterExample {
  arabic: string;
  transliteration: string;
  meaning: string;
  verseRef?: string; // "1:1" format
}

/** Letters that do not connect to the following letter (only have isolated & final forms) */
export const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

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
  const pool = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5);
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
  { id: "lam", arabic: "ل", name: "Lem", nameAr: "لَام", order: 23 },
  { id: "mim", arabic: "م", name: "Mim", nameAr: "مِيم", order: 24 },
  { id: "nun", arabic: "ن", name: "Nun", nameAr: "نُون", order: 25 },
  { id: "haa", arabic: "ه", name: "He", nameAr: "هَاء", order: 26 },
  { id: "waw", arabic: "و", name: "Vav", nameAr: "وَاو", order: 27 },
  { id: "ya", arabic: "ي", name: "Ye", nameAr: "يَاء", order: 28 },
];

/** Kuran'dan her harf için örnek kelimeler */
export const LETTER_EXAMPLES: Record<string, LetterExample[]> = {
  alif: [
    { arabic: "ٱللَّهِ", transliteration: "Allāhi", meaning: "Allah'ın", verseRef: "1:1" },
    { arabic: "ٱلْحَمْدُ", transliteration: "al-ḥamdu", meaning: "Hamd", verseRef: "1:2" },
    { arabic: "إِيَّاكَ", transliteration: "iyyāka", meaning: "Sana", verseRef: "1:5" },
  ],
  ba: [
    { arabic: "بِسْمِ", transliteration: "bismi", meaning: "Adıyla", verseRef: "1:1" },
    { arabic: "رَبِّ", transliteration: "rabbi", meaning: "Rabb", verseRef: "1:2" },
    { arabic: "بِٱلْغَيْبِ", transliteration: "bil-ghaybi", meaning: "Gayba", verseRef: "2:3" },
  ],
  ta: [
    { arabic: "تَوَّابٌ", transliteration: "tawwāb", meaning: "Tövbeleri kabul eden", verseRef: "2:37" },
    { arabic: "ٱلتَّوَّابُ", transliteration: "at-tawwābu", meaning: "Tevvab", verseRef: "2:128" },
    { arabic: "تَعْلَمُونَ", transliteration: "taʿlamūn", meaning: "Bilirsiniz", verseRef: "2:31" },
  ],
  tha: [
    { arabic: "مَثَلُ", transliteration: "mathalu", meaning: "Örneği", verseRef: "2:17" },
    { arabic: "ثَمَرَةٍ", transliteration: "thamaratin", meaning: "Meyve", verseRef: "2:25" },
    { arabic: "ثُمَّ", transliteration: "thumma", meaning: "Sonra", verseRef: "2:28" },
  ],
  jim: [
    { arabic: "جَنَّةٌ", transliteration: "jannah", meaning: "Cennet", verseRef: "2:25" },
    { arabic: "جَعَلَ", transliteration: "jaʿala", meaning: "Yarattı", verseRef: "2:22" },
    { arabic: "جَمِيعًا", transliteration: "jamīʿan", meaning: "Hepsi", verseRef: "2:29" },
  ],
  ha: [
    { arabic: "ٱلرَّحْمَٰنِ", transliteration: "ar-raḥmāni", meaning: "Rahman", verseRef: "1:1" },
    { arabic: "ٱلرَّحِيمِ", transliteration: "ar-raḥīmi", meaning: "Rahim", verseRef: "1:1" },
    { arabic: "رَحِيمٌ", transliteration: "raḥīm", meaning: "Merhametli", verseRef: "2:37" },
  ],
  kha: [
    { arabic: "خَلَقَ", transliteration: "khalaqa", meaning: "Yarattı", verseRef: "2:21" },
    { arabic: "خَتَمَ", transliteration: "khatama", meaning: "Mühürledi", verseRef: "2:7" },
    { arabic: "خَيْرٌ", transliteration: "khayr", meaning: "Hayır/İyi", verseRef: "2:54" },
  ],
  dal: [
    { arabic: "دِينِ", transliteration: "dīni", meaning: "Din", verseRef: "1:4" },
    { arabic: "دُعَآءَ", transliteration: "duʿāʾ", meaning: "Dua", verseRef: "2:186" },
    { arabic: "دُنْيَا", transliteration: "dunyā", meaning: "Dünya", verseRef: "2:85" },
  ],
  dhal: [
    { arabic: "ذَٰلِكَ", transliteration: "dhālika", meaning: "İşte bu", verseRef: "2:1" },
    { arabic: "ٱلَّذِينَ", transliteration: "alladhīna", meaning: "O kimseler", verseRef: "1:7" },
    { arabic: "ذِكْرَ", transliteration: "dhikra", meaning: "Zikir", verseRef: "2:152" },
  ],
  ra: [
    { arabic: "ٱلرَّحْمَٰنِ", transliteration: "ar-raḥmān", meaning: "Rahman", verseRef: "1:1" },
    { arabic: "رَبِّ", transliteration: "rabbi", meaning: "Rab", verseRef: "1:2" },
    { arabic: "رَحْمَةً", transliteration: "raḥmatan", meaning: "Rahmet", verseRef: "2:157" },
  ],
  zay: [
    { arabic: "رِزْقًا", transliteration: "rizqan", meaning: "Rızık", verseRef: "2:22" },
    { arabic: "زَيَّنَّا", transliteration: "zayyannā", meaning: "Süsledik", verseRef: "67:5" },
    { arabic: "زَكَٰةَ", transliteration: "zakāh", meaning: "Zekat", verseRef: "2:43" },
  ],
  sin: [
    { arabic: "سَمِيعٌ", transliteration: "samīʿ", meaning: "İşiten", verseRef: "2:137" },
    { arabic: "سَوَآءٌ", transliteration: "sawāʾ", meaning: "Eşit", verseRef: "2:6" },
    { arabic: "سُبْحَٰنَ", transliteration: "subḥāna", meaning: "Tesbih", verseRef: "17:1" },
  ],
  shin: [
    { arabic: "شَيْءٍ", transliteration: "shayʾ", meaning: "Şey", verseRef: "2:20" },
    { arabic: "شَهِيدٌ", transliteration: "shahīd", meaning: "Şahit", verseRef: "2:143" },
    { arabic: "شُكْرًا", transliteration: "shukran", meaning: "Şükür", verseRef: "2:52" },
  ],
  sad: [
    { arabic: "ٱلصِّرَٰطَ", transliteration: "aṣ-ṣirāṭa", meaning: "Yolu", verseRef: "1:6" },
    { arabic: "صَٰدِقِينَ", transliteration: "ṣādiqīn", meaning: "Doğru sözlüler", verseRef: "2:23" },
    { arabic: "صَلَوٰةَ", transliteration: "ṣalāh", meaning: "Namaz", verseRef: "2:3" },
  ],
  dad: [
    { arabic: "ٱلضَّآلِّينَ", transliteration: "aḍ-ḍāllīn", meaning: "Sapıtanlar", verseRef: "1:7" },
    { arabic: "ضَرَبَ", transliteration: "ḍaraba", meaning: "Vurdu/Örnek verdi", verseRef: "2:26" },
    { arabic: "ضَعِيفًا", transliteration: "ḍaʿīf", meaning: "Zayıf", verseRef: "4:28" },
  ],
  taa: [
    { arabic: "طَيِّبًا", transliteration: "ṭayyiban", meaning: "Hoş/Helal", verseRef: "2:57" },
    { arabic: "ٱلطَّيِّبَٰتِ", transliteration: "aṭ-ṭayyibāt", meaning: "Temizler", verseRef: "2:168" },
    { arabic: "طُورِ", transliteration: "ṭūr", meaning: "Tur (dağı)", verseRef: "2:63" },
  ],
  dhaa: [
    { arabic: "ظَٰلِمِينَ", transliteration: "ẓālimīn", meaning: "Zalimler", verseRef: "2:35" },
    { arabic: "ظَنَّ", transliteration: "ẓanna", meaning: "Zannetti", verseRef: "2:46" },
    { arabic: "عَظِيمٌ", transliteration: "ʿaẓīm", meaning: "Büyük", verseRef: "2:49" },
  ],
  ayn: [
    { arabic: "عَٰلَمِينَ", transliteration: "ʿālamīn", meaning: "Alemler", verseRef: "1:2" },
    { arabic: "عَلِيمٌ", transliteration: "ʿalīm", meaning: "Bilen", verseRef: "2:29" },
    { arabic: "عَبَدَ", transliteration: "ʿabada", meaning: "İbadet etti", verseRef: "1:5" },
  ],
  ghayn: [
    { arabic: "غَيْرِ", transliteration: "ghayri", meaning: "Başkasının", verseRef: "1:7" },
    { arabic: "مَغْضُوبِ", transliteration: "maghḍūb", meaning: "Gazaba uğramış", verseRef: "1:7" },
    { arabic: "غَفُورٌ", transliteration: "ghafūr", meaning: "Bağışlayan", verseRef: "2:173" },
  ],
  fa: [
    { arabic: "فَاطِرِ", transliteration: "fāṭir", meaning: "Yaratan", verseRef: "12:101" },
    { arabic: "فِيهَا", transliteration: "fīhā", meaning: "İçinde", verseRef: "2:25" },
    { arabic: "فُرْقَانَ", transliteration: "furqān", meaning: "Furkan", verseRef: "2:53" },
  ],
  qaf: [
    { arabic: "قُلْ", transliteration: "qul", meaning: "De ki", verseRef: "112:1" },
    { arabic: "قِبْلَةً", transliteration: "qiblatan", meaning: "Kıble", verseRef: "2:142" },
    { arabic: "قُرْءَانَ", transliteration: "qurʾān", meaning: "Kuran", verseRef: "2:185" },
  ],
  kaf: [
    { arabic: "كِتَٰبُ", transliteration: "kitāb", meaning: "Kitap", verseRef: "2:2" },
    { arabic: "كُفُّوًا", transliteration: "kufuwan", meaning: "Denk", verseRef: "112:4" },
    { arabic: "كَرِيمٌ", transliteration: "karīm", meaning: "Kerim", verseRef: "27:40" },
  ],
  lam: [
    { arabic: "لِلَّهِ", transliteration: "lillāhi", meaning: "Allah'a", verseRef: "1:2" },
    { arabic: "لَا إِلَٰهَ", transliteration: "lā ilāha", meaning: "İlah yok", verseRef: "2:163" },
    { arabic: "لَيْلَةِ", transliteration: "laylati", meaning: "Geceye", verseRef: "97:1" },
  ],
  mim: [
    { arabic: "مَٰلِكِ", transliteration: "māliki", meaning: "Sahibi", verseRef: "1:4" },
    { arabic: "مُسْتَقِيمَ", transliteration: "mustaqīm", meaning: "Doğru yol", verseRef: "1:6" },
    { arabic: "مُتَّقِينَ", transliteration: "muttaqīn", meaning: "Takva sahipleri", verseRef: "2:2" },
  ],
  nun: [
    { arabic: "نَعْبُدُ", transliteration: "naʿbudu", meaning: "İbadet ederiz", verseRef: "1:5" },
    { arabic: "نَسْتَعِينُ", transliteration: "nastaʿīn", meaning: "Yardım dileriz", verseRef: "1:5" },
    { arabic: "نُورٌ", transliteration: "nūr", meaning: "Nur/Işık", verseRef: "24:35" },
  ],
  haa: [
    { arabic: "هُوَ", transliteration: "huwa", meaning: "O", verseRef: "112:1" },
    { arabic: "هُدًى", transliteration: "hudan", meaning: "Hidayet", verseRef: "2:2" },
    { arabic: "هَٰذَا", transliteration: "hādhā", meaning: "Bu", verseRef: "2:35" },
  ],
  waw: [
    { arabic: "وَلَا", transliteration: "walā", meaning: "Ve ne", verseRef: "1:7" },
    { arabic: "وَرَحْمَةٌ", transliteration: "wa-raḥmah", meaning: "Ve rahmet", verseRef: "2:157" },
    { arabic: "وَٱلْعَصْرِ", transliteration: "wal-ʿaṣr", meaning: "Asra yemin", verseRef: "103:1" },
  ],
  ya: [
    { arabic: "يَوْمِ", transliteration: "yawmi", meaning: "Günü", verseRef: "1:4" },
    { arabic: "إِيَّاكَ", transliteration: "iyyāka", meaning: "Sana", verseRef: "1:5" },
    { arabic: "يُؤْمِنُونَ", transliteration: "yuʾminūn", meaning: "İman ederler", verseRef: "2:3" },
  ],
};
