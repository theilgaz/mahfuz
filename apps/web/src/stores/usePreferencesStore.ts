import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "normal" | "wordByWord" | "mushaf";
export type Theme = "light" | "sepia" | "dark" | "dimmed";
export type ColorPaletteId = "vivid" | "pastel" | "earth" | "ocean";

export type FontGroup = "classic" | "modern" | "decorative";

export interface ArabicFont {
  id: string;
  name: string;
  family: string;
  source: "local" | "google";
  googleUrl?: string;
  group: FontGroup;
  desc: string;
}

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  colors: string[];
}

export const FONT_GROUPS: { id: FontGroup; label: string }[] = [
  { id: "classic", label: "Klasik & Mushaf" },
  { id: "modern", label: "Modern & Temiz" },
  { id: "decorative", label: "Hat & Dekoratif" },
];

export const ARABIC_FONTS: ArabicFont[] = [
  // Klasik & Mushaf
  {
    id: "uthmani-hafs",
    name: "Uthmani Hafs",
    family: '"KFGQPC Uthmani Hafs"',
    source: "local",
    group: "classic",
    desc: "Mushaf geleneğine sadık dijital bir hat. Tecvid renkleri ve hareke desteğiyle zenginleştirilmiş.",
  },
  {
    id: "scheherazade-new",
    name: "Scheherazade New",
    family: '"Scheherazade New"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",
    group: "classic",
    desc: "Nesih geleneğinden beslenen zarif bir tasarım. Uzun tilavetlerde göze huzur verir.",
  },
  {
    id: "amiri",
    name: "Amiri",
    family: '"Amiri"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap",
    group: "classic",
    desc: "Mısır Bulak matbaasının ruhunu taşıyan klasik bir Nesih yorumu. Asalet ve sadelik bir arada.",
  },
  // Modern & Temiz
  {
    id: "noto-naskh-arabic",
    name: "Noto Naskh Arabic",
    family: '"Noto Naskh Arabic"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap",
    group: "modern",
    desc: "Dünya dillerini kucaklayan geniş bir ailenin Arapça üyesi. Berrak ve tutarlı bir okuma deneyimi sunar.",
  },
  {
    id: "rubik",
    name: "Rubik",
    family: '"Rubik"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
    group: "modern",
    desc: "Yumuşak hatlarıyla göze dost, çağdaş bir tasarım. Ekranda ferah ve akıcı.",
  },
  {
    id: "zain",
    name: "Zain",
    family: '"Zain"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Zain:wght@300;400;700;800&display=swap",
    group: "modern",
    desc: "Sadeliğin zarafete dönüştüğü ince bir çizgi. Dijital okumalar için göz yormayan bir tercih.",
  },
  {
    id: "reem-kufi",
    name: "Reem Kufi",
    family: '"Reem Kufi"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap",
    group: "modern",
    desc: "Kûfi geleneğini çağdaş çizgilerle yorumlayan güçlü bir karakter. Başlıklarda etkileyici.",
  },
  // Hat & Dekoratif
  {
    id: "playpen-sans-arabic",
    name: "Playpen Sans Arabic",
    family: '"Playpen Sans Arabic"',
    source: "google",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Playpen+Sans+Arabic:wght@400;500;600;700&display=swap",
    group: "decorative",
    desc: "El yazısının sıcaklığını dijitale taşıyan samimi bir hat. Günlük okumaları keyifli kılar.",
  },
];

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "pastel",
    name: "\u0632\u0647\u0631\u064A\u0651 \u2022 Zarif",
    colors: [
      "#e8a435", "#d45d5d", "#4db89a", "#9b6dcc",
      "#e07840", "#5b9ec9", "#d46a8e", "#6db85e",
    ],
  },
  {
    id: "ocean",
    name: "\u0628\u064E\u0631\u0642 \u2022 I\u015f\u0131k",
    colors: [
      "#e6197e", "#06b44e", "#2ba5dd", "#e8590c",
      "#9333ea", "#ca9215", "#0694a2", "#d63384",
    ],
  },
  {
    id: "earth",
    name: "\u062C\u064E\u0648\u0647\u064E\u0631 \u2022 Cevher",
    colors: [
      "#3b82f6", "#ef4444", "#10b981", "#8b5cf6",
      "#f59e0b", "#ec4899", "#06b6d4", "#6366f1",
    ],
  },
  {
    id: "vivid",
    name: "\u062D\u0650\u0628\u0631 \u2022 M\u00fcrekkep",
    colors: [
      "#c4265e", "#5c8a18", "#0e7a8a", "#c96510",
      "#6f42c1", "#998a15", "#d94070", "#3e8948",
    ],
  },
];

