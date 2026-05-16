import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";

export type Theme = "light" | "sepia" | "dark";
export type TextStyle = "uthmani" | "basic";
export type WbwDisplay = "off" | "hover" | "on"; // geriye uyumluluk
export type ReadingMode = "verse" | "wbw" | "mushaf" | "meal";
export type SurahListFilter = "all" | "makkah" | "madinah" | "nuzul";
export type ColorPaletteId = "pastel" | "ocean" | "earth" | "vivid";
export type MushafSizeMode = "standard" | "fill";
export type AccentColorId = "default" | "stone" | "petrol" | "green" | "indigo";

export const ACCENT_COLORS: Record<AccentColorId, { light: { accent: string; soft: string; ink: string }; dark: { accent: string; soft: string; ink: string }; swatch: string }> = {
  default: {
    light: { accent: "oklch(0.45 0.18 14)", soft: "oklch(0.93 0.04 14)", ink: "oklch(0.30 0.13 14)" },
    dark:  { accent: "oklch(0.62 0.18 14)", soft: "oklch(0.26 0.07 14)", ink: "oklch(0.88 0.12 14)" },
    swatch: "#a01e3f",
  },
  stone: {
    light: { accent: "oklch(0.50 0.03 75)",  soft: "oklch(0.92 0.02 75)",  ink: "oklch(0.30 0.02 75)" },
    dark:  { accent: "oklch(0.68 0.03 75)",  soft: "oklch(0.28 0.02 75)",  ink: "oklch(0.88 0.02 75)" },
    swatch: "#7c715a",
  },
  petrol: {
    light: { accent: "oklch(0.50 0.11 230)", soft: "oklch(0.92 0.04 230)", ink: "oklch(0.30 0.08 230)" },
    dark:  { accent: "oklch(0.68 0.10 230)", soft: "oklch(0.28 0.06 230)", ink: "oklch(0.88 0.08 230)" },
    swatch: "#17739c",
  },
  green: {
    light: { accent: "oklch(0.45 0.10 155)", soft: "oklch(0.92 0.04 155)", ink: "oklch(0.28 0.08 155)" },
    dark:  { accent: "oklch(0.65 0.10 155)", soft: "oklch(0.26 0.05 155)", ink: "oklch(0.88 0.08 155)" },
    swatch: "#2d6a4f",
  },
  indigo: {
    light: { accent: "oklch(0.42 0.14 265)", soft: "oklch(0.92 0.04 265)", ink: "oklch(0.28 0.10 265)" },
    dark:  { accent: "oklch(0.62 0.13 265)", soft: "oklch(0.26 0.06 265)", ink: "oklch(0.88 0.08 265)" },
    swatch: "#2e3b6e",
  },
};

