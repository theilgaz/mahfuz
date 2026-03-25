import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCALE_CODES, DEFAULT_LOCALE, type Locale } from "~/locales/registry";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language?.split("-")[0];
  if (lang && LOCALE_CODES.includes(lang as Locale)) return lang as Locale;
  return DEFAULT_LOCALE;
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "mahfuz-core-locale",
      onRehydrateStorage: () => (state) => {
        // Validate persisted locale
        if (state && !LOCALE_CODES.includes(state.locale)) {
          state.locale = DEFAULT_LOCALE;
        }
      },
    },
  ),
);
