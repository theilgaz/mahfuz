import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "papyrus" | "sea" | "night";
export type TextStyle = "uthmani" | "basic";

interface SettingsState {
  theme: Theme;
  textStyle: TextStyle;
  translationSlug: string;
  showTranslation: boolean;
  showTajweed: boolean;
  readingMode: "page" | "list";
  reciterSlug: string;
  arabicFontSize: number; // rem
  translationFontSize: number; // rem
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setTranslation: (slug: string) => void;
  toggleTranslation: () => void;
  toggleTajweed: () => void;
  setReadingMode: (mode: "page" | "list") => void;
  setReciter: (slug: string) => void;
  setTextStyle: (style: TextStyle) => void;
  setArabicFontSize: (size: number) => void;
  setTranslationFontSize: (size: number) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // Defaults
      theme: "papyrus" as Theme,
      translationSlug: "omer-celik",
      showTranslation: true,
      showTajweed: false,
      textStyle: "uthmani" as TextStyle,
      readingMode: "page",
      reciterSlug: "mishary-rashid-alafasy",
      arabicFontSize: 1.8,
      translationFontSize: 0.95,

      // Actions
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      setTranslation: (slug) => set({ translationSlug: slug }),
      toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      toggleTajweed: () => set((s) => ({ showTajweed: !s.showTajweed })),
      setReadingMode: (mode) => set({ readingMode: mode }),
      setReciter: (slug) => set({ reciterSlug: slug }),
      setTextStyle: (style) => set({ textStyle: style }),
      setArabicFontSize: (size) => set({ arabicFontSize: Math.max(1.2, Math.min(5.0, size)) }),
      setTranslationFontSize: (size) => set({ translationFontSize: Math.max(0.75, Math.min(2.0, size)) }),
      resetToDefaults: () => {
        document.documentElement.setAttribute("data-theme", "papyrus");
        set({
          theme: "papyrus",
          translationSlug: "omer-celik",
          showTranslation: true,
          showTajweed: false,
          textStyle: "uthmani",
          readingMode: "page",
          reciterSlug: "mishary-rashid-alafasy",
          arabicFontSize: 1.8,
          translationFontSize: 0.95,
        });
      },
    }),
    {
      name: "mahfuz-core-settings",
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
      }),
    },
  ),
);
