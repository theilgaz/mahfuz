import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCALE_CODES, DEFAULT_LOCALE, type Locale } from "~/locales/registry";
import { useSettingsStore } from "~/stores/settings.store";

/** Default translation slug per locale */
const LOCALE_DEFAULT_TRANSLATION: Partial<Record<Locale, string>> = {
  en: "yusufali-en",
  tr: "omer-celik",
};

/** Detect best matching locale from browser languages. */
function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase();
    if (LOCALE_CODES.includes(code as Locale)) return code as Locale;
  }
  return DEFAULT_LOCALE;
}

interface LocaleState {
  locale: Locale;
  /** Whether the user has explicitly chosen a locale (first-visit gate). */
  hasChosenLocale: boolean;
  setLocale: (locale: Locale) => void;
  confirmLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      hasChosenLocale: false,
      setLocale: (locale) => {
        set({ locale, hasChosenLocale: true });
        const defaultSlug = LOCALE_DEFAULT_TRANSLATION[locale];
        if (defaultSlug) {
          useSettingsStore.getState().setTranslation(defaultSlug);
        }
      },
      confirmLocale: () => set({ hasChosenLocale: true }),
    }),
    {
      name: "mahfuz-core-locale",
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Validate persisted locale
        if (!LOCALE_CODES.includes(state.locale)) {
          state.locale = DEFAULT_LOCALE;
        }

        // First visit: detect browser language
        if (!state.hasChosenLocale) {
          state.locale = detectBrowserLocale();
        }
      },
    },
  ),
);
