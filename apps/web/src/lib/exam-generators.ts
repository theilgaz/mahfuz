/**
 * Sinav soru uretecleri.
 * Her generator pure function: havuzdan rastgele sorular uretir.
 */

import { ARABIC_ALPHABET } from "@mahfuz/shared/data/learn/alphabet";
import { ARABIC_LETTERS, shuffle, getLetterForms, NON_CONNECTORS, getSimilarDistractors } from "~/lib/kids-constants";
import type { GeneratorId } from "./qaida-topics";

export interface ExamQuestion {
  id: string;
  type: "mcq" | "tap" | "audio-mcq";
  prompt: string;
  arabicDisplay?: string;
  /** Letter ID for audio playback (audio-mcq type) */
  letterId?: string;
  options: { text: string; isCorrect: boolean }[];
  /** Tap question data */
  tapData?: { text: string; targetType: "sukun" | "shadda" };
}

// ── Hareke havuzu (exam/$stepId.tsx'den tasindi) ───────

type HarekeType = "fetha" | "kesra" | "damme";

const HAREKE_LABELS: Record<HarekeType, string> = {
  fetha: "Fetha (Ustun)",
  kesra: "Kesra (Esre)",
  damme: "Damme (Otre)",
};

const HAREKE_SOUNDS: Record<HarekeType, string> = {
  fetha: "e",
  kesra: "i",
  damme: "u",
};

interface HarekeEntry {
  letter: string;
  hareke: HarekeType;
  display: string;
  sound: string;
}

function buildHarekePool(): HarekeEntry[] {
  const pool: HarekeEntry[] = [];
  for (const letter of ARABIC_ALPHABET) {
    for (const combo of letter.harakatCombinations) {
      let type: HarekeType;
      if (combo.harakat === "\u064E") type = "fetha";
      else if (combo.harakat === "\u0650") type = "kesra";
      else if (combo.harakat === "\u064F") type = "damme";
      else continue;
      pool.push({
        letter: letter.forms.isolated,
        hareke: type,
        display: combo.combined,
        sound: combo.sound,
      });
    }
  }
  return pool;
}

// ── Sukun/Shadda kelime havuzu ──────────────────────────