export const COLOR_PALETTES: Record<ColorPaletteId, { name: string; nameEn: string; nameAr: string; colors: string[] }> = {
  pastel: { name: "Zarif", nameEn: "Elegant", nameAr: "زهري", colors: ["#e8a435", "#d45d5d", "#4db89a", "#9b6dcc", "#e07840", "#5b9ec9", "#d46a8e", "#6db85e"] },
  ocean:  { name: "Işık",  nameEn: "Light",   nameAr: "برق",  colors: ["#e6197e", "#06b44e", "#2ba5dd", "#e8590c", "#9333ea", "#ca9215", "#0694a2", "#d63384"] },
  earth:  { name: "Cevher", nameEn: "Gem",    nameAr: "جوهر", colors: ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"] },
  vivid:  { name: "Mürekkep", nameEn: "Ink",  nameAr: "حبر", colors: ["#c4265e", "#5c8a18", "#0e7a8a", "#c96510", "#6f42c1", "#998a15", "#d94070", "#3e8948"] },
};

/** Apply accent color CSS custom properties to the DOM */
export function applyAccentToDOM(id: AccentColorId, isDark: boolean) {
  // Must apply to both <html> and <main#main-content> since both carry data-theme
  const targets = [
    document.documentElement,
    document.getElementById("main-content"),
  ].filter(Boolean) as HTMLElement[];

  // Fallback if persisted value no longer exists
  const safeId = id in ACCENT_COLORS ? id : "default";

  if (safeId === "default") {
    for (const el of targets) {
      el.style.removeProperty("--mu-accent");
      el.style.removeProperty("--mu-accent-soft");
      el.style.removeProperty("--mu-accent-ink");
    }
  } else {
    const vals = isDark ? ACCENT_COLORS[safeId].dark : ACCENT_COLORS[safeId].light;
    for (const el of targets) {
      el.style.setProperty("--mu-accent", vals.accent);
      el.style.setProperty("--mu-accent-soft", vals.soft);
      el.style.setProperty("--mu-accent-ink", vals.ink);
    }
  }
}

interface SettingsState {
  theme: Theme;
  textStyle: TextStyle;
  translationSlugs: string[];
  showTranslation: boolean;
  showTranslit: boolean;
  showTajweed: boolean;
  readingMode: ReadingMode;
  surahListFilter: SurahListFilter;
  reciterSlug: string;
  arabicFontSize: number; // rem
  translationFontSize: number; // rem
  colorizeWords: boolean;
  colorPaletteId: ColorPaletteId;
  labsEnabled: boolean;
  mushafSizeMode: MushafSizeMode;
  accentColor: AccentColorId;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  /** Bir meal ekle/cikar (toggle) */
  toggleTranslationSlug: (slug: string) => void;
  /** Seçili meali bir adım yukarı/aşağı taşı */
  moveTranslationSlug: (slug: string, direction: "up" | "down") => void;
  /** Eski tek-meal setter (geriye uyumluluk — listeyi [slug] yapar) */
  setTranslation: (slug: string) => void;
  toggleTranslation: () => void;
  toggleTranslit: () => void;
  toggleTajweed: () => void;
  setReadingMode: (mode: ReadingMode) => void;
  setSurahListFilter: (filter: SurahListFilter) => void;
  setReciter: (slug: string) => void;
  setTextStyle: (style: TextStyle) => void;
  setArabicFontSize: (size: number) => void;
  setTranslationFontSize: (size: number) => void;
  setColorizeWords: (on: boolean) => void;
  setColorPaletteId: (id: ColorPaletteId) => void;
  setLabsEnabled: (enabled: boolean) => void;
  setMushafSizeMode: (mode: MushafSizeMode) => void;
  setAccentColor: (id: AccentColorId) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      // Defaults
      theme: "light" as Theme,
      translationSlugs: [DEFAULT_TRANSLATION_SLUG],
      showTranslation: true,
      showTranslit: false,
      showTajweed: false,
      textStyle: "uthmani" as TextStyle,
      readingMode: "verse" as ReadingMode,
      surahListFilter: "all" as SurahListFilter,
      reciterSlug: "yasser-ad-dossari",
      arabicFontSize: 1.8,
      translationFontSize: 0.95,
      colorizeWords: false,
      colorPaletteId: "earth" as ColorPaletteId,
      labsEnabled: false,
      mushafSizeMode: "standard" as MushafSizeMode,
      accentColor: "default" as AccentColorId,

      // Actions
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        applyAccentToDOM(get().accentColor, theme === "dark");
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
      toggleTranslit: () => set((s) => ({ showTranslit: !s.showTranslit })),
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
      setMushafSizeMode: (mode) => set({ mushafSizeMode: mode }),
      setAccentColor: (id) => {
        const isDark = get().theme === "dark";
        applyAccentToDOM(id, isDark);
        set({ accentColor: id });
      },
      resetToDefaults: () => {
        document.documentElement.setAttribute("data-theme", "light");
        applyAccentToDOM("default", false);
        set({
          theme: "light",
          translationSlugs: [DEFAULT_TRANSLATION_SLUG],
          showTranslation: true,
          showTranslit: false,
          showTajweed: false,
          textStyle: "uthmani",
          readingMode: "verse",
          surahListFilter: "all",
          reciterSlug: "yasser-ad-dossari",
          arabicFontSize: 1.8,
          translationFontSize: 0.95,
          colorizeWords: false,
          colorPaletteId: "earth",
          labsEnabled: false,
          accentColor: "default",
        });
      },
    }),
    {
      name: "mahfuz-core-settings",
      version: 8,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
      }),
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          if (persisted.translationSlug && !persisted.translationSlugs) {
            persisted.translationSlugs = [persisted.translationSlug];
            delete persisted.translationSlug;
          }
        }
        if (version < 2) {
          const wasPage = persisted.readingMode === "page" || !persisted.readingMode;
          const hadWbw = persisted.showWbw === true;
          persisted.readingMode = hadWbw ? "wbw" : "verse";
          persisted.showTranslit = persisted.wbwTranslit === "on";
          delete persisted.showWbw;
          delete persisted.wbwTranslation;
          delete persisted.wbwTranslit;
        }
        if (version < 3) {
          // v2 -> v3: 4 tema -> 3 tema, seher state kaldir
          const theme = persisted.theme;
          if (theme === "papyrus") persisted.theme = "quran";
          else if (theme === "seher") persisted.theme = "sea";
          delete persisted.seherOverride;
          delete persisted.seherLocation;
        }
        if (version < 4) {
          // v3 -> v4: 4 tema -> light/sepia/dark
          const theme = persisted.theme;
          if (theme === "night" || theme === "tezhip") persisted.theme = "dark";
          else if (theme === "quran") persisted.theme = "sepia";
          else persisted.theme = "light";
        }
        if (version < 5) {
          // v4 -> v5: mushaf mode removed
          if (persisted.readingMode === "mushaf") persisted.readingMode = "verse";
        }
        if (version < 6) {
          // v5 -> v6: olive accent removed (default is now olive), yellow removed
          if (persisted.accentColor === "olive" || persisted.accentColor === "yellow") {
            persisted.accentColor = "default";
          }
        }
        if (version < 7) {
          // v6 -> v7: 'meal' reading mode added (Mushaf-alt). Existing values untouched.
        }
        if (version < 8) {
          // v7 -> v8: accent palette reduced to 5 (default/stone/petrol/green/indigo).
          const map: Record<string, AccentColorId> = {
            olive: "green",
            teal: "petrol",
            plum: "indigo",
            crimson: "default",
            copper: "stone",
          };
          if (persisted.accentColor && persisted.accentColor in map) {
            persisted.accentColor = map[persisted.accentColor];
          }
        }
        return persisted as any;
      },
    },
  ),
);
