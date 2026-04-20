/**
 * Qaida topic tanimlari.
 * Her topic bir CURRICULUM stage'ine karsilik gelir + sinav konfigurasyonu icerir.
 */

export type GeneratorId =
  | "arabic-to-name"
  | "name-to-arabic"
  | "audio-to-letter"
  | "form-to-letter"
  | "hareke-identify"
  | "hareke-read"
  | "sukun-find"
  | "shadda-find"
  | "med-identify"
  | "tanwin-identify"
  | "word-read"
  | "word-build";

export interface ExamConfig {
  questionCount: number;
  passThreshold: number; // 0-1
  generators: GeneratorId[];
}

export interface QaidaTopic {
  id: string;
  order: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  stageId: number;
  examConfig: ExamConfig;
  /** Sabit link (step 1 -> /alifba, step 10 -> /tajweed) */
  fixedLink?: string;
  /** Sinav redirect (step 1 -> /alifba/exam) */
  examRedirect?: string;
  isMilestone?: boolean;
}

export const QAIDA_TOPICS: QaidaTopic[] = [
  {
    id: "letters",
    order: 1,
    titleKey: "qaidaStep1",
    descriptionKey: "qaidaStep1Desc",
    icon: "\u0627",
    stageId: 1,
    fixedLink: "/alifba",
    examRedirect: "/alifba/exam",
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["arabic-to-name", "name-to-arabic", "audio-to-letter", "form-to-letter"],
    },
  },
  {
    id: "harakat",
    order: 2,
    titleKey: "qaidaStep2",
    descriptionKey: "qaidaStep2Desc",
    icon: "\u0628\u064E",
    stageId: 3,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["hareke-identify", "hareke-read"],
    },
  },
  {
    id: "sukun",
    order: 3,
    titleKey: "qaidaStep3",
    descriptionKey: "qaidaStep3Desc",
    icon: "\u0631\u064E\u0628\u0652",
    stageId: 7,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["sukun-find", "hareke-read"],
    },
  },
  {
    id: "tanwin",
    order: 4,
    titleKey: "qaidaStep4",
    descriptionKey: "qaidaStep4Desc",
    icon: "\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627",
    stageId: 8,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["tanwin-identify", "hareke-read"],
    },
  },
  {
    id: "shadda",
    order: 5,
    titleKey: "qaidaStep5",
    descriptionKey: "qaidaStep5Desc",
    icon: "\u0631\u064E\u0628\u064E\u0651",
    stageId: 9,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["shadda-find", "hareke-read"],
    },
  },
  {
    id: "madd",
    order: 6,
    titleKey: "qaidaStep6",
    descriptionKey: "qaidaStep6Desc",
    icon: "\u0642\u064E\u0627\u0644\u064E",
    stageId: 6,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["med-identify", "hareke-read"],
    },
  },
  {
    id: "connected",
    order: 7,
    titleKey: "qaidaStep7",
    descriptionKey: "qaidaStep7Desc",
    icon: "\u0628\u0650\u0633\u0652\u0645\u0650",
    stageId: 2,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["form-to-letter", "arabic-to-name"],
    },
  },
  {
    id: "words",
    order: 8,
    titleKey: "qaidaStep8",
    descriptionKey: "qaidaStep8Desc",
    icon: "\u0627\u0644\u0644\u0651\u064E\u0647\u0650",
    stageId: 10,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["word-read"],
    },
  },
  {
    id: "surahs",
    order: 9,
    titleKey: "qaidaStep9",
    descriptionKey: "qaidaStep9Desc",
    icon: "\u0627\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629",
    stageId: 11,
    isMilestone: true,
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: ["word-read"],
    },
  },
  {
    id: "tajweed",
    order: 10,
    titleKey: "qaidaStep10",
    descriptionKey: "qaidaStep10Desc",
    icon: "\u062A\u064E\u062C\u0652\u0648\u0650\u064A\u062F",
    stageId: 12,
    fixedLink: "/tajweed",
    examConfig: {
      questionCount: 10,
      passThreshold: 0.8,
      generators: [], // placeholder
    },
  },
];

/** Topic'i order numarasina gore bul (1-based, eski stepId ile uyumlu) */
export function getTopicByOrder(order: number): QaidaTopic | undefined {
  return QAIDA_TOPICS.find((t) => t.order === order);
}

/** Topic'i ID'sine gore bul */
export function getTopicById(id: string): QaidaTopic | undefined {
  return QAIDA_TOPICS.find((t) => t.id === id);
}