interface PreferencesState {
  arabicFontId: string;
  viewMode: ViewMode;
  theme: Theme;
  selectedTranslations: string[];
  colorizeWords: boolean;
  colorPaletteId: ColorPaletteId;
  wordTranslationSize: number;
  wordTransliterationSize: number;
  wbwTransliterationFirst: boolean;

  // Per-mode translation/word settings
  normalShowTranslation: boolean;
  normalShowWordHover: boolean;
  wbwShowTranslation: boolean;
  wbwShowWordTranslation: boolean;
  wbwShowWordTransliteration: boolean;

  // Per-mode font sizes
  normalArabicFontSize: number;
  normalTranslationFontSize: number;
  wbwArabicFontSize: number;
  mushafArabicFontSize: number;

  // Tab visibility
  showLearnTab: boolean;
  showMemorizeTab: boolean;

  // Setters
  setArabicFont: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  toggleTranslation: (id: string) => void;
  setSelectedTranslations: (ids: string[]) => void;
  setColorizeWords: (value: boolean) => void;
  setColorPalette: (id: ColorPaletteId) => void;
  setNormalShowTranslation: (value: boolean) => void;
  setNormalShowWordHover: (value: boolean) => void;
  setWbwShowTranslation: (value: boolean) => void;
  setWbwShowWordTranslation: (value: boolean) => void;
  setWbwShowWordTransliteration: (value: boolean) => void;
  setWordTranslationSize: (size: number) => void;
  setWordTransliterationSize: (size: number) => void;
  setWbwTransliterationFirst: (value: boolean) => void;
  setNormalArabicFontSize: (size: number) => void;
  setNormalTranslationFontSize: (size: number) => void;
  setWbwArabicFontSize: (size: number) => void;
  setMushafArabicFontSize: (size: number) => void;
  setShowLearnTab: (v: boolean) => void;
  setShowMemorizeTab: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      arabicFontId: "uthmani-hafs",
      viewMode: "normal",
      theme: "light",
      selectedTranslations: ["diyanet-api"],
      colorizeWords: false,
      colorPaletteId: "pastel",
      wordTranslationSize: 1,
      wordTransliterationSize: 1,
      wbwTransliterationFirst: false,

      // Per-mode translation/word settings
      normalShowTranslation: true,
      normalShowWordHover: true,
      wbwShowTranslation: false,
      wbwShowWordTranslation: true,
      wbwShowWordTransliteration: true,

      // Per-mode font sizes (all default to 1 = 100%)
      normalArabicFontSize: 1,
      normalTranslationFontSize: 1,
      wbwArabicFontSize: 1,
      mushafArabicFontSize: 1,

      // Tab visibility
      showLearnTab: true,
      showMemorizeTab: true,