const SUKUN_WORDS = [
  { text: "\u0628\u0650\u0633\u0652\u0645\u0650", tr: "bismi" },      // بِسْمِ
  { text: "\u0645\u0650\u0646\u0652", tr: "min" },                      // مِنْ
  { text: "\u0639\u064E\u0646\u0652", tr: "an" },                       // عَنْ
  { text: "\u0642\u064E\u062F\u0652", tr: "kad" },                      // قَدْ
  { text: "\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F", tr: "ya'lemu" }, // يَعْلَمُ
  { text: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F", tr: "el-hamdu" }, // الْحَمْدُ
  { text: "\u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E", tr: "en'amte" }, // أَنْعَمْتَ
  { text: "\u064A\u064E\u062E\u0652\u0644\u064F\u0642\u064F", tr: "yahluku" }, // يَخْلُقُ
];

const SHADDA_WORDS = [
  { text: "\u0631\u064E\u0628\u064E\u0651", tr: "rabbe" },              // رَبَّ
  { text: "\u0627\u0644\u0644\u0651\u064E\u0647\u0650", tr: "Allahi" }, // اللَّهِ
  { text: "\u0625\u0650\u064A\u064E\u0651\u0627\u0643\u064E", tr: "iyyake" }, // إِيَّاكَ
  { text: "\u0627\u0644\u0636\u064E\u0651\u0627\u0644\u0650\u0651\u064A\u0646\u064E", tr: "ed-dallin" }, // الضَّالِّينَ
  { text: "\u0623\u064E\u062D\u064E\u062F\u064C", tr: "ehadun" },       // (not shadda, will skip)
  { text: "\u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0646\u0650", tr: "er-rahmeni" }, // الرَّحْمَنِ
];

// ── Tenvin havuzu ───────────────────────────────────────

type TanwinType = "fethaten" | "kesreten" | "dammeten";

const TANWIN_LABELS: Record<TanwinType, string> = {
  fethaten: "Fethaten (-en)",
  kesreten: "Kesreten (-in)",
  dammeten: "Dammeten (-un)",
};

const TANWIN_ALL: TanwinType[] = ["fethaten", "kesreten", "dammeten"];

const TANWIN_WORDS: { display: string; type: TanwinType; tr: string }[] = [
  { display: "\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627", type: "fethaten", tr: "kitaben" },
  { display: "\u0639\u064E\u0644\u0650\u064A\u0645\u064B\u0627", type: "fethaten", tr: "alimen" },
  { display: "\u0623\u064E\u062D\u064E\u062F\u064D", type: "kesreten", tr: "ehadin" },
  { display: "\u0639\u064E\u0630\u064E\u0627\u0628\u064D", type: "kesreten", tr: "azabin" },
  { display: "\u0639\u064E\u0644\u0650\u064A\u0645\u064C", type: "dammeten", tr: "alimun" },
  { display: "\u0631\u064E\u062D\u0650\u064A\u0645\u064C", type: "dammeten", tr: "rahimun" },
  { display: "\u0633\u064E\u0645\u0650\u064A\u0639\u064C", type: "dammeten", tr: "semi'un" },
  { display: "\u0628\u064E\u0635\u0650\u064A\u0631\u064C", type: "dammeten", tr: "basirun" },
  { display: "\u0639\u064E\u0638\u0650\u064A\u0645\u064B\u0627", type: "fethaten", tr: "azimen" },
  { display: "\u0623\u064E\u0645\u0652\u0631\u064D", type: "kesreten", tr: "emrin" },
];

// ── Med havuzu ──────────────────────────────────────────

type MedType = "elif" | "vav" | "ya";

const MED_LABELS: Record<MedType, string> = {
  elif: "Med Elif (a)",
  vav: "Med Vav (u)",
  ya: "Med Ya (i)",
};

const MED_ALL: MedType[] = ["elif", "vav", "ya"];

const MED_WORDS: { display: string; type: MedType; tr: string }[] = [
  { display: "\u0642\u064E\u0627\u0644\u064E", type: "elif", tr: "kale" },
  { display: "\u0643\u064E\u0627\u0646\u064E", type: "elif", tr: "kane" },
  { display: "\u0646\u064F\u0648\u0631\u064C", type: "vav", tr: "nurun" },
  { display: "\u064A\u064E\u0642\u064F\u0648\u0644\u064F", type: "vav", tr: "yekulu" },
  { display: "\u0641\u0650\u064A\u0647\u0650", type: "ya", tr: "fihi" },
  { display: "\u0643\u064E\u0628\u0650\u064A\u0631\u064C", type: "ya", tr: "kebirun" },
  { display: "\u0645\u064E\u0627\u0644\u0650\u0643\u0650", type: "elif", tr: "maliki" },
  { display: "\u0639\u064E\u0644\u0650\u064A\u0645\u064C", type: "ya", tr: "alimun" },
];

// ── Generator fonksiyonlari ─────────────────────────────

let _questionCounter = 0;
function nextId(): string {
  return `eq-${++_questionCounter}`;
}

/** Harf goster -> ismini sec */
function generateArabicToName(count: number): ExamQuestion[] {
  const letters = shuffle(ARABIC_LETTERS).slice(0, count);
  return letters.map((l) => {
    const distractors = getSimilarDistractors(l.id, 3);
    return {
      id: nextId(),
      type: "mcq" as const,
      prompt: "Bu harf hangisi?",
      arabicDisplay: l.arabic,
      options: shuffle([
        { text: l.name, isCorrect: true },
        ...distractors.map((d) => ({ text: d.name, isCorrect: false })),
      ]),
    };
  });
}

/** Isim goster -> harfi sec */
function generateNameToArabic(count: number): ExamQuestion[] {
  const letters = shuffle(ARABIC_LETTERS).slice(0, count);
  return letters.map((l) => {
    const distractors = getSimilarDistractors(l.id, 3);
    return {
      id: nextId(),
      type: "mcq" as const,
      prompt: `"${l.name}" harfini bul:`,
      options: shuffle([
        { text: l.arabic, isCorrect: true },
        ...distractors.map((d) => ({ text: d.arabic, isCorrect: false })),
      ]),
    };
  });
}

/** Ses cal -> harfi sec */
function generateAudioToLetter(count: number): ExamQuestion[] {
  const letters = shuffle(ARABIC_LETTERS).slice(0, count);
  return letters.map((l) => {
    const distractors = getSimilarDistractors(l.id, 3);
    return {
      id: nextId(),
      type: "audio-mcq" as const,
      prompt: "Hangi harfin sesi?",
      letterId: l.id,
      options: shuffle([
        { text: l.arabic, isCorrect: true },
        ...distractors.map((d) => ({ text: d.arabic, isCorrect: false })),
      ]),
    };
  });
}

/** Bagli form goster -> harfi sec */
function generateFormToLetter(count: number): ExamQuestion[] {
  const letters = shuffle(ARABIC_LETTERS).slice(0, count);
  return letters.map((l) => {
    const nc = NON_CONNECTORS.has(l.arabic);
    const availableForms = nc ? ["final" as const] : (["initial", "medial", "final"] as const);
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(l.arabic);
    const distractors = getSimilarDistractors(l.id, 3);
    return {
      id: nextId(),
      type: "mcq" as const,
      prompt: `Bu form hangi harfe ait?`,
      arabicDisplay: forms[formType],
      options: shuffle([
        { text: `${l.name} (${l.arabic})`, isCorrect: true },
        ...distractors.map((d) => ({ text: `${d.name} (${d.arabic})`, isCorrect: false })),
      ]),
    };
  });
}

/** Bagli form goster -> harf adini sec */
function generateFormToName(count: number): ExamQuestion[] {
  const letters = shuffle(ARABIC_LETTERS).slice(0, count);
  return letters.map((l) => {
    const nc = NON_CONNECTORS.has(l.arabic);
    const availableForms = nc ? ["final" as const] : (["initial", "medial", "final"] as const);
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(l.arabic);
    const distractors = getSimilarDistractors(l.id, 3);
    return {
      id: nextId(),
      type: "mcq" as const,
      prompt: "Bu harf hangisi?",
      arabicDisplay: forms[formType],
      options: shuffle([
        { text: l.name, isCorrect: true },
        ...distractors.map((d) => ({ text: d.name, isCorrect: false })),
      ]),
    };
  });
}

/** Harekeli harf goster -> hareke adini sec */
function generateHarekeIdentify(count: number): ExamQuestion[] {
  const pool = shuffle(buildHarekePool()).slice(0, count);
  return pool.map((entry) => ({
    id: nextId(),
    type: "mcq" as const,
    prompt: "Bu hareke hangisi?",
    arabicDisplay: entry.display,
    options: shuffle(
      (["fetha", "kesra", "damme"] as HarekeType[]).map((t) => ({
        text: HAREKE_LABELS[t],
        isCorrect: t === entry.hareke,
      })),
    ),
  }));
}

/** Harekeli harf goster -> okunusunu sec */
function generateHarekeRead(count: number): ExamQuestion[] {
  const pool = shuffle(buildHarekePool()).slice(0, count);
  return pool.map((entry) => {
    const letter = ARABIC_ALPHABET.find((a) => a.forms.isolated === entry.letter);
    if (!letter) {
      return {
        id: nextId(),
        type: "mcq" as const,
        prompt: "Bu nasil okunur?",
        arabicDisplay: entry.display,
        options: shuffle([
          { text: entry.sound, isCorrect: true },
          { text: entry.letter + HAREKE_SOUNDS.fetha, isCorrect: false },
          { text: entry.letter + HAREKE_SOUNDS.kesra, isCorrect: false },
          { text: entry.letter + HAREKE_SOUNDS.damme, isCorrect: false },
        ]),
      };
    }
    // Build options from the letter's own combinations
    const correctCombo = letter.harakatCombinations.find((c) => c.combined === entry.display);
    const wrongCombos = letter.harakatCombinations.filter((c) => c.combined !== entry.display);
    return {
      id: nextId(),
      type: "mcq" as const,
      prompt: "Bu nasil okunur?",
      arabicDisplay: entry.display,
      options: shuffle([
        { text: correctCombo?.sound ?? entry.sound, isCorrect: true },
        ...wrongCombos.map((c) => ({ text: c.sound, isCorrect: false })),
      ]),
    };
  });
}

/** Kelimede sukunu bul (tap) */
function generateSukunFind(count: number): ExamQuestion[] {
  return shuffle(SUKUN_WORDS).slice(0, count).map((w) => ({
    id: nextId(),
    type: "tap" as const,
    prompt: "Sukun olan harfi bul:",
    tapData: { text: w.text, targetType: "sukun" as const },
    options: [], // tap type doesn't use options
  }));
}

/** Kelimede seddeyi bul (tap) */
function generateShaddaFind(count: number): ExamQuestion[] {
  return shuffle(SHADDA_WORDS).slice(0, count).map((w) => ({
    id: nextId(),
    type: "tap" as const,
    prompt: "Sedde olan harfi bul:",
    tapData: { text: w.text, targetType: "shadda" as const },
    options: [], // tap type doesn't use options
  }));
}

/** Med harfini tani */
function generateMedIdentify(count: number): ExamQuestion[] {
  return shuffle(MED_WORDS).slice(0, count).map((w) => ({
    id: nextId(),
    type: "mcq" as const,
    prompt: "Bu kelimede hangi med harfi var?",
    arabicDisplay: w.display,
    options: shuffle(
      MED_ALL.map((t) => ({
        text: MED_LABELS[t],
        isCorrect: t === w.type,
      })),
    ),
  }));
}

/** Tenvin turunu sec */
function generateTanwinIdentify(count: number): ExamQuestion[] {
  return shuffle(TANWIN_WORDS).slice(0, count).map((w) => ({
    id: nextId(),
    type: "mcq" as const,
    prompt: "Bu kelimede hangi tenvin var?",
    arabicDisplay: w.display,
    options: shuffle(
      TANWIN_ALL.map((t) => ({
        text: TANWIN_LABELS[t],
        isCorrect: t === w.type,
      })),
    ),
  }));
}

/** Kelime goster -> okunusunu sec */
function generateWordRead(count: number): ExamQuestion[] {
  // Use curriculum exercise data as word pool
  const wordPool = [
    { display: "\u0628\u0650\u0633\u0652\u0645\u0650", correct: "bismi", wrong: ["besmi", "busmi", "bisimi"] },
    { display: "\u0627\u0644\u0644\u0651\u064E\u0647\u0650", correct: "Allahi", wrong: ["Alehi", "Ellihi", "Ullahi"] },
    { display: "\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650", correct: "er-Rahmeni", wrong: ["er-Rehimeni", "er-Rahmani", "er-Ruhemeni"] },
    { display: "\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650", correct: "er-Rahimi", wrong: ["er-Rehimi", "er-Ruhimi", "er-Rahemi"] },
    { display: "\u0645\u064E\u0627\u0644\u0650\u0643\u0650", correct: "Maliki", wrong: ["Meliki", "Muliki", "Mileki"] },
    { display: "\u064A\u064E\u0648\u0652\u0645\u0650", correct: "yevmi", wrong: ["yavmi", "yevme", "yuvmi"] },
    { display: "\u0627\u0644\u062F\u0651\u0650\u064A\u0646\u0650", correct: "ed-dini", wrong: ["ed-duni", "ed-deni", "ed-dayni"] },
    { display: "\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F", correct: "na'budu", wrong: ["ne'bidu", "na'badu", "nu'budu"] },
    { display: "\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F", correct: "nesta'inu", wrong: ["niste'inu", "nesta'anu", "neste'inu"] },
    { display: "\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627", correct: "ihdina", wrong: ["ehdina", "uhdina", "ihdena"] },
    { display: "\u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E", correct: "es-sirate", wrong: ["es-surate", "es-sirata", "es-sarate"] },
    { display: "\u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E", correct: "el-mustekime", wrong: ["el-mustakime", "el-mustekima", "el-mistekime"] },
  ];
  return shuffle(wordPool).slice(0, count).map((w) => ({
    id: nextId(),
    type: "mcq" as const,
    prompt: "Bu kelime nasil okunur?",
    arabicDisplay: w.display,
    options: shuffle([
      { text: w.correct, isCorrect: true },
      ...w.wrong.map((wr) => ({ text: wr, isCorrect: false })),
    ]),
  }));
}

// ── Generator registry ──────────────────────────────────

const GENERATORS: Record<GeneratorId, (count: number) => ExamQuestion[]> = {
  "arabic-to-name": generateArabicToName,
  "name-to-arabic": generateNameToArabic,
  "audio-to-letter": generateAudioToLetter,
  "form-to-letter": generateFormToLetter,
  "form-to-name": generateFormToName,
  "hareke-identify": generateHarekeIdentify,
  "hareke-read": generateHarekeRead,
  "sukun-find": generateSukunFind,
  "shadda-find": generateShaddaFind,
  "med-identify": generateMedIdentify,
  "tanwin-identify": generateTanwinIdentify,
  "word-read": generateWordRead,
  "word-build": generateWordRead, // fallback: word-build uses word-read for now
};

export function getGenerator(id: GeneratorId): (count: number) => ExamQuestion[] {
  return GENERATORS[id];
}
