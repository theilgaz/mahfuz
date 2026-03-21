/**
 * COMPAT SHIM — provides the v1 combined store API.
 * Components should gradually migrate to use split stores
 * (useDisplayPrefs, useReadingPrefs, useAppUI) directly.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, ViewMode } from "~/lib/constants";
import type { ColorPaletteId, FontGroup, ArabicFont, ColorPalette } from "~/lib/fonts";
import {
  ARABIC_FONTS,
  COLOR_PALETTES,
  FONT_GROUPS,
  getArabicFont,
  getColorPalette,
} from "~/lib/fonts";

// Re-export types and constants so components importing from this file still work
export type { Theme, ViewMode };
export type { ColorPaletteId, FontGroup, ArabicFont, ColorPalette };
export { ARABIC_FONTS, COLOR_PALETTES, FONT_GROUPS, getArabicFont, getColorPalette };

/** v1-compat: takes { colorPaletteId } object. v2 lib/fonts uses (bool, id). */
export function getActiveColors(state: { colorPaletteId: ColorPaletteId }): string[] {
  return getColorPalette(state.colorPaletteId).colors;
}

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
  normalShowTranslation: boolean;
  normalShowWordHover: boolean;
  normalHoverShowTranslation: boolean;
  normalHoverShowTransliteration: boolean;
  normalHoverTextSize: number;
  wbwShowTranslation: boolean;
  wbwShowWordTranslation: boolean;
  wbwShowWordTransliteration: boolean;
  normalArabicFontSize: number;
  normalTranslationFontSize: number;
  wbwArabicFontSize: number;
  mushafArabicFontSize: number;
  mushafTranslationFontSize: number;
  mushafShowTranslation: boolean;
  mushafTooltipTextSize: number;
  wbwPopupTextSize: number;
  globalFontScale: number;
  textType: "uthmani" | "simple";
  showLearnTab: boolean;
  showMemorizeTab: boolean;
  sidebarCollapsed: boolean;
  hasSeenOnboarding: boolean;

  setArabicFont: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  toggleTranslation: (id: string) => void;
  setSelectedTranslations: (ids: string[]) => void;
  setColorizeWords: (value: boolean) => void;
  setColorPalette: (id: ColorPaletteId) => void;
  setNormalShowTranslation: (value: boolean) => void;
  setNormalShowWordHover: (value: boolean) => void;
  setNormalHoverShowTranslation: (value: boolean) => void;
  setNormalHoverShowTransliteration: (value: boolean) => void;
  setNormalHoverTextSize: (size: number) => void;
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
  setMushafShowTranslation: (value: boolean) => void;
  setMushafTranslationFontSize: (size: number) => void;
  setMushafTooltipTextSize: (size: number) => void;
  setWbwPopupTextSize: (size: number) => void;
  setGlobalFontScale: (scale: number) => void;
  adjustGlobalFontScale: (delta: number) => void;
  setTextType: (t: "uthmani" | "simple") => void;
  setShowLearnTab: (v: boolean) => void;
  setShowMemorizeTab: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setHasSeenOnboarding: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      arabicFontId: "scheherazade-new",
      viewMode: "normal",
      theme: "sepia",
      selectedTranslations: ["omer-celik"],
      colorizeWords: true,
      colorPaletteId: "pastel",
      wordTranslationSize: 1,
      wordTransliterationSize: 1,
      wbwTransliterationFirst: false,
      normalShowTranslation: true,
      normalShowWordHover: true,
      normalHoverShowTranslation: true,
      normalHoverShowTransliteration: true,
      normalHoverTextSize: 1,
      wbwShowTranslation: false,
      wbwShowWordTranslation: true,
      wbwShowWordTransliteration: true,
      normalArabicFontSize: 1.65,
      normalTranslationFontSize: 0.8,
      wbwArabicFontSize: 1.75,
      mushafArabicFontSize: 1.6,
      mushafShowTranslation: true,
      mushafTranslationFontSize: 1,
      mushafTooltipTextSize: 1,
      wbwPopupTextSize: 1,
      globalFontScale: 1,
      textType: "simple",
      showLearnTab: true,
      showMemorizeTab: true,
      sidebarCollapsed: false,
      hasSeenOnboarding: false,

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
      setNormalHoverShowTranslation: (value) => set({ normalHoverShowTranslation: value }),
      setNormalHoverShowTransliteration: (value) => set({ normalHoverShowTransliteration: value }),
      setNormalHoverTextSize: (size) => set({ normalHoverTextSize: size }),
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
      setMushafShowTranslation: (value) => set({ mushafShowTranslation: value }),
      setMushafTranslationFontSize: (size) => set({ mushafTranslationFontSize: size }),
      setMushafTooltipTextSize: (size) => set({ mushafTooltipTextSize: size }),
      setWbwPopupTextSize: (size) => set({ wbwPopupTextSize: size }),
      setGlobalFontScale: (scale) => {
        const s = get();
        const ratio = scale / s.globalFontScale;
        set({
          globalFontScale: scale,
          normalArabicFontSize: Math.max(0.6, Math.min(5, s.normalArabicFontSize * ratio)),
          normalTranslationFontSize: Math.max(0.6, Math.min(5, s.normalTranslationFontSize * ratio)),
          wbwArabicFontSize: Math.max(0.6, Math.min(5, s.wbwArabicFontSize * ratio)),
          mushafArabicFontSize: Math.max(0.6, Math.min(5, s.mushafArabicFontSize * ratio)),
          mushafTranslationFontSize: Math.max(0.6, Math.min(5, s.mushafTranslationFontSize * ratio)),
          wordTranslationSize: Math.max(0.6, Math.min(5, s.wordTranslationSize * ratio)),
          wordTransliterationSize: Math.max(0.6, Math.min(5, s.wordTransliterationSize * ratio)),
        });
      },
      adjustGlobalFontScale: (delta) => {
        const s = get();
        const next = Math.max(0.6, Math.min(3, s.globalFontScale + delta));
        if (next === s.globalFontScale) return;
        const ratio = next / s.globalFontScale;
        set({
          globalFontScale: next,
          normalArabicFontSize: Math.max(0.6, Math.min(5, s.normalArabicFontSize * ratio)),
          normalTranslationFontSize: Math.max(0.6, Math.min(5, s.normalTranslationFontSize * ratio)),
          wbwArabicFontSize: Math.max(0.6, Math.min(5, s.wbwArabicFontSize * ratio)),
          mushafArabicFontSize: Math.max(0.6, Math.min(5, s.mushafArabicFontSize * ratio)),
          mushafTranslationFontSize: Math.max(0.6, Math.min(5, s.mushafTranslationFontSize * ratio)),
          wordTranslationSize: Math.max(0.6, Math.min(5, s.wordTranslationSize * ratio)),
          wordTransliterationSize: Math.max(0.6, Math.min(5, s.wordTransliterationSize * ratio)),
        });
      },
      setTextType: (t) => set({ textType: t }),
      setShowLearnTab: (v) => set({ showLearnTab: v }),
      setShowMemorizeTab: (v) => set({ showMemorizeTab: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
    }),
    {
      name: "mahfuz-preferences",
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 1 && persisted) {
          // mushafPage → mushaf (QCF is now primary mushaf mode)
          if (persisted.viewMode === "mushafPage") persisted.viewMode = "mushaf";
        }
        if (version < 2 && persisted) {
          // mushafFlow removed — fall back to mushaf (QCF)
          if (persisted.viewMode === "mushafFlow") persisted.viewMode = "mushaf";
        }
        return persisted;
      },
    },
  ),
);

export function getArabicFontSizeForMode(
  state: Pick<PreferencesState, "viewMode" | "normalArabicFontSize" | "wbwArabicFontSize" | "mushafArabicFontSize">,
): number {
  switch (state.viewMode) {
    case "wordByWord": return state.wbwArabicFontSize;
    case "mushaf": return state.mushafArabicFontSize;
    default: return state.normalArabicFontSize;
  }
}

export function getTranslationFontSizeForMode(
  state: Pick<PreferencesState, "viewMode" | "normalTranslationFontSize" | "mushafTranslationFontSize">,
): number {
  if (state.viewMode === "mushaf") return state.mushafTranslationFontSize;
  return state.normalTranslationFontSize;
}