      setArabicFont: (id) => set({ arabicFontId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setTheme: (theme) => set({ theme }),
      toggleTranslation: (id) =>
        set((state) => {
          const cur = state.selectedTranslations;
          if (cur.includes(id)) {
            if (cur.length <= 1) return state;
            return { selectedTranslations: cur.filter((t) => t !== id) };
          }
          return { selectedTranslations: [...cur, id] };
        }),
      setSelectedTranslations: (ids) => set({ selectedTranslations: ids }),
      setColorizeWords: (value) => set({ colorizeWords: value }),
      setColorPalette: (id) => set({ colorPaletteId: id }),
      setNormalShowTranslation: (value) => set({ normalShowTranslation: value }),
      setNormalShowWordHover: (value) => set({ normalShowWordHover: value }),
      setWbwShowTranslation: (value) => set({ wbwShowTranslation: value }),
      setWbwShowWordTranslation: (value) => set({ wbwShowWordTranslation: value }),
      setWbwShowWordTransliteration: (value) => set({ wbwShowWordTransliteration: value }),
      setWordTranslationSize: (size) => set({ wordTranslationSize: size }),
      setWordTransliterationSize: (size) => set({ wordTransliterationSize: size }),
      setWbwTransliterationFirst: (value) => set({ wbwTransliterationFirst: value }),
      setNormalArabicFontSize: (size) => set({ normalArabicFontSize: size }),
      setNormalTranslationFontSize: (size) => set({ normalTranslationFontSize: size }),
      setWbwArabicFontSize: (size) => set({ wbwArabicFontSize: size }),
      setMushafArabicFontSize: (size) => set({ mushafArabicFontSize: size }),
      setShowLearnTab: (v) => set({ showLearnTab: v }),
      setShowMemorizeTab: (v) => set({ showMemorizeTab: v }),
    }),
    {
      name: "mahfuz-preferences",
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0 || !version) {
          const oldArabic = typeof state.arabicFontSize === "number" ? state.arabicFontSize : 1;
          const oldTranslation = typeof state.translationFontSize === "number" ? state.translationFontSize : 1;
          state.normalArabicFontSize = oldArabic;
          state.normalTranslationFontSize = oldTranslation;
          state.wbwArabicFontSize = oldArabic;
          state.mushafArabicFontSize = oldArabic;
          delete state.arabicFontSize;
          delete state.translationFontSize;
        }
        if ((version ?? 0) < 2) {
          state.translationId = state.translationId ?? "diyanet-api";
        }
        if ((version ?? 0) < 3) {
          const oldId = typeof state.translationId === "string" ? state.translationId : "diyanet-api";
          state.selectedTranslations = [oldId];
          delete state.translationId;
        }
        if ((version ?? 0) < 4) {
          // Migrate global booleans → per-mode
          const oldShowTranslation = state.showTranslation !== false;
          const oldShowWordTranslation = state.showWordTranslation !== false;
          const oldShowWordTransliteration = state.showWordTransliteration !== false;
          state.normalShowTranslation = oldShowTranslation;
          state.normalShowWordHover = true;
          state.wbwShowTranslation = false;
          state.wbwShowWordTranslation = oldShowWordTranslation;
          state.wbwShowWordTransliteration = oldShowWordTransliteration;
          delete state.showTranslation;
          delete state.showWordTranslation;
          delete state.showWordTransliteration;
        }
        if ((version ?? 0) < 5) {
          state.showLearnTab = state.showLearnTab ?? true;
          state.showMemorizeTab = state.showMemorizeTab ?? true;
        }
        return state as PreferencesState;
      },
    },
  ),
);

export function getArabicFont(id: string): ArabicFont {
  return ARABIC_FONTS.find((f) => f.id === id) ?? ARABIC_FONTS[0];
}

export function getColorPalette(id: ColorPaletteId): ColorPalette {
  return COLOR_PALETTES.find((p) => p.id === id) ?? COLOR_PALETTES[0];
}

export function getActiveColors(state: { colorPaletteId: ColorPaletteId }): string[] {
  return getColorPalette(state.colorPaletteId).colors;
}

/** Returns the arabic font size for the current view mode */
export function getArabicFontSizeForMode(state: Pick<PreferencesState, "viewMode" | "normalArabicFontSize" | "wbwArabicFontSize" | "mushafArabicFontSize">): number {
  switch (state.viewMode) {
    case "wordByWord": return state.wbwArabicFontSize;
    case "mushaf": return state.mushafArabicFontSize;
    default: return state.normalArabicFontSize;
  }
}

/** Returns the translation font size (only normal mode has translation) */
export function getTranslationFontSizeForMode(state: Pick<PreferencesState, "viewMode" | "normalTranslationFontSize">): number {
  return state.normalTranslationFontSize;
}
