export type Theme = "light" | "crystal" | "sepia" | "dark" | "dimmed" | "teal" | "black";
export type ViewMode = "normal" | "wordByWord" | "mushaf";

export const THEME_OPTIONS: { value: Theme; color: string; border: string }[] = [
  { value: "light", color: "#ffffff", border: "#d2d2d7" },
  { value: "crystal", color: "#ffffff", border: "#007AFF" },
  { value: "sepia", color: "#f5ead6", border: "#d4b882" },
  { value: "dark", color: "#1a1a1a", border: "#444" },
  { value: "dimmed", color: "#22272e", border: "#444c56" },
  { value: "teal", color: "#1c3f44", border: "#2a5a60" },
  { value: "black", color: "#000000", border: "#333" },
];

export const PREVIEW_SURAH = {
  name: "el-Kevser",
  number: 108,
  uthmani: [
    "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
  ],
  simple: [
    "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
  ],
} as const;

export const BISMILLAH_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
export const BISMILLAH_SIMPLE = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

export const SAMPLE_WORDS_UTHMANI = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];
export const SAMPLE_WORDS_SIMPLE = ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"];

export const SAMPLE_WORD_TRANSLATIONS = [
  "Allah'ın adıyla",
  "Allah",
  "Rahmân",
  "Rahîm",
];

export const SAMPLE_WORD_TRANSLITERATIONS = [
  "bismi",
  "allâhi",
  "ar-rahmâni",
  "ar-rahîmi",
];

// Focus Mode
export type FocusToolType = "none" | "pen" | "highlighter" | "eraser";
export type FocusViewMode = "mushaf" | "flowing";

export const ANNOTATION_COLORS = {
  red: "#dc2626",
  blue: "#2563eb",
  black: "#1a1a1a",
} as const;

export type AnnotationColor = keyof typeof ANNOTATION_COLORS;

export const FOCUS_PEN_DEFAULTS = {
  pen: { width: 2, opacity: 1 },
  highlighter: { width: 12, opacity: 0.35 },
} as const;

export function getSampleData(textType: string) {
  const isUthmani = textType === "uthmani";
  return {
    bismillah: isUthmani ? BISMILLAH_UTHMANI : BISMILLAH_SIMPLE,
    sampleWords: isUthmani ? SAMPLE_WORDS_UTHMANI : SAMPLE_WORDS_SIMPLE,
  };
}

export interface ReadingPreset {
  id: string;
  overrides: {
    theme?: Theme;
    viewMode?: ViewMode;
    arabicFontSize?: number;
    showTranslation?: boolean;
    wbwShowWordTranslation?: boolean;
    wbwShowWordTransliteration?: boolean;
    wbwShowGrammar?: boolean;
    mushafShowTranslation?: boolean;
  };
}

export const READING_PRESETS: ReadingPreset[] = [
  {
    id: "night",
    overrides: { theme: "dark", arabicFontSize: 1.3, showTranslation: false },
  },
  {
    id: "study",
    overrides: { viewMode: "wordByWord", wbwShowWordTranslation: true, wbwShowWordTransliteration: true, wbwShowGrammar: true },
  },
  {
    id: "mushaf",
    overrides: { viewMode: "mushaf", theme: "sepia", showTranslation: false, mushafShowTranslation: false },
  },
  {
    id: "default",
    overrides: { theme: "sepia", viewMode: "normal", arabicFontSize: 1.65, showTranslation: true },
  },
];
