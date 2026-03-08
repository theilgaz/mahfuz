import type { Stage } from "../../types/learn";
import { ARABIC_ALPHABET } from "./alphabet";

/**
 * Full 14-stage curriculum for learning Quran reading from scratch.
 * Stages 1-3 have full lesson data. Stages 4-14 have placeholder lessons.
 */
export const CURRICULUM: Stage[] = [
  // Stage 1: Letters (Harfler)
  {
    id: 1,
    titleKey: "stages.letters.title",
    descriptionKey: "stages.letters.desc",
    prerequisites: [],
    lessons: [
      {
        id: "s1-l1",
        titleKey: "s1.l1.title", // Elif ailesi
        contentBlocks: [
          { type: "text", data: { key: "s1.l1.intro" } },
          { type: "letter_display", data: { letterId: 1 } },
          { type: "tip", data: { key: "s1.l1.tip" } },
        ],
        exercises: [
          {
            id: "s1-l1-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ا",
            options: [
              { text: "Elif", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Lam", isCorrect: false },
              { text: "Mim", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-1"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l2",
        titleKey: "s1.l2.title", // Be ailesi (ب ت ث)
        contentBlocks: [
          { type: "text", data: { key: "s1.l2.intro" } },
          { type: "letter_display", data: { letterId: 2 } },
          { type: "letter_display", data: { letterId: 3 } },
          { type: "letter_display", data: { letterId: 4 } },
          { type: "tip", data: { key: "s1.l2.tip" } },
        ],
        exercises: [
          {
            id: "s1-l2-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ب",
            options: [
              { text: "Be", isCorrect: true },
              { text: "Te", isCorrect: false },
              { text: "Se", isCorrect: false },
              { text: "Nun", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l2-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ت",
            options: [
              { text: "Te", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Se", isCorrect: false },
              { text: "Ya", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l2-e3",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ث",
            options: [
              { text: "Se", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Te", isCorrect: false },
              { text: "Nun", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l2-e4",
            type: "letter_recognition",
            promptKey: "exercises.findLetter",
            arabicDisplay: "ن",
            options: [
              { text: "Nun", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Te", isCorrect: false },
              { text: "Se", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-2", "letter-3", "letter-4"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l3",
        titleKey: "s1.l3.title", // Cim ailesi (ج ح خ)
        contentBlocks: [
          { type: "text", data: { key: "s1.l3.intro" } },
          { type: "letter_display", data: { letterId: 5 } },
          { type: "letter_display", data: { letterId: 6 } },
          { type: "letter_display", data: { letterId: 7 } },
          { type: "tip", data: { key: "s1.l3.tip" } },
        ],
        exercises: [
          {
            id: "s1-l3-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ج",
            options: [
              { text: "Cim", isCorrect: true },
              { text: "Ha", isCorrect: false },
              { text: "Hı", isCorrect: false },
              { text: "Ayn", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l3-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ح",
            options: [
              { text: "Ha", isCorrect: true },
              { text: "Cim", isCorrect: false },
              { text: "Hı", isCorrect: false },
              { text: "He", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l3-e3",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "خ",
            options: [
              { text: "Hı", isCorrect: true },
              { text: "Cim", isCorrect: false },
              { text: "Ha", isCorrect: false },
              { text: "Ğayn", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-5", "letter-6", "letter-7"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l4",
        titleKey: "s1.l4.title", // Dal ailesi (د ذ) + Ra ailesi (ر ز)
        contentBlocks: [
          { type: "text", data: { key: "s1.l4.intro" } },
          { type: "letter_display", data: { letterId: 8 } },
          { type: "letter_display", data: { letterId: 9 } },
          { type: "letter_display", data: { letterId: 10 } },
          { type: "letter_display", data: { letterId: 11 } },
          { type: "tip", data: { key: "s1.l4.tip" } },
        ],
        exercises: [
          {
            id: "s1-l4-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "د",
            options: [
              { text: "Dal", isCorrect: true },
              { text: "Zel", isCorrect: false },
              { text: "Ra", isCorrect: false },
              { text: "Ze", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l4-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ر",
            options: [
              { text: "Ra", isCorrect: true },
              { text: "Ze", isCorrect: false },
              { text: "Dal", isCorrect: false },
              { text: "Vav", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-8", "letter-9", "letter-10", "letter-11"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l5",
        titleKey: "s1.l5.title", // Sin ailesi (س ش)
        contentBlocks: [
          { type: "text", data: { key: "s1.l5.intro" } },
          { type: "letter_display", data: { letterId: 12 } },
          { type: "letter_display", data: { letterId: 13 } },
          { type: "tip", data: { key: "s1.l5.tip" } },
        ],
        exercises: [
          {
            id: "s1-l5-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "س",
            options: [
              { text: "Sin", isCorrect: true },
              { text: "Şın", isCorrect: false },
              { text: "Sad", isCorrect: false },
              { text: "Ze", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l5-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ش",
            options: [
              { text: "Şın", isCorrect: true },
              { text: "Sin", isCorrect: false },
              { text: "Se", isCorrect: false },
              { text: "Sad", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-12", "letter-13"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l6",
        titleKey: "s1.l6.title", // Sad ailesi (ص ض) + Ta ailesi (ط ظ)
        contentBlocks: [
          { type: "text", data: { key: "s1.l6.intro" } },
          { type: "letter_display", data: { letterId: 14 } },
          { type: "letter_display", data: { letterId: 15 } },
          { type: "letter_display", data: { letterId: 16 } },
          { type: "letter_display", data: { letterId: 17 } },
          { type: "tip", data: { key: "s1.l6.tip" } },
        ],
        exercises: [
          {
            id: "s1-l6-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ص",
            options: [
              { text: "Sad", isCorrect: true },
              { text: "Dad", isCorrect: false },
              { text: "Tı", isCorrect: false },
              { text: "Sin", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l6-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ط",
            options: [
              { text: "Tı", isCorrect: true },
              { text: "Zı", isCorrect: false },
              { text: "Sad", isCorrect: false },
              { text: "Dad", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-14", "letter-15", "letter-16", "letter-17"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l7",
        titleKey: "s1.l7.title", // Ayn ailesi (ع غ) + Fe (ف)
        contentBlocks: [
          { type: "text", data: { key: "s1.l7.intro" } },
          { type: "letter_display", data: { letterId: 18 } },
          { type: "letter_display", data: { letterId: 19 } },
          { type: "letter_display", data: { letterId: 20 } },
          { type: "tip", data: { key: "s1.l7.tip" } },
        ],
        exercises: [
          {
            id: "s1-l7-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ع",
            options: [
              { text: "Ayn", isCorrect: true },
              { text: "Ğayn", isCorrect: false },
              { text: "Fe", isCorrect: false },
              { text: "Ha", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l7-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ف",
            options: [
              { text: "Fe", isCorrect: true },
              { text: "Kaf", isCorrect: false },
              { text: "Ayn", isCorrect: false },
              { text: "Ğayn", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-18", "letter-19", "letter-20"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l8",
        titleKey: "s1.l8.title", // Kaf (ق) + Kef (ك) + Lam (ل) + Mim (م)
        contentBlocks: [
          { type: "text", data: { key: "s1.l8.intro" } },
          { type: "letter_display", data: { letterId: 21 } },
          { type: "letter_display", data: { letterId: 22 } },
          { type: "letter_display", data: { letterId: 23 } },
          { type: "letter_display", data: { letterId: 24 } },
        ],
        exercises: [
          {
            id: "s1-l8-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ق",
            options: [
              { text: "Kaf", isCorrect: true },
              { text: "Kef", isCorrect: false },
              { text: "Fe", isCorrect: false },
              { text: "Lam", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l8-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ل",
            options: [
              { text: "Lam", isCorrect: true },
              { text: "Elif", isCorrect: false },
              { text: "Kef", isCorrect: false },
              { text: "Mim", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-21", "letter-22", "letter-23", "letter-24"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s1-l9",
        titleKey: "s1.l9.title", // Nun (ن) + He (ه) + Vav (و) + Ya (ي)
        contentBlocks: [
          { type: "text", data: { key: "s1.l9.intro" } },
          { type: "letter_display", data: { letterId: 25 } },
          { type: "letter_display", data: { letterId: 26 } },
          { type: "letter_display", data: { letterId: 27 } },
          { type: "letter_display", data: { letterId: 28 } },
          { type: "tip", data: { key: "s1.l9.tip" } },
        ],
        exercises: [
          {
            id: "s1-l9-e1",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ن",
            options: [
              { text: "Nun", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Ya", isCorrect: false },
              { text: "Te", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s1-l9-e2",
            type: "letter_recognition",
            promptKey: "exercises.whichLetter",
            arabicDisplay: "ي",
            options: [
              { text: "Ya", isCorrect: true },
              { text: "Be", isCorrect: false },
              { text: "Nun", isCorrect: false },
              { text: "Te", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["letter-25", "letter-26", "letter-27", "letter-28"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 2: Connecting Forms (Bağlantı)
  {
    id: 2,
    titleKey: "stages.connecting.title",
    descriptionKey: "stages.connecting.desc",
    prerequisites: [1],
    lessons: [
      {
        id: "s2-l1",
        titleKey: "s2.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s2.l1.intro" } },
          { type: "letter_forms", data: { letterId: 2 } },
          { type: "letter_forms", data: { letterId: 5 } },
          { type: "letter_forms", data: { letterId: 12 } },
        ],
        exercises: [
          {
            id: "s2-l1-e1",
            type: "form_match",
            promptKey: "exercises.findInitialForm",
            arabicDisplay: "بـ",
            options: [
              { text: "Be - Başlangıç", isCorrect: true },
              { text: "Be - Orta", isCorrect: false },
              { text: "Be - Son", isCorrect: false },
              { text: "Te - Başlangıç", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["form-initial", "form-medial", "form-final"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s2-l2",
        titleKey: "s2.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s2.l2.intro" } },
          { type: "letter_forms", data: { letterId: 18 } },
          { type: "letter_forms", data: { letterId: 20 } },
          { type: "letter_forms", data: { letterId: 22 } },
        ],
        exercises: [
          {
            id: "s2-l2-e1",
            type: "form_match",
            promptKey: "exercises.identifyForm",
            arabicDisplay: "ـعـ",
            options: [
              { text: "Ayn - Orta", isCorrect: true },
              { text: "Ayn - Son", isCorrect: false },
              { text: "Ğayn - Orta", isCorrect: false },
              { text: "Fe - Orta", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["form-ayn", "form-fa", "form-kaf"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s2-l3",
        titleKey: "s2.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s2.l3.intro" } },
          { type: "letter_forms", data: { letterId: 1 } },
          { type: "letter_forms", data: { letterId: 8 } },
          { type: "letter_forms", data: { letterId: 10 } },
          { type: "letter_forms", data: { letterId: 27 } },
          { type: "tip", data: { key: "s2.l3.tip" } },
        ],
        exercises: [
          {
            id: "s2-l3-e1",
            type: "form_match",
            promptKey: "exercises.whichNonConnecting",
            options: [
              { text: "د ذ ر ز و ا", isCorrect: true },
              { text: "ب ت ث ن", isCorrect: false },
              { text: "ج ح خ", isCorrect: false },
              { text: "ع غ ف", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["non-connector"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s2-l4",
        titleKey: "s2.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s2.l4.intro" } },
          { type: "word_example", data: { arabic: "بِسْمِ", transliteration: "bismi" } },
          { type: "word_example", data: { arabic: "كِتَاب", transliteration: "kitâb" } },
        ],
        exercises: [
          {
            id: "s2-l4-e1",
            type: "form_match",
            promptKey: "exercises.findLetterInWord",
            arabicDisplay: "كِتَاب",
            options: [
              { text: "ك başlangıç + ت orta + ا son + ب son", isCorrect: true },
              { text: "ك bağımsız + ت bağımsız + ا + ب", isCorrect: false },
              { text: "ك orta + ت başlangıç + ا + ب", isCorrect: false },
              { text: "ك son + ت son + ا + ب", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["word-forms"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s2-l5",
        titleKey: "s2.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s2.l5.intro" } },
          { type: "word_example", data: { arabic: "اللَّه", transliteration: "Allâh" } },
          { type: "word_example", data: { arabic: "رَبّ", transliteration: "Rabb" } },
          { type: "word_example", data: { arabic: "نُور", transliteration: "nûr" } },
        ],
        exercises: [
          {
            id: "s2-l5-e1",
            type: "letter_recognition",
            promptKey: "exercises.howManyLetters",
            arabicDisplay: "اللَّه",
            options: [
              { text: "4", isCorrect: true },
              { text: "3", isCorrect: false },
              { text: "5", isCorrect: false },
              { text: "6", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["word-reading-basic"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 3: Fatha / Üstün
  {
    id: 3,
    titleKey: "stages.fatha.title",
    descriptionKey: "stages.fatha.desc",
    prerequisites: [1],
    lessons: [
      {
        id: "s3-l1",
        titleKey: "s3.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l1.intro" } },
          { type: "harakat_table", data: { letterId: 2, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 3, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 4, harakats: ["\u064E"] } },
          { type: "tip", data: { key: "s3.l1.tip" } },
        ],
        exercises: [
          {
            id: "s3-l1-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "بَ",
            options: [
              { text: "be", isCorrect: true },
              { text: "bi", isCorrect: false },
              { text: "bu", isCorrect: false },
              { text: "b", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s3-l1-e2",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "تَ",
            options: [
              { text: "te", isCorrect: true },
              { text: "ti", isCorrect: false },
              { text: "tu", isCorrect: false },
              { text: "se", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-ba", "fatha-ta", "fatha-tha"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l2",
        titleKey: "s3.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l2.intro" } },
          { type: "harakat_table", data: { letterId: 5, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 6, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 7, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 8, harakats: ["\u064E"] } },
        ],
        exercises: [
          {
            id: "s3-l2-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "جَ",
            options: [
              { text: "ce", isCorrect: true },
              { text: "ci", isCorrect: false },
              { text: "cu", isCorrect: false },
              { text: "he", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s3-l2-e2",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "حَ",
            options: [
              { text: "ha", isCorrect: true },
              { text: "hi", isCorrect: false },
              { text: "ce", isCorrect: false },
              { text: "hu", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-jim", "fatha-ha", "fatha-kha", "fatha-dal"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l3",
        titleKey: "s3.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l3.intro" } },
          { type: "harakat_table", data: { letterId: 9, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 10, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 11, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 12, harakats: ["\u064E"] } },
        ],
        exercises: [
          {
            id: "s3-l3-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "رَ",
            options: [
              { text: "ra", isCorrect: true },
              { text: "ri", isCorrect: false },
              { text: "ze", isCorrect: false },
              { text: "ru", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-dhal", "fatha-ra", "fatha-za", "fatha-sin"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l4",
        titleKey: "s3.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l4.intro" } },
          { type: "harakat_table", data: { letterId: 13, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 14, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 15, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 16, harakats: ["\u064E"] } },
        ],
        exercises: [
          {
            id: "s3-l4-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "صَ",
            options: [
              { text: "sa (kalın)", isCorrect: true },
              { text: "se", isCorrect: false },
              { text: "şe", isCorrect: false },
              { text: "da", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-shin", "fatha-sad", "fatha-dad", "fatha-tah"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l5",
        titleKey: "s3.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l5.intro" } },
          { type: "harakat_table", data: { letterId: 17, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 18, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 19, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 20, harakats: ["\u064E"] } },
        ],
        exercises: [
          {
            id: "s3-l5-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "عَ",
            options: [
              { text: "a (ayn)", isCorrect: true },
              { text: "ğa", isCorrect: false },
              { text: "fe", isCorrect: false },
              { text: "he", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-zah", "fatha-ayn", "fatha-ghayn", "fatha-fa"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l6",
        titleKey: "s3.l6.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l6.intro" } },
          { type: "harakat_table", data: { letterId: 21, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 22, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 23, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 24, harakats: ["\u064E"] } },
        ],
        exercises: [
          {
            id: "s3-l6-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "قَ",
            options: [
              { text: "ka (kalın)", isCorrect: true },
              { text: "ke", isCorrect: false },
              { text: "fe", isCorrect: false },
              { text: "le", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-qaf", "fatha-kaf", "fatha-lam", "fatha-mim"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s3-l7",
        titleKey: "s3.l7.title",
        contentBlocks: [
          { type: "text", data: { key: "s3.l7.intro" } },
          { type: "harakat_table", data: { letterId: 25, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 26, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 27, harakats: ["\u064E"] } },
          { type: "harakat_table", data: { letterId: 28, harakats: ["\u064E"] } },
          { type: "word_example", data: { arabic: "كَتَبَ", transliteration: "ketebe", meaning: "yazdı" } },
        ],
        exercises: [
          {
            id: "s3-l7-e1",
            type: "harakat_read",
            promptKey: "exercises.howToRead",
            arabicDisplay: "نَ",
            options: [
              { text: "ne", isCorrect: true },
              { text: "ni", isCorrect: false },
              { text: "nu", isCorrect: false },
              { text: "be", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
          {
            id: "s3-l7-e2",
            type: "word_read",
            promptKey: "exercises.readWord",
            arabicDisplay: "كَتَبَ",
            options: [
              { text: "ketebe", isCorrect: true },
              { text: "kutibu", isCorrect: false },
              { text: "kitâb", isCorrect: false },
              { text: "kutibe", isCorrect: false },
            ],
            sevapPointReward: 5,
          },
        ],
        conceptIds: ["fatha-nun", "fatha-ha2", "fatha-waw", "fatha-ya"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 4: Kasra / Esre
  {
    id: 4,
    titleKey: "stages.kasra.title",
    descriptionKey: "stages.kasra.desc",
    prerequisites: [3],
    lessons: generateHarakatLessons(4, "\u0650", "kasra"),
  },

  // Stage 5: Damma / Ötre
  {
    id: 5,
    titleKey: "stages.damma.title",
    descriptionKey: "stages.damma.desc",
    prerequisites: [4],
    lessons: generateHarakatLessons(5, "\u064F", "damma"),
  },

  // Stage 6: Long Vowels / Uzun Sesli (Med Asli)
  {
    id: 6,
    titleKey: "stages.longVowels.title",
    descriptionKey: "stages.longVowels.desc",
    prerequisites: [5],
    lessons: [
      {
        id: "s6-l1",
        titleKey: "s6.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s6.l1.intro" } },
          { type: "word_example", data: { arabic: "بَا", transliteration: "bā", meaning: "uzun a" } },
          { type: "word_example", data: { arabic: "تَا", transliteration: "tā" } },
          { type: "word_example", data: { arabic: "كَا", transliteration: "kā" } },
          { type: "word_example", data: { arabic: "مَا", transliteration: "mā" } },
          { type: "tip", data: { key: "s6.l1.tip" } },
        ],
        exercises: [
          { id: "s6-l1-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "بَا", options: [{ text: "bā", isCorrect: true }, { text: "ba", isCorrect: false }, { text: "bi", isCorrect: false }, { text: "bū", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l1-e2", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "مَا", options: [{ text: "mā", isCorrect: true }, { text: "ma", isCorrect: false }, { text: "mū", isCorrect: false }, { text: "mī", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l1-e3", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "كَا", options: [{ text: "kā", isCorrect: true }, { text: "ke", isCorrect: false }, { text: "kī", isCorrect: false }, { text: "ku", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["med-alif"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s6-l2",
        titleKey: "s6.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s6.l2.intro" } },
          { type: "word_example", data: { arabic: "بُو", transliteration: "bū", meaning: "uzun u" } },
          { type: "word_example", data: { arabic: "نُو", transliteration: "nū" } },
          { type: "word_example", data: { arabic: "نُور", transliteration: "nūr", meaning: "ışık" } },
          { type: "tip", data: { key: "s6.l2.tip" } },
        ],
        exercises: [
          { id: "s6-l2-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "بُو", options: [{ text: "bū", isCorrect: true }, { text: "bu", isCorrect: false }, { text: "bā", isCorrect: false }, { text: "bī", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l2-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "نُور", options: [{ text: "nūr", isCorrect: true }, { text: "nur", isCorrect: false }, { text: "nār", isCorrect: false }, { text: "nīr", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["med-waw"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s6-l3",
        titleKey: "s6.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s6.l3.intro" } },
          { type: "word_example", data: { arabic: "بِي", transliteration: "bī", meaning: "uzun i" } },
          { type: "word_example", data: { arabic: "فِي", transliteration: "fī", meaning: "içinde" } },
          { type: "word_example", data: { arabic: "دِين", transliteration: "dīn", meaning: "din" } },
          { type: "tip", data: { key: "s6.l3.tip" } },
        ],
        exercises: [
          { id: "s6-l3-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "فِي", options: [{ text: "fī", isCorrect: true }, { text: "fi", isCorrect: false }, { text: "fā", isCorrect: false }, { text: "fū", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l3-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "دِين", options: [{ text: "dīn", isCorrect: true }, { text: "din", isCorrect: false }, { text: "dūn", isCorrect: false }, { text: "dān", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["med-ya"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s6-l4",
        titleKey: "s6.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s6.l4.intro" } },
          { type: "word_example", data: { arabic: "قَالَ", transliteration: "kāle", meaning: "dedi" } },
          { type: "word_example", data: { arabic: "يَقُولُ", transliteration: "yekūlu", meaning: "diyor" } },
          { type: "word_example", data: { arabic: "قِيلَ", transliteration: "kīle", meaning: "denildi" } },
        ],
        exercises: [
          { id: "s6-l4-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "قَالَ", options: [{ text: "kāle", isCorrect: true }, { text: "kale", isCorrect: false }, { text: "kūle", isCorrect: false }, { text: "kīle", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l4-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "يَقُولُ", options: [{ text: "yekūlu", isCorrect: true }, { text: "yekulu", isCorrect: false }, { text: "yekāle", isCorrect: false }, { text: "yekīlu", isCorrect: false }], sevapPointReward: 5 },
          { id: "s6-l4-e3", type: "harakat_read", promptKey: "exercises.whichMedType", arabicDisplay: "نُور", options: [{ text: "Med Vav (ū)", isCorrect: true }, { text: "Med Elif (ā)", isCorrect: false }, { text: "Med Ya (ī)", isCorrect: false }, { text: "Med yok", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["med-combined"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 7: Sukun / Cezm + CVC
  {
    id: 7,
    titleKey: "stages.sukun.title",
    descriptionKey: "stages.sukun.desc",
    prerequisites: [6],
    lessons: [
      {
        id: "s7-l1",
        titleKey: "s7.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s7.l1.intro" } },
          { type: "word_example", data: { arabic: "بْ", transliteration: "b (sessiz)" } },
          { type: "word_example", data: { arabic: "تْ", transliteration: "t (sessiz)" } },
          { type: "tip", data: { key: "s7.l1.tip" } },
        ],
        exercises: [
          { id: "s7-l1-e1", type: "harakat_read", promptKey: "exercises.whatIsSukun", arabicDisplay: "بْ", options: [{ text: "Sessiz b", isCorrect: true }, { text: "be", isCorrect: false }, { text: "bi", isCorrect: false }, { text: "bu", isCorrect: false }], sevapPointReward: 5 },
          { id: "s7-l1-e2", type: "harakat_read", promptKey: "exercises.whatIsSukun", arabicDisplay: "مْ", options: [{ text: "Sessiz m", isCorrect: true }, { text: "me", isCorrect: false }, { text: "mi", isCorrect: false }, { text: "mu", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["sukun-basic"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s7-l2",
        titleKey: "s7.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s7.l2.intro" } },
          { type: "word_example", data: { arabic: "مِنْ", transliteration: "min", meaning: "-den" } },
          { type: "word_example", data: { arabic: "عَنْ", transliteration: "an", meaning: "-den" } },
          { type: "word_example", data: { arabic: "قَدْ", transliteration: "kad", meaning: "gerçekten" } },
        ],
        exercises: [
          { id: "s7-l2-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "مِنْ", options: [{ text: "min", isCorrect: true }, { text: "mine", isCorrect: false }, { text: "mun", isCorrect: false }, { text: "men", isCorrect: false }], sevapPointReward: 5 },
          { id: "s7-l2-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "قَدْ", options: [{ text: "kad", isCorrect: true }, { text: "kade", isCorrect: false }, { text: "kud", isCorrect: false }, { text: "kid", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["sukun-cvc"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s7-l3",
        titleKey: "s7.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s7.l3.intro" } },
          { type: "word_example", data: { arabic: "بِسْمِ", transliteration: "bismi", meaning: "adıyla" } },
          { type: "word_example", data: { arabic: "أَنْعَمْتَ", transliteration: "en'amte", meaning: "nimet verdin" } },
        ],
        exercises: [
          { id: "s7-l3-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "بِسْمِ", options: [{ text: "bismi", isCorrect: true }, { text: "besmi", isCorrect: false }, { text: "bisimi", isCorrect: false }, { text: "busmi", isCorrect: false }], sevapPointReward: 5 },
          { id: "s7-l3-e2", type: "harakat_read", promptKey: "exercises.findSukun", arabicDisplay: "أَنْعَمْتَ", options: [{ text: "ن ve م", isCorrect: true }, { text: "أ ve ت", isCorrect: false }, { text: "ع ve م", isCorrect: false }, { text: "Sadece ن", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["sukun-syllable"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s7-l4",
        titleKey: "s7.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s7.l4.intro" } },
          { type: "word_example", data: { arabic: "يَعْلَمُ", transliteration: "ya'lemu", meaning: "bilir" } },
          { type: "word_example", data: { arabic: "يَخْلُقُ", transliteration: "yahluku", meaning: "yaratır" } },
        ],
        exercises: [
          { id: "s7-l4-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "يَعْلَمُ", options: [{ text: "ya'lemu", isCorrect: true }, { text: "yalemu", isCorrect: false }, { text: "yi'limu", isCorrect: false }, { text: "ya'lamu", isCorrect: false }], sevapPointReward: 5 },
          { id: "s7-l4-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "يَخْلُقُ", options: [{ text: "yahluku", isCorrect: true }, { text: "yehliku", isCorrect: false }, { text: "yahlaku", isCorrect: false }, { text: "yuhliqu", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["sukun-words"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s7-l5",
        titleKey: "s7.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s7.l5.intro" } },
          { type: "word_example", data: { arabic: "الْحَمْدُ", transliteration: "el-hamdu", meaning: "hamd" } },
          { type: "word_example", data: { arabic: "الْعَالَمِينَ", transliteration: "el-ālemīn", meaning: "alemler" } },
        ],
        exercises: [
          { id: "s7-l5-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْحَمْدُ", options: [{ text: "el-hamdu", isCorrect: true }, { text: "el-hemdi", isCorrect: false }, { text: "el-humdu", isCorrect: false }, { text: "el-himda", isCorrect: false }], sevapPointReward: 5 },
          { id: "s7-l5-e2", type: "harakat_read", promptKey: "exercises.countSukun", arabicDisplay: "الْحَمْدُ", options: [{ text: "2 (ل ve م)", isCorrect: true }, { text: "1 (sadece ل)", isCorrect: false }, { text: "3", isCorrect: false }, { text: "0", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["sukun-practice"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 8: Tanwin / Tenvin
  {
    id: 8,
    titleKey: "stages.tanwin.title",
    descriptionKey: "stages.tanwin.desc",
    prerequisites: [7],
    lessons: [
      {
        id: "s8-l1",
        titleKey: "s8.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s8.l1.intro" } },
          { type: "word_example", data: { arabic: "كِتَابًا", transliteration: "kitāben", meaning: "bir kitap" } },
          { type: "word_example", data: { arabic: "عَلِيمًا", transliteration: "alīmen", meaning: "çok bilen" } },
          { type: "tip", data: { key: "s8.l1.tip" } },
        ],
        exercises: [
          { id: "s8-l1-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "كِتَابًا", options: [{ text: "kitāben", isCorrect: true }, { text: "kitāba", isCorrect: false }, { text: "kitābin", isCorrect: false }, { text: "kitābun", isCorrect: false }], sevapPointReward: 5 },
          { id: "s8-l1-e2", type: "harakat_read", promptKey: "exercises.whatTanwin", arabicDisplay: "ـًا", options: [{ text: "Fethaten (-en)", isCorrect: true }, { text: "Kesreten (-in)", isCorrect: false }, { text: "Dammeten (-un)", isCorrect: false }, { text: "Fetha (-e)", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tanwin-fath"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s8-l2",
        titleKey: "s8.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s8.l2.intro" } },
          { type: "word_example", data: { arabic: "كِتَابٍ", transliteration: "kitābin", meaning: "bir kitabın" } },
          { type: "word_example", data: { arabic: "رَحِيمٍ", transliteration: "rahīmin", meaning: "çok merhametlinin" } },
        ],
        exercises: [
          { id: "s8-l2-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "كِتَابٍ", options: [{ text: "kitābin", isCorrect: true }, { text: "kitāben", isCorrect: false }, { text: "kitābun", isCorrect: false }, { text: "kitāb", isCorrect: false }], sevapPointReward: 5 },
          { id: "s8-l2-e2", type: "harakat_read", promptKey: "exercises.whatTanwin", arabicDisplay: "ـٍ", options: [{ text: "Kesreten (-in)", isCorrect: true }, { text: "Fethaten (-en)", isCorrect: false }, { text: "Dammeten (-un)", isCorrect: false }, { text: "Kesra (-i)", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tanwin-kasr"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s8-l3",
        titleKey: "s8.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s8.l3.intro" } },
          { type: "word_example", data: { arabic: "كِتَابٌ", transliteration: "kitābun", meaning: "bir kitap" } },
          { type: "word_example", data: { arabic: "رَسُولٌ", transliteration: "rasūlun", meaning: "bir elçi" } },
        ],
        exercises: [
          { id: "s8-l3-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "كِتَابٌ", options: [{ text: "kitābun", isCorrect: true }, { text: "kitāben", isCorrect: false }, { text: "kitābin", isCorrect: false }, { text: "kitāb", isCorrect: false }], sevapPointReward: 5 },
          { id: "s8-l3-e2", type: "harakat_read", promptKey: "exercises.whatTanwin", arabicDisplay: "ـٌ", options: [{ text: "Dammeten (-un)", isCorrect: true }, { text: "Fethaten (-en)", isCorrect: false }, { text: "Kesreten (-in)", isCorrect: false }, { text: "Damme (-u)", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tanwin-damm"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s8-l4",
        titleKey: "s8.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s8.l4.intro" } },
          { type: "word_example", data: { arabic: "عَذَابًا أَلِيمًا", transliteration: "azāben elīmen" } },
          { type: "word_example", data: { arabic: "قَوْمٍ مُؤْمِنِينَ", transliteration: "kavmin mu'minīn" } },
        ],
        exercises: [
          { id: "s8-l4-e1", type: "harakat_read", promptKey: "exercises.identifyTanwin", arabicDisplay: "عَلِيمٌ", options: [{ text: "Dammeten (-un)", isCorrect: true }, { text: "Fethaten (-en)", isCorrect: false }, { text: "Kesreten (-in)", isCorrect: false }, { text: "Tenvin yok", isCorrect: false }], sevapPointReward: 5 },
          { id: "s8-l4-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "رَحِيمًا", options: [{ text: "rahīmen", isCorrect: true }, { text: "rahīmun", isCorrect: false }, { text: "rahīmin", isCorrect: false }, { text: "rahīm", isCorrect: false }], sevapPointReward: 5 },
          { id: "s8-l4-e3", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "رَسُولٍ", options: [{ text: "rasūlin", isCorrect: true }, { text: "rasūlen", isCorrect: false }, { text: "rasūlun", isCorrect: false }, { text: "rasūl", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tanwin-practice"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 9: Shadda / Şedde
  {
    id: 9,
    titleKey: "stages.shadda.title",
    descriptionKey: "stages.shadda.desc",
    prerequisites: [8],
    lessons: [
      {
        id: "s9-l1",
        titleKey: "s9.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s9.l1.intro" } },
          { type: "word_example", data: { arabic: "رَبّ", transliteration: "Rabb", meaning: "Rab" } },
          { type: "word_example", data: { arabic: "حَقّ", transliteration: "hakk", meaning: "hak/gerçek" } },
          { type: "tip", data: { key: "s9.l1.tip" } },
        ],
        exercises: [
          { id: "s9-l1-e1", type: "harakat_read", promptKey: "exercises.howToRead", arabicDisplay: "رَبّ", options: [{ text: "Rabb (çift b)", isCorrect: true }, { text: "Rab (tek b)", isCorrect: false }, { text: "Rubb", isCorrect: false }, { text: "Ribb", isCorrect: false }], sevapPointReward: 5 },
          { id: "s9-l1-e2", type: "harakat_read", promptKey: "exercises.whatIsShadda", arabicDisplay: "بّ", options: [{ text: "Çift ünsüz (bb)", isCorrect: true }, { text: "Uzun sesli", isCorrect: false }, { text: "Sessiz harf", isCorrect: false }, { text: "Tenvin", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["shadda-basic"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s9-l2",
        titleKey: "s9.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s9.l2.intro" } },
          { type: "word_example", data: { arabic: "رَبَّنَا", transliteration: "Rabbenā", meaning: "Rabbimiz" } },
          { type: "word_example", data: { arabic: "إِنَّ", transliteration: "inne", meaning: "şüphesiz" } },
          { type: "word_example", data: { arabic: "ثُمَّ", transliteration: "summe", meaning: "sonra" } },
        ],
        exercises: [
          { id: "s9-l2-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "رَبَّنَا", options: [{ text: "Rabbenā", isCorrect: true }, { text: "Rabenā", isCorrect: false }, { text: "Rubbunā", isCorrect: false }, { text: "Ribbinā", isCorrect: false }], sevapPointReward: 5 },
          { id: "s9-l2-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "إِنَّ", options: [{ text: "inne", isCorrect: true }, { text: "ine", isCorrect: false }, { text: "unne", isCorrect: false }, { text: "enne", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["shadda-harakat"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s9-l3",
        titleKey: "s9.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s9.l3.intro" } },
          { type: "word_example", data: { arabic: "اللَّهِ", transliteration: "Allāhi", meaning: "Allah'ın" } },
          { type: "word_example", data: { arabic: "الرَّحْمَنِ", transliteration: "er-Rahmāni", meaning: "Rahman'ın" } },
          { type: "word_example", data: { arabic: "الرَّحِيمِ", transliteration: "er-Rahīmi", meaning: "Rahim'in" } },
        ],
        exercises: [
          { id: "s9-l3-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "اللَّهِ", options: [{ text: "Allāhi", isCorrect: true }, { text: "Elāhi", isCorrect: false }, { text: "Allahi", isCorrect: false }, { text: "Alāhi", isCorrect: false }], sevapPointReward: 5 },
          { id: "s9-l3-e2", type: "harakat_read", promptKey: "exercises.findShadda", arabicDisplay: "الرَّحْمَنِ", options: [{ text: "ر harfinde", isCorrect: true }, { text: "ن harfinde", isCorrect: false }, { text: "م harfinde", isCorrect: false }, { text: "Şedde yok", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["shadda-words"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s9-l4",
        titleKey: "s9.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s9.l4.intro" } },
          { type: "word_example", data: { arabic: "الصَّلَاة", transliteration: "es-salāt", meaning: "namaz" } },
          { type: "word_example", data: { arabic: "النَّاس", transliteration: "en-nās", meaning: "insanlar" } },
          { type: "word_example", data: { arabic: "الضَّالِّينَ", transliteration: "ed-dāllīn", meaning: "sapıtanlar" } },
        ],
        exercises: [
          { id: "s9-l4-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الصَّلَاة", options: [{ text: "es-salāt", isCorrect: true }, { text: "el-salāt", isCorrect: false }, { text: "es-sulāt", isCorrect: false }, { text: "es-salīt", isCorrect: false }], sevapPointReward: 5 },
          { id: "s9-l4-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "النَّاس", options: [{ text: "en-nās", isCorrect: true }, { text: "el-nās", isCorrect: false }, { text: "en-nīs", isCorrect: false }, { text: "en-nus", isCorrect: false }], sevapPointReward: 5 },
          { id: "s9-l4-e3", type: "harakat_read", promptKey: "exercises.findShadda", arabicDisplay: "الضَّالِّينَ", options: [{ text: "ض ve ل", isCorrect: true }, { text: "Sadece ض", isCorrect: false }, { text: "Sadece ل", isCorrect: false }, { text: "ن", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["shadda-practice"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 10: Basic Words / Temel Kelimeler
  {
    id: 10,
    titleKey: "stages.basicWords.title",
    descriptionKey: "stages.basicWords.desc",
    prerequisites: [9],
    lessons: generateWordLessons(),
  },

  // Stage 11: Short Surahs / Kısa Sureler
  {
    id: 11,
    titleKey: "stages.shortSurahs.title",
    descriptionKey: "stages.shortSurahs.desc",
    prerequisites: [10],
    lessons: [
      {
        id: "s11-l1",
        titleKey: "s11.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l1.intro" } },
          { type: "word_example", data: { arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", transliteration: "Bismillāhirrahmānirrahīm" } },
          { type: "word_example", data: { arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", transliteration: "El-hamdulillāhi Rabbil-ālemīn" } },
        ],
        exercises: [
          { id: "s11-l1-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "بِسْمِ", options: [{ text: "bismi", isCorrect: true }, { text: "besmi", isCorrect: false }, { text: "busmi", isCorrect: false }, { text: "bisim", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l1-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْحَمْدُ", options: [{ text: "el-hamdu", isCorrect: true }, { text: "el-hemdi", isCorrect: false }, { text: "el-humdi", isCorrect: false }, { text: "el-hamdi", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-fatiha"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l2",
        titleKey: "s11.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l2.intro" } },
          { type: "word_example", data: { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", transliteration: "Kul huvallāhu ehad" } },
          { type: "word_example", data: { arabic: "اللَّهُ الصَّمَدُ", transliteration: "Allāhus-samed" } },
        ],
        exercises: [
          { id: "s11-l2-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "أَحَدٌ", options: [{ text: "ehadun", isCorrect: true }, { text: "ahadin", isCorrect: false }, { text: "uhudun", isCorrect: false }, { text: "ehaden", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l2-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الصَّمَدُ", options: [{ text: "es-samedu", isCorrect: true }, { text: "el-samedu", isCorrect: false }, { text: "es-simadu", isCorrect: false }, { text: "es-samadu", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-ikhlas"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l3",
        titleKey: "s11.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l3.intro" } },
          { type: "word_example", data: { arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", transliteration: "Kul eūzu bi Rabbin-nās" } },
          { type: "word_example", data: { arabic: "مَلِكِ النَّاسِ", transliteration: "Melikin-nās" } },
        ],
        exercises: [
          { id: "s11-l3-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "أَعُوذُ", options: [{ text: "eūzu", isCorrect: true }, { text: "a'uzu", isCorrect: false }, { text: "euzi", isCorrect: false }, { text: "a'ūzi", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l3-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "مَلِكِ", options: [{ text: "meliki", isCorrect: true }, { text: "maliki", isCorrect: false }, { text: "muluku", isCorrect: false }, { text: "miliki", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-nas"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l4",
        titleKey: "s11.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l4.intro" } },
          { type: "word_example", data: { arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", transliteration: "Kul eūzu bi Rabbil-felek" } },
        ],
        exercises: [
          { id: "s11-l4-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْفَلَقِ", options: [{ text: "el-feleki", isCorrect: true }, { text: "el-fuluki", isCorrect: false }, { text: "el-filaki", isCorrect: false }, { text: "el-faleka", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l4-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "حَاسِدٍ", options: [{ text: "hāsidin", isCorrect: true }, { text: "hasidun", isCorrect: false }, { text: "hāsiden", isCorrect: false }, { text: "hāsidun", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-falaq"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l5",
        titleKey: "s11.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l5.intro" } },
          { type: "word_example", data: { arabic: "تَبَّتْ يَدَا أَبِي لَهَبٍ", transliteration: "Tebbet yedā ebī lehebin" } },
        ],
        exercises: [
          { id: "s11-l5-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "تَبَّتْ", options: [{ text: "tebbet", isCorrect: true }, { text: "tebet", isCorrect: false }, { text: "tubbet", isCorrect: false }, { text: "tibbit", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l5-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "لَهَبٍ", options: [{ text: "lehebin", isCorrect: true }, { text: "lahaben", isCorrect: false }, { text: "lehebun", isCorrect: false }, { text: "luhubi", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-lahab"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l6",
        titleKey: "s11.l6.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l6.intro" } },
          { type: "word_example", data: { arabic: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ", transliteration: "İzā cāe nasrullāhi vel-feth" } },
        ],
        exercises: [
          { id: "s11-l6-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "نَصْرُ", options: [{ text: "nasru", isCorrect: true }, { text: "nusru", isCorrect: false }, { text: "nisru", isCorrect: false }, { text: "nasri", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l6-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْفَتْحُ", options: [{ text: "el-fethu", isCorrect: true }, { text: "el-fithu", isCorrect: false }, { text: "el-futhu", isCorrect: false }, { text: "el-fatihu", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-nasr"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l7",
        titleKey: "s11.l7.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l7.intro" } },
          { type: "word_example", data: { arabic: "قُلْ يَا أَيُّهَا الْكَافِرُونَ", transliteration: "Kul yā eyyuhel-kāfirūn" } },
        ],
        exercises: [
          { id: "s11-l7-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْكَافِرُونَ", options: [{ text: "el-kāfirūne", isCorrect: true }, { text: "el-kafirūne", isCorrect: false }, { text: "el-kufirūne", isCorrect: false }, { text: "el-kāfirīne", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l7-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "أَعْبُدُ", options: [{ text: "a'budu", isCorrect: true }, { text: "abudu", isCorrect: false }, { text: "a'bidu", isCorrect: false }, { text: "u'budu", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-kafirun"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s11-l8",
        titleKey: "s11.l8.title",
        contentBlocks: [
          { type: "text", data: { key: "s11.l8.intro" } },
          { type: "word_example", data: { arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", transliteration: "İnnā a'taynākel-kevser" } },
        ],
        exercises: [
          { id: "s11-l8-e1", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "أَعْطَيْنَاكَ", options: [{ text: "a'taynāke", isCorrect: true }, { text: "ataynāke", isCorrect: false }, { text: "a'tīnāke", isCorrect: false }, { text: "u'tīnāke", isCorrect: false }], sevapPointReward: 5 },
          { id: "s11-l8-e2", type: "word_read", promptKey: "exercises.readWord", arabicDisplay: "الْكَوْثَرَ", options: [{ text: "el-kevsere", isCorrect: true }, { text: "el-kuvsere", isCorrect: false }, { text: "el-kavsere", isCorrect: false }, { text: "el-kevsire", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["surah-kevser"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 12: Basic Tajweed / Temel Tecvid
  {
    id: 12,
    titleKey: "stages.basicTajweed.title",
    descriptionKey: "stages.basicTajweed.desc",
    prerequisites: [11],
    lessons: [
      {
        id: "s12-l1",
        titleKey: "s12.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l1.intro" } },
          { type: "word_example", data: { arabic: "قَدْ", transliteration: "kad" } },
          { type: "word_example", data: { arabic: "أُحِيطَ", transliteration: "uhīta" } },
          { type: "tip", data: { key: "s12.l1.tip" } },
        ],
        exercises: [
          { id: "s12-l1-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "قَدْ بَلَغَ", options: [{ text: "Kalkale (د)", isCorrect: true }, { text: "Gunne", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İhfa", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l1-e2", type: "tajweed_identify", promptKey: "exercises.whichQalqala", options: [{ text: "ق ط ب ج د", isCorrect: true }, { text: "م ن و ي ا", isCorrect: false }, { text: "ص ض ط ظ", isCorrect: false }, { text: "ث ذ ظ ش", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-qalqala"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s12-l2",
        titleKey: "s12.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l2.intro" } },
          { type: "word_example", data: { arabic: "إِنَّ", transliteration: "inne" } },
          { type: "word_example", data: { arabic: "مِمَّا", transliteration: "mimmā" } },
          { type: "tip", data: { key: "s12.l2.tip" } },
        ],
        exercises: [
          { id: "s12-l2-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "إِنَّ اللَّهَ", options: [{ text: "Gunne (نّ)", isCorrect: true }, { text: "Kalkale", isCorrect: false }, { text: "İhfa", isCorrect: false }, { text: "İzhar", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l2-e2", type: "tajweed_identify", promptKey: "exercises.whatIsGhunna", options: [{ text: "م ve ن ile şeddeli geniz sesi", isCorrect: true }, { text: "Harfin titreşimi", isCorrect: false }, { text: "Uzun sesli", isCorrect: false }, { text: "Sessiz okuma", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-ghunna"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s12-l3",
        titleKey: "s12.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l3.intro" } },
          { type: "word_example", data: { arabic: "مِنْ يَقُولُ", transliteration: "miy-yekūlu" } },
          { type: "word_example", data: { arabic: "مِنْ وَلِيٍّ", transliteration: "miv-veliyyin" } },
        ],
        exercises: [
          { id: "s12-l3-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ يَقُولُ", options: [{ text: "İdgam (ن → ي)", isCorrect: true }, { text: "İzhar", isCorrect: false }, { text: "İhfa", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l3-e2", type: "tajweed_identify", promptKey: "exercises.idghamLetters", options: [{ text: "ي ر م ل و ن", isCorrect: true }, { text: "ق ط ب ج د", isCorrect: false }, { text: "ت ث ج د ذ", isCorrect: false }, { text: "ص ض ط ظ", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-idgham"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s12-l4",
        titleKey: "s12.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l4.intro" } },
          { type: "word_example", data: { arabic: "الشَّمْسُ", transliteration: "eş-şemsu" } },
          { type: "word_example", data: { arabic: "النَّاسِ", transliteration: "en-nāsi" } },
          { type: "tip", data: { key: "s12.l4.tip" } },
        ],
        exercises: [
          { id: "s12-l4-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "الشَّمْسُ", options: [{ text: "Lam-ı Şemsiyye", isCorrect: true }, { text: "Lam-ı Kameriyye", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İzhar", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l4-e2", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "التَّوْبَة", options: [{ text: "Lam-ı Şemsiyye", isCorrect: true }, { text: "Lam-ı Kameriyye", isCorrect: false }, { text: "Kalkale", isCorrect: false }, { text: "Gunne", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-lam-shamsiyya"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s12-l5",
        titleKey: "s12.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l5.intro" } },
          { type: "word_example", data: { arabic: "الْقَمَر", transliteration: "el-kamer" } },
          { type: "word_example", data: { arabic: "الْكِتَاب", transliteration: "el-kitāb" } },
          { type: "tip", data: { key: "s12.l5.tip" } },
        ],
        exercises: [
          { id: "s12-l5-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "الْقَمَر", options: [{ text: "Lam-ı Kameriyye", isCorrect: true }, { text: "Lam-ı Şemsiyye", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "Kalkale", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l5-e2", type: "tajweed_identify", promptKey: "exercises.shamsOrQamar", arabicDisplay: "الْعَلِيم", options: [{ text: "Kameriyye", isCorrect: true }, { text: "Şemsiyye", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-lam-qamariyya"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s12-l6",
        titleKey: "s12.l6.title",
        contentBlocks: [
          { type: "text", data: { key: "s12.l6.intro" } },
        ],
        exercises: [
          { id: "s12-l6-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ رَبِّهِمْ", options: [{ text: "İdgam (ن → ر)", isCorrect: true }, { text: "İzhar", isCorrect: false }, { text: "İhfa", isCorrect: false }, { text: "Kalkale", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l6-e2", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "الصِّرَاط", options: [{ text: "Lam-ı Şemsiyye", isCorrect: true }, { text: "Lam-ı Kameriyye", isCorrect: false }, { text: "Gunne", isCorrect: false }, { text: "Kalkale", isCorrect: false }], sevapPointReward: 5 },
          { id: "s12-l6-e3", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "أَحَدْ", options: [{ text: "Kalkale (د)", isCorrect: true }, { text: "Gunne", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İhfa", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-practice"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 13: Madd Rules / Med Kuralları
  {
    id: 13,
    titleKey: "stages.maddRules.title",
    descriptionKey: "stages.maddRules.desc",
    prerequisites: [12],
    lessons: [
      {
        id: "s13-l1",
        titleKey: "s13.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s13.l1.intro" } },
          { type: "word_example", data: { arabic: "جَاءَ", transliteration: "cāe" } },
          { type: "word_example", data: { arabic: "سُوءِ", transliteration: "sūi" } },
          { type: "tip", data: { key: "s13.l1.tip" } },
        ],
        exercises: [
          { id: "s13-l1-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "جَاءَ", options: [{ text: "Med-i Muttasıl (4-5 elif)", isCorrect: true }, { text: "Med-i Munfasıl", isCorrect: false }, { text: "Med-i Tabii", isCorrect: false }, { text: "Med-i Ârız", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l1-e2", type: "tajweed_identify", promptKey: "exercises.whatIsMuttasil", options: [{ text: "Med harfi + hemze aynı kelimede", isCorrect: true }, { text: "Med harfi + hemze farklı kelimede", isCorrect: false }, { text: "Med harfi + sukun", isCorrect: false }, { text: "Sadece uzun sesli", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["madd-muttasil"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s13-l2",
        titleKey: "s13.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s13.l2.intro" } },
          { type: "word_example", data: { arabic: "فِي أَنْفُسِهِمْ", transliteration: "fī enfusihim" } },
          { type: "word_example", data: { arabic: "قَالُوا آمَنَّا", transliteration: "kālū āmennā" } },
        ],
        exercises: [
          { id: "s13-l2-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "فِي أَنْفُسِهِمْ", options: [{ text: "Med-i Munfasıl (2-5 elif)", isCorrect: true }, { text: "Med-i Muttasıl", isCorrect: false }, { text: "Med-i Tabii", isCorrect: false }, { text: "Med-i Lâzım", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l2-e2", type: "tajweed_identify", promptKey: "exercises.muttasilOrMunfasil", arabicDisplay: "سُوءِ", options: [{ text: "Muttasıl (aynı kelime)", isCorrect: true }, { text: "Munfasıl (farklı kelime)", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["madd-munfasil"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s13-l3",
        titleKey: "s13.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s13.l3.intro" } },
          { type: "word_example", data: { arabic: "الْعَالَمِينْ", transliteration: "el-ālemīn (vakıfta)" } },
          { type: "word_example", data: { arabic: "نَسْتَعِينْ", transliteration: "nesteīn (vakıfta)" } },
          { type: "tip", data: { key: "s13.l3.tip" } },
        ],
        exercises: [
          { id: "s13-l3-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "الرَّحِيمْ (vakıf)", options: [{ text: "Med-i Ârız (2-4-6 elif)", isCorrect: true }, { text: "Med-i Muttasıl", isCorrect: false }, { text: "Med-i Tabii", isCorrect: false }, { text: "Med-i Lâzım", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l3-e2", type: "tajweed_identify", promptKey: "exercises.whatIsArid", options: [{ text: "Vakıfla oluşan arızî sukun", isCorrect: true }, { text: "Kelime ortasındaki sukun", isCorrect: false }, { text: "Hemze ile oluşan med", isCorrect: false }, { text: "Şeddeli med", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["madd-arid"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s13-l4",
        titleKey: "s13.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s13.l4.intro" } },
          { type: "word_example", data: { arabic: "الضَّالِّينَ", transliteration: "ed-dāllīne" } },
          { type: "word_example", data: { arabic: "الْحَاقَّة", transliteration: "el-hākkatu" } },
          { type: "tip", data: { key: "s13.l4.tip" } },
        ],
        exercises: [
          { id: "s13-l4-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "الضَّالِّينَ", options: [{ text: "Med-i Lâzım (6 elif)", isCorrect: true }, { text: "Med-i Ârız", isCorrect: false }, { text: "Med-i Muttasıl", isCorrect: false }, { text: "Med-i Tabii", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l4-e2", type: "tajweed_identify", promptKey: "exercises.whatIsLazim", options: [{ text: "Med harfinden sonra aslî sukun/şedde", isCorrect: true }, { text: "Vakıfta oluşan sukun", isCorrect: false }, { text: "Hemze ile oluşan med", isCorrect: false }, { text: "Kısa med", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["madd-lazim"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s13-l5",
        titleKey: "s13.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s13.l5.intro" } },
        ],
        exercises: [
          { id: "s13-l5-e1", type: "tajweed_identify", promptKey: "exercises.identifyMaddType", arabicDisplay: "جَاءَ", options: [{ text: "Muttasıl", isCorrect: true }, { text: "Munfasıl", isCorrect: false }, { text: "Ârız", isCorrect: false }, { text: "Lâzım", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l5-e2", type: "tajweed_identify", promptKey: "exercises.identifyMaddType", arabicDisplay: "فِي أَمْرِ", options: [{ text: "Munfasıl", isCorrect: true }, { text: "Muttasıl", isCorrect: false }, { text: "Ârız", isCorrect: false }, { text: "Lâzım", isCorrect: false }], sevapPointReward: 5 },
          { id: "s13-l5-e3", type: "tajweed_identify", promptKey: "exercises.identifyMaddType", arabicDisplay: "الضَّالِّينَ", options: [{ text: "Lâzım", isCorrect: true }, { text: "Ârız", isCorrect: false }, { text: "Muttasıl", isCorrect: false }, { text: "Munfasıl", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["madd-practice"],
        sevapPointOnComplete: 20,
      },
    ],
  },

  // Stage 14: Advanced Tajweed / İleri Tecvid
  {
    id: 14,
    titleKey: "stages.advancedTajweed.title",
    descriptionKey: "stages.advancedTajweed.desc",
    prerequisites: [13],
    lessons: [
      {
        id: "s14-l1",
        titleKey: "s14.l1.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l1.intro" } },
          { type: "word_example", data: { arabic: "مِنْ تَحْتِهَا", transliteration: "min tahtihā" } },
          { type: "word_example", data: { arabic: "أَنْزَلْنَا", transliteration: "enzelnā" } },
          { type: "tip", data: { key: "s14.l1.tip" } },
        ],
        exercises: [
          { id: "s14-l1-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ تَحْتِهَا", options: [{ text: "İhfa (ن → ت)", isCorrect: true }, { text: "İzhar", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l1-e2", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "أَنْزَلْنَا", options: [{ text: "İhfa (ن → ز)", isCorrect: true }, { text: "İzhar", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "Kalkale", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-ikhfa"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l2",
        titleKey: "s14.l2.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l2.intro" } },
          { type: "word_example", data: { arabic: "مِنْ بَعْدِ", transliteration: "mim ba'di" } },
          { type: "word_example", data: { arabic: "أَنْبِئْهُمْ", transliteration: "embi'hum" } },
          { type: "tip", data: { key: "s14.l2.tip" } },
        ],
        exercises: [
          { id: "s14-l2-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ بَعْدِ", options: [{ text: "İklab (ن → ب = م)", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İzhar", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l2-e2", type: "tajweed_identify", promptKey: "exercises.whatIsIqlab", options: [{ text: "ن → ب olunca mim'e dönüşür", isCorrect: true }, { text: "ن başka harfe katılır", isCorrect: false }, { text: "ن açıkça okunur", isCorrect: false }, { text: "ن gizlice okunur", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-iqlab"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l3",
        titleKey: "s14.l3.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l3.intro" } },
          { type: "word_example", data: { arabic: "مِنْ عِلْمٍ", transliteration: "min ilmin" } },
          { type: "word_example", data: { arabic: "مَنْ آمَنَ", transliteration: "men āmene" } },
          { type: "tip", data: { key: "s14.l3.tip" } },
        ],
        exercises: [
          { id: "s14-l3-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ عِلْمٍ", options: [{ text: "İzhar (ن → ع)", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l3-e2", type: "tajweed_identify", promptKey: "exercises.izharLetters", options: [{ text: "ء ه ع ح غ خ", isCorrect: true }, { text: "ي ر م ل و ن", isCorrect: false }, { text: "ت ث ج د ذ", isCorrect: false }, { text: "Sadece ب", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-izhar"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l4",
        titleKey: "s14.l4.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l4.intro" } },
          { type: "word_example", data: { arabic: "وَلَا الضَّالِّينَ", transliteration: "veleddāllīn" } },
        ],
        exercises: [
          { id: "s14-l4-e1", type: "tajweed_identify", promptKey: "exercises.identifyNunRule", arabicDisplay: "مِنْ دُونِ", options: [{ text: "İhfa", isCorrect: true }, { text: "İzhar", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l4-e2", type: "tajweed_identify", promptKey: "exercises.identifyNunRule", arabicDisplay: "مِنْ هَادٍ", options: [{ text: "İzhar", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-madd-advanced"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l5",
        titleKey: "s14.l5.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l5.intro" } },
          { type: "word_example", data: { arabic: "رَبِّ", transliteration: "Rabbi (kalın ra)" } },
          { type: "word_example", data: { arabic: "رَحِيم", transliteration: "Rahīm (ince ra)" } },
          { type: "tip", data: { key: "s14.l5.tip" } },
        ],
        exercises: [
          { id: "s14-l5-e1", type: "tajweed_identify", promptKey: "exercises.raThickOrThin", arabicDisplay: "رَبِّ", options: [{ text: "Kalın (tafkhīm)", isCorrect: true }, { text: "İnce (tarkīk)", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l5-e2", type: "tajweed_identify", promptKey: "exercises.raThickOrThin", arabicDisplay: "بِسْمِ رَبِّكَ", options: [{ text: "Kalın (öncesinde kesra ama sonrasında fetha)", isCorrect: true }, { text: "İnce", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-ra-rules"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l6",
        titleKey: "s14.l6.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l6.intro" } },
          { type: "word_example", data: { arabic: "اللَّه", transliteration: "Allāh (kalın lam)" } },
          { type: "word_example", data: { arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillāh (ince lam)" } },
        ],
        exercises: [
          { id: "s14-l6-e1", type: "tajweed_identify", promptKey: "exercises.lamThickOrThin", arabicDisplay: "قَالَ اللَّهُ", options: [{ text: "Kalın (fetha/dammeden sonra)", isCorrect: true }, { text: "İnce", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l6-e2", type: "tajweed_identify", promptKey: "exercises.lamThickOrThin", arabicDisplay: "بِسْمِ اللَّهِ", options: [{ text: "İnce (kesradan sonra)", isCorrect: true }, { text: "Kalın", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-lam-rules"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l7",
        titleKey: "s14.l7.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l7.intro" } },
          { type: "word_example", data: { arabic: "ۚ", transliteration: "Vakf-ı câiz" } },
          { type: "word_example", data: { arabic: "ۖ", transliteration: "Vakf-ı kâfî" } },
          { type: "word_example", data: { arabic: "ۗ", transliteration: "Vakf-ı lâzım" } },
          { type: "tip", data: { key: "s14.l7.tip" } },
        ],
        exercises: [
          { id: "s14-l7-e1", type: "tajweed_identify", promptKey: "exercises.whatIsWaqf", options: [{ text: "Okurken durma kuralları", isCorrect: true }, { text: "Ses uzatma kuralı", isCorrect: false }, { text: "Harf birleştirme kuralı", isCorrect: false }, { text: "Geniz sesi kuralı", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l7-e2", type: "tajweed_identify", promptKey: "exercises.waqfSign", arabicDisplay: "ۚ", options: [{ text: "Vakf-ı câiz (durulabilir)", isCorrect: true }, { text: "Durulmaz", isCorrect: false }, { text: "Mutlaka durulmalı", isCorrect: false }, { text: "Secde işareti", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-waqf"],
        sevapPointOnComplete: 20,
      },
      {
        id: "s14-l8",
        titleKey: "s14.l8.title",
        contentBlocks: [
          { type: "text", data: { key: "s14.l8.intro" } },
        ],
        exercises: [
          { id: "s14-l8-e1", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مِنْ بَعْدِ", options: [{ text: "İklab", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İzhar", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l8-e2", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "قَدْ سَمِعَ", options: [{ text: "Kalkale (د)", isCorrect: true }, { text: "Gunne", isCorrect: false }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l8-e3", type: "tajweed_identify", promptKey: "exercises.identifyNunRule", arabicDisplay: "مَنْ يَعْمَلْ", options: [{ text: "İdgam", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İzhar", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
          { id: "s14-l8-e4", type: "tajweed_identify", promptKey: "exercises.identifyTajweed", arabicDisplay: "مَنْ خَشِيَ", options: [{ text: "İzhar (ن → خ)", isCorrect: true }, { text: "İhfa", isCorrect: false }, { text: "İdgam", isCorrect: false }, { text: "İklab", isCorrect: false }], sevapPointReward: 5 },
        ],
        conceptIds: ["tajweed-complete"],
        sevapPointOnComplete: 20,
      },
    ],
  },
];

/** 50 most common Quranic words grouped into 10 lessons of 5 */
function generateWordLessons() {
  const wordGroups: { arabic: string; transliteration: string; meaning: string }[][] = [
    [
      { arabic: "اللَّه", transliteration: "Allāh", meaning: "Allah" },
      { arabic: "رَبّ", transliteration: "Rabb", meaning: "Rab" },
      { arabic: "كِتَاب", transliteration: "kitāb", meaning: "kitap" },
      { arabic: "عِلْم", transliteration: "ilm", meaning: "ilim" },
      { arabic: "يَوْم", transliteration: "yevm", meaning: "gün" },
    ],
    [
      { arabic: "قَلْب", transliteration: "kalb", meaning: "kalp" },
      { arabic: "أَرْض", transliteration: "ard", meaning: "yer/dünya" },
      { arabic: "سَمَاء", transliteration: "semā'", meaning: "gök" },
      { arabic: "نَار", transliteration: "nār", meaning: "ateş" },
      { arabic: "جَنَّة", transliteration: "cennet", meaning: "cennet" },
    ],
    [
      { arabic: "نَفْس", transliteration: "nefs", meaning: "nefis/can" },
      { arabic: "مَاء", transliteration: "mā'", meaning: "su" },
      { arabic: "حَقّ", transliteration: "hakk", meaning: "hak/gerçek" },
      { arabic: "أَمْر", transliteration: "emr", meaning: "emir/iş" },
      { arabic: "قَوْم", transliteration: "kavm", meaning: "kavim/topluluk" },
    ],
    [
      { arabic: "دِين", transliteration: "dīn", meaning: "din" },
      { arabic: "رَحْمَة", transliteration: "rahmet", meaning: "rahmet" },
      { arabic: "شَيْء", transliteration: "şey'", meaning: "şey" },
      { arabic: "عَبْد", transliteration: "abd", meaning: "kul" },
      { arabic: "مَلَك", transliteration: "melek", meaning: "melek" },
    ],
    [
      { arabic: "صَلَاة", transliteration: "salāt", meaning: "namaz" },
      { arabic: "آيَة", transliteration: "āyet", meaning: "ayet/işaret" },
      { arabic: "نُور", transliteration: "nūr", meaning: "nur/ışık" },
      { arabic: "ذِكْر", transliteration: "zikr", meaning: "zikir/anma" },
      { arabic: "صَبْر", transliteration: "sabr", meaning: "sabır" },
    ],
    [
      { arabic: "تَوْبَة", transliteration: "tevbe", meaning: "tövbe" },
      { arabic: "هُدًى", transliteration: "hüden", meaning: "hidayet" },
      { arabic: "بَاطِل", transliteration: "bātıl", meaning: "batıl" },
      { arabic: "كُفْر", transliteration: "küfr", meaning: "küfür" },
      { arabic: "إِيمَان", transliteration: "īmān", meaning: "iman" },
    ],
    [
      { arabic: "مَوْت", transliteration: "mevt", meaning: "ölüm" },
      { arabic: "حَيَاة", transliteration: "hayāt", meaning: "hayat" },
      { arabic: "رِزْق", transliteration: "rızk", meaning: "rızık" },
      { arabic: "عَذَاب", transliteration: "azāb", meaning: "azap" },
      { arabic: "ثَوَاب", transliteration: "sevāb", meaning: "sevap" },
    ],
    [
      { arabic: "فِتْنَة", transliteration: "fitne", meaning: "fitne/sınav" },
      { arabic: "جِهَاد", transliteration: "cihād", meaning: "cihad" },
      { arabic: "صِرَاط", transliteration: "sırāt", meaning: "yol" },
      { arabic: "مُسْتَقِيم", transliteration: "müstekīm", meaning: "dosdoğru" },
      { arabic: "ظُلْم", transliteration: "zulm", meaning: "zulüm" },
    ],
    [
      { arabic: "شُكْر", transliteration: "şükr", meaning: "şükür" },
      { arabic: "خَيْر", transliteration: "hayr", meaning: "hayır/iyilik" },
      { arabic: "شَرّ", transliteration: "şerr", meaning: "şer/kötülük" },
      { arabic: "عَدْل", transliteration: "adl", meaning: "adalet" },
      { arabic: "رَسُول", transliteration: "rasūl", meaning: "elçi/peygamber" },
    ],
    [
      { arabic: "مُؤْمِن", transliteration: "mü'min", meaning: "mümin" },
      { arabic: "كَافِر", transliteration: "kāfir", meaning: "kafir" },
      { arabic: "مُنَافِق", transliteration: "münāfık", meaning: "münafık" },
      { arabic: "تَقْوَى", transliteration: "takvā", meaning: "takva" },
      { arabic: "سُبْحَان", transliteration: "sübhān", meaning: "şanı yüce" },
    ],
  ];

  return wordGroups.map((words, i) => ({
    id: `s10-l${i + 1}`,
    titleKey: `s10.l${i + 1}.title`,
    contentBlocks: [
      { type: "text" as const, data: { key: `s10.l${i + 1}.intro` } },
      ...words.map((w) => ({
        type: "word_example" as const,
        data: { arabic: w.arabic, transliteration: w.transliteration, meaning: w.meaning },
      })),
    ],
    exercises: words.slice(0, 3).map((w, eIdx) => {
      const wrongs = words
        .filter((o) => o.transliteration !== w.transliteration)
        .slice(0, 3)
        .map((o) => o.transliteration);
      return {
        id: `s10-l${i + 1}-e${eIdx + 1}`,
        type: "word_read" as const,
        promptKey: "exercises.readWord",
        arabicDisplay: w.arabic,
        options: [
          { text: w.transliteration, isCorrect: true },
          { text: wrongs[0] || "?", isCorrect: false },
          { text: wrongs[1] || "?", isCorrect: false },
          { text: wrongs[2] || "?", isCorrect: false },
        ],
        xpReward: 5,
      };
    }),
    conceptIds: [`words-group-${i + 1}`],
    xpOnComplete: 20,
  }));
}

/** Helper to generate harakat lessons for kasra/damma stages (similar to fatha) */
function generateHarakatLessons(stageId: number, harakat: string, name: string) {
  const groups = [
    [2, 3, 4, 5],     // ba, ta, tha, jim
    [6, 7, 8, 9],     // ha, kha, dal, dhal
    [10, 11, 12, 13], // ra, za, sin, shin
    [14, 15, 16, 17], // sad, dad, tah, zah
    [18, 19, 20, 21], // ayn, ghayn, fa, qaf
    [22, 23, 24, 25], // kaf, lam, mim, nun
    [26, 27, 28, 1],  // ha, waw, ya, alif
  ];

  return groups.map((letterIds, i) => {
    // Use first 2 letters in each group for exercises
    const exerciseLetterIds = letterIds.slice(0, 2);
    const exercises = exerciseLetterIds.map((letterId, eIdx) => {
      const letter = ARABIC_ALPHABET.find((l) => l.id === letterId)!;
      const combo = letter.harakatCombinations.find((c) => c.harakat === harakat)!;

      // Build 3 wrong options from nearby letters in the same group (or wrap around)
      const wrongSounds: string[] = [];
      for (const otherId of letterIds) {
        if (otherId === letterId) continue;
        const otherLetter = ARABIC_ALPHABET.find((l) => l.id === otherId)!;
        const otherCombo = otherLetter.harakatCombinations.find((c) => c.harakat === harakat)!;
        if (otherCombo.sound !== combo.sound && !wrongSounds.includes(otherCombo.sound)) {
          wrongSounds.push(otherCombo.sound);
        }
        if (wrongSounds.length >= 3) break;
      }
      // If not enough wrong options from the group, pull from adjacent groups
      if (wrongSounds.length < 3) {
        const allLetterIds = groups.flat();
        for (const otherId of allLetterIds) {
          if (otherId === letterId) continue;
          const otherLetter = ARABIC_ALPHABET.find((l) => l.id === otherId)!;
          const otherCombo = otherLetter.harakatCombinations.find((c) => c.harakat === harakat)!;
          if (otherCombo.sound !== combo.sound && !wrongSounds.includes(otherCombo.sound)) {
            wrongSounds.push(otherCombo.sound);
          }
          if (wrongSounds.length >= 3) break;
        }
      }

      return {
        id: `s${stageId}-l${i + 1}-e${eIdx + 1}`,
        type: "harakat_read" as const,
        promptKey: "exercises.howToRead",
        arabicDisplay: combo.combined,
        options: [
          { text: combo.sound, isCorrect: true },
          { text: wrongSounds[0] || "?", isCorrect: false },
          { text: wrongSounds[1] || "?", isCorrect: false },
          { text: wrongSounds[2] || "?", isCorrect: false },
        ],
        sevapPointReward: 5,
      };
    });

    return {
      id: `s${stageId}-l${i + 1}`,
      titleKey: `s${stageId}.l${i + 1}.title`,
      contentBlocks: [
        { type: "text" as const, data: { key: `s${stageId}.l${i + 1}.intro` } },
        ...letterIds.map((id) => ({
          type: "harakat_table" as const,
          data: { letterId: id, harakats: [harakat] },
        })),
      ],
      exercises,
      conceptIds: letterIds.map((id) => `${name}-${id}`),
      sevapPointOnComplete: 20,
    };
  });
}

/** Get a stage by ID */
export function getStageById(id: number): Stage | undefined {
  return CURRICULUM.find((s) => s.id === id);
}

/** Get a lesson by ID */
export function getLessonById(lessonId: string): { stage: Stage; lesson: (typeof CURRICULUM)[0]["lessons"][0] } | undefined {
  for (const stage of CURRICULUM) {
    const lesson = stage.lessons.find((l) => l.id === lessonId);
    if (lesson) return { stage, lesson };
  }
  return undefined;
}

/** Total number of lessons across all stages */
export const TOTAL_LESSONS = CURRICULUM.reduce((sum, s) => sum + s.lessons.length, 0);
