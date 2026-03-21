import { createPreferenceStore } from "~/lib/create-preference-store";
import type { ViewMode } from "~/lib/constants";
import type { PageLayout } from "@mahfuz/shared/constants";

export const useReadingPrefs = createPreferenceStore("mahfuz-reading-prefs", {
  viewMode: "normal" as ViewMode,
  pageLayout: "berkenar" as PageLayout,
  selectedTranslations: ["omer-celik"] as string[],

  // Per-mode show/hide
  normalShowTranslation: true,
  normalShowWordHover: true,
  wbwShowTranslation: false,
  wbwShowWordTranslation: true,
  wbwShowWordTransliteration: true,
  wbwTransliterationFirst: false,
  wbwShowGrammar: false,
  mushafShowTranslation: true,

  // Per-mode font sizes
  normalArabicFontSize: 1.65,
  normalTranslationFontSize: 0.8,
  wbwArabicFontSize: 1.75,
  mushafArabicFontSize: 1.6,

  // WBW sub-text sizes
  wordTranslationSize: 1,
  wordTransliterationSize: 1,
  favoriteSurahs: [] as number[],
});

// Helper: get arabic font size for current view mode
export function getArabicFontSizeForMode(
  viewMode: ViewMode,
  state: { normalArabicFontSize: number; wbwArabicFontSize: number; mushafArabicFontSize: number },
): number {
  switch (viewMode) {
    case "wordByWord": return state.wbwArabicFontSize;
    case "mushaf": return state.mushafArabicFontSize;
    default: return state.normalArabicFontSize;
  }
}

// Helper: get translation font size for current view mode
export function getTranslationFontSizeForMode(
  viewMode: ViewMode,
  state: { normalTranslationFontSize: number; mushafTranslationFontSize?: number },
): number {
  if (viewMode === "mushaf") return state.mushafTranslationFontSize ?? 1;
  return state.normalTranslationFontSize;
}

// Helper: toggle a translation ID in the list
export function toggleTranslation(current: string[], id: string): string[] {
  if (current.includes(id)) {
    return current.length > 1 ? current.filter((t) => t !== id) : current;
  }
  return [...current, id];
}
