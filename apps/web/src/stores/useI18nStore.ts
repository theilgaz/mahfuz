import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_CODES,
} from "../locales/registry";

// Re-export so `surah-name.ts` (and others) can keep importing from here
export type { Locale };

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language;

  // Exact match first (e.g. "tr", "en")
  const exact = LOCALE_CODES.find((c) => c === lang);
  if (exact) return exact;

  // Prefix match (e.g. "en-US" → "en")
  const prefix = LOCALE_CODES.find((c) => lang.startsWith(c));
  if (prefix) return prefix;

  return DEFAULT_LOCALE;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => {
        // Guard against invalid persisted values
        if (LOCALE_CODES.includes(locale)) {
          set({ locale });
        } else {
          set({ locale: DEFAULT_LOCALE });
        }
      },
    }),
    {
      name: "mahfuz-locale",
      // Guard: if persisted value is no longer a valid locale, reset
      onRehydrateStorage: () => (state) => {
        if (state && !LOCALE_CODES.includes(state.locale)) {
          state.locale = DEFAULT_LOCALE;
        }
      },
    },
  ),
);
