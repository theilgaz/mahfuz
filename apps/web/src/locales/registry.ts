import { tr } from "./tr";
import { en } from "./en";
import type { LocaleConfig } from "./types";

/**
 * Central locale registry.
 *
 * To add a new language:
 *   1. Create `locales/<code>/index.ts` exporting translations
 *   2. Add an entry here
 *   3. Done — Locale type auto-extends, UI picks it up
 */
const registry = {
  tr: {
    messages: tr,
    displayName: "Türkçe",
    dir: "ltr",
    bcp47: "tr",
    complete: true,
  },
  en: {
    messages: en,
    displayName: "English",
    dir: "ltr",
    bcp47: "en",
    complete: true,
  },
} as const satisfies Record<string, LocaleConfig>;

/** Union of all registered locale codes — auto-extends when entries are added. */
export type Locale = keyof typeof registry;

/** Default locale used as fallback source. */
export const DEFAULT_LOCALE: Locale = "tr";

/** All registered locale codes as an array (for iteration / validation). */
export const LOCALE_CODES = Object.keys(registry) as Locale[];

/** Get config for a specific locale. */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return registry[locale];
}

/** Get all locale configs as `[code, config]` pairs. */
export function getAllLocaleConfigs(): { code: Locale; config: LocaleConfig }[] {
  return LOCALE_CODES.map((code) => ({ code, config: registry[code] }));
}
