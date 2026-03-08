// Learn Module Types
export type Makhraj = "throat" | "tongue" | "lips" | "nose" | "chest";
export type DotsPosition = "none" | "above" | "below";
export type ShapeFamily =
  | "alif" | "ba" | "jim" | "dal" | "ra"
  | "sin" | "sad" | "ta" | "ayn" | "fa"
  | "qaf" | "kaf" | "lam" | "mim" | "nun"
  | "ha" | "waw" | "ya" | "hamza";

export interface HarakatCombination {
  harakat: string;        // "َ" (fatha), "ِ" (kasra), "ُ" (damma)
  combined: string;       // "بَ"
  sound: string;          // "ba"
  audioRef?: AudioRef;
}

export interface ArabicLetter {
  id: number;             // 1-28
  forms: {
    isolated: string;     // "ب"
    initial: string;      // "بـ"
    medial: string;       // "ـبـ"
    final: string;        // "ـب"
    isNonConnector: boolean;
  };
  nameArabic: string;     // "بَاء"
  nameRoman: string;      // "Be"
  sound: string;          // "b"
  makhraj: Makhraj;
  makhrajPoint: string;   // TR description
  shapeFamily: ShapeFamily;
  dotsCount: 0 | 1 | 2 | 3;
  dotsPosition: DotsPosition;
  harakatCombinations: HarakatCombination[];
}

export interface AudioRef {
  verseKey: string;       // "1:1"
  wordPosition: number;   // 1-based
}

export interface Stage {
  id: number;             // 1-14
  titleKey: string;       // i18n key under learn.stages
  descriptionKey: string; // i18n key
  lessons: Lesson[];
  prerequisites: number[];
}

export interface Lesson {
  id: string;             // "s1-l1"
  titleKey: string;       // i18n key
  contentBlocks: ContentBlock[];
  exercises: Exercise[];
  conceptIds: string[];   // SRS tracking concept IDs
  sevapPointOnComplete: number;
}

export type ContentBlock =
  | { type: "text"; data: { key: string } }
  | { type: "letter_display"; data: { letterId: number } }
  | { type: "letter_forms"; data: { letterId: number } }
  | { type: "harakat_table"; data: { letterId: number; harakats: string[] } }
  | { type: "audio_example"; data: { audioRef: AudioRef } }
  | { type: "word_example"; data: { arabic: string; transliteration: string; meaning?: string } }
  | { type: "tip"; data: { key: string } };

export interface Exercise {
  id: string;
  type: ExerciseType;
  promptKey: string;      // i18n key for prompt
  arabicDisplay?: string;
  audioRef?: AudioRef;
  options: ExerciseOption[];
  sevapPointReward: number;
}

export type ExerciseType =
  | "letter_recognition"
  | "sound_match"
  | "form_match"
  | "harakat_read"
  | "word_build"
  | "fill_blank"
  | "word_read"
  | "tajweed_identify";

export interface ExerciseOption {
  text: string;
  isCorrect: boolean;
}

export interface ExerciseAttempt {
  exerciseId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timestamp: number;
}

/** Lesson progress entry stored in IndexedDB */
export interface LessonProgressEntry {
  id: string;             // lessonId
  userId: string;
  stageId: number;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  score: number;          // 0-100
  sevapPointEarned: number;
  completedAt: number;    // epoch ms, 0 if not completed
}

/** Concept mastery entry for simplified SRS */
export interface LearnConceptEntry {
  id: string;             // `${userId}-${conceptId}`
  userId: string;
  conceptId: string;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: 0 | 1 | 2 | 3;  // 0=new, 1=learning, 2=reinforcing, 3=mastered
  nextReviewAt: number;   // epoch ms
}

/** SRS intervals in ms */
export const MASTERY_INTERVALS = {
  0: 60 * 60 * 1000,           // Level 0 → 1 hour
  1: 24 * 60 * 60 * 1000,      // Level 1 → 1 day
  2: 7 * 24 * 60 * 60 * 1000,  // Level 2 → 7 days
  3: Infinity,                  // Level 3 → no auto review
} as const;

/** Sevap Point values for learn module */
export const LEARN_SEVAP_POINT_VALUES = {
  correctAnswer: 5,
  lessonComplete: 20,
  stageComplete: 100,
  perfectMultiplier: 2,
} as const;

// ─── Side Quests ─────────────────────────────────────────

export interface QuestWord {
  id: string;                    // "ba-w1"
  arabic: string;                // "بِسْمِ"
  transliteration: string;       // "bismi"
  meaning: string;               // "adıyla" (TR)
  meaningEn: string;             // "in the name of"
  audioRef: AudioRef;
  targetLetters: number[];       // which letter id(s) are highlighted
}

export interface SideQuest {
  id: string;                    // "ba-family"
  titleKey: string;              // i18n: "quests.ba.title"
  descriptionKey: string;
  letterIds: number[];           // [2, 3, 4]
  wordBank: QuestWord[];
  exercisesPerSession: number;   // 10
  sevapPointPerCorrect: number;  // 5
}

export interface QuestProgressEntry {
  id: string;                    // "${userId}-${questId}"
  userId: string;
  questId: string;
  wordsCorrect: string[];        // doğru cevaplanan word ID'leri
  totalAttempts: number;
  totalCorrect: number;
  sessionsCompleted: number;
  bestSessionScore: number;      // en iyi skor (%)
  lastPlayedAt: number;
}
