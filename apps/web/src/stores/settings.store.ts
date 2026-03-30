import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";

export type Theme = "papyrus" | "sea" | "night" | "seher";
export type TextStyle = "uthmani" | "basic";
export type WbwDisplay = "off" | "hover" | "on";
export type SurahListFilter = "all" | "makkah" | "madinah" | "nuzul";
export type ColorPaletteId = "pastel" | "ocean" | "earth" | "vivid";

export const COLOR_PALETTES: Record<ColorPaletteId, { name: string; nameAr: string; colors: string[] }> = {
  pastel: { name: "Zarif", nameAr: "زهري", colors: ["#e8a435", "#d45d5d", "#4db89a", "#9b6dcc", "#e07840", "#5b9ec9", "#d46a8e", "#6db85e"] },
  ocean:  { name: "Işık",  nameAr: "برق",  colors: ["#e6197e", "#06b44e", "#2ba5dd", "#e8590c", "#9333ea", "#ca9215", "#0694a2", "#d63384"] },
  earth:  { name: "Cevher", nameAr: "جوهر", colors: ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"] },
  vivid:  { name: "Mürekkep", nameAr: "حبر", colors: ["#c4265e", "#5c8a18", "#0e7a8a", "#c96510", "#6f42c1", "#998a15", "#d94070", "#3e8948"] },
};

interface SettingsState {
  theme: Theme;
  textStyle: TextStyle;
  translationSlugs: string[];
  showTranslation: boolean;
  showWbw: boolean;
  wbwTranslation: WbwDisplay;
  wbwTranslit: WbwDisplay;
  showTajweed: boolean;
  readingMode: "page" | "list";
  surahListFilter: SurahListFilter;
  reciterSlug: string;
  arabicFontSize: number; // rem
  translationFontSize: number; // rem
  colorizeWords: boolean;
  colorPaletteId: ColorPaletteId;
  labsEnabled: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  /** Bir meal ekle/çıkar (toggle) */
  toggleTranslationSlug: (slug: string) => void;
  /** Seçili meali bir adım yukarı/aşağı taşı */
  moveTranslationSlug: (slug: string, direction: "up" | "down") => void;
  /** Eski tek-meal setter (geriye uyumluluk — listeyi [slug] yapar) */
  setTranslation: (slug: string) => void;
  toggleTranslation: () => void;
  toggleWbw: () => void;
  setWbwTranslation: (mode: WbwDisplay) => void;
  setWbwTranslit: (mode: WbwDisplay) => void;
  toggleTajweed: () => void;
  setReadingMode: (mode: "page" | "list") => void;
  setSurahListFilter: (filter: SurahListFilter) => void;
  setReciter: (slug: string) => void;
  setTextStyle: (style: TextStyle) => void;
  setArabicFontSize: (size: number) => void;
  setTranslationFontSize: (size: number) => void;
  setColorizeWords: (on: boolean) => void;
  setColorPaletteId: (id: ColorPaletteId) => void;
  setLabsEnabled: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // Defaults
      theme: "papyrus" as Theme,
      translationSlugs: [DEFAULT_TRANSLATION_SLUG],
      showTranslation: true,
      showWbw: false,
      wbwTranslation: "on" as WbwDisplay,
      wbwTranslit: "off" as WbwDisplay,
      showTajweed: false,
      textStyle: "uthmani" as TextStyle,
      readingMode: "page",
      surahListFilter: "all" as SurahListFilter,
      reciterSlug: "mishary-rashid-alafasy",
      arabicFontSize: 1.8,
      translationFontSize: 0.95,
      colorizeWords: false,
      colorPaletteId: "earth" as ColorPaletteId,
      labsEnabled: false,

      // Actions
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      toggleTranslationSlug: (slug) =>
        set((s) => {
          const has = s.translationSlugs.includes(slug);
          if (has && s.translationSlugs.length === 1) return s; // en az 1 meal kalmalı
          return {
            translationSlugs: has
              ? s.translationSlugs.filter((s2) => s2 !== slug)
              : [...s.translationSlugs, slug],
          };
        }),
      moveTranslationSlug: (slug, direction) =>
        set((s) => {
          const arr = [...s.translationSlugs];
          const idx = arr.indexOf(slug);
          if (idx < 0) return s;
          const target = direction === "up" ? idx - 1 : idx + 1;
          if (target < 0 || target >= arr.length) return s;
          [arr[idx], arr[target]] = [arr[target], arr[idx]];
          return { translationSlugs: arr };
        }),
      setTranslation: (slug) => set({ translationSlugs: [slug] }),
      toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      toggleWbw: () => set((s) => ({ showWbw: !s.showWbw })),
      setWbwTranslation: (mode) => set({ wbwTranslation: mode }),
      setWbwTranslit: (mode) => set({ wbwTranslit: mode }),
      toggleTajweed: () => set((s) => ({ showTajweed: !s.showTajweed })),
      setReadingMode: (mode) => set({ readingMode: mode }),
      setSurahListFilter: (filter) => set({ surahListFilter: filter }),
      setReciter: (slug) => set({ reciterSlug: slug }),
      setTextStyle: (style) => set({ textStyle: style }),
      setArabicFontSize: (size) => set({ arabicFontSize: Math.max(1.2, Math.min(5.0, size)) }),
      setTranslationFontSize: (size) => set({ translationFontSize: Math.max(0.75, Math.min(2.0, size)) }),
      setColorizeWords: (on) => set({ colorizeWords: on }),
      setColorPaletteId: (id) => set({ colorPaletteId: id }),
      setLabsEnabled: (enabled) => set({ labsEnabled: enabled }),
      resetToDefaults: () => {
        document.documentElement.setAttribute("data-theme", "papyrus");
        set({
          theme: "papyrus",
          translationSlugs: [DEFAULT_TRANSLATION_SLUG],
          showTranslation: true,
          showWbw: false,
          wbwTranslation: "on",
          wbwTranslit: "off",
          showTajweed: false,
          textStyle: "uthmani",
          readingMode: "page",
          surahListFilter: "all",
          reciterSlug: "mishary-rashid-alafasy",
          arabicFontSize: 1.8,
          translationFontSize: 0.95,
          colorizeWords: false,
          colorPaletteId: "earth",
          labsEnabled: false,
        });
      },
    }),
    {
      name: "mahfuz-core-settings",
      version: 1,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
      }),
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          // v0 → v1: translationSlug (string) → translationSlugs (string[])
          const old = persisted as any;
          if (old.translationSlug && !old.translationSlugs) {
            old.translationSlugs = [old.translationSlug];
            delete old.translationSlug;
          }
        }
        return persisted as any;
      },
    },
  ),
);
