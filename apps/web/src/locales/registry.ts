import { tr } from "./tr";
import type { LocaleConfig, Messages } from "./types";

/** Dynamic loaders — only TR is bundled, rest are code-split. */
const localeLoaders: Record<string, () => Promise<Messages>> = {
  en: () => import("./en").then((m) => m.en),
  es: () => import("./es").then((m) => m.es),
  fr: () => import("./fr").then((m) => m.fr),
  ar: () => import("./ar").then((m) => m.ar),
  de: () => import("./de").then((m) => m.de),
  nl: () => import("./nl").then((m) => m.nl),
};

const registry = {
  tr: { messages: tr, displayName: "Türkçe", dir: "ltr", bcp47: "tr" },
  en: { messages: {} as Messages, displayName: "English", dir: "ltr", bcp47: "en" },
  es: { messages: {} as Messages, displayName: "Español", dir: "ltr", bcp47: "es" },
  fr: { messages: {} as Messages, displayName: "Français", dir: "ltr", bcp47: "fr" },
  ar: { messages: {} as Messages, displayName: "العربية", dir: "rtl", bcp47: "ar" },
  de: { messages: {} as Messages, displayName: "Deutsch", dir: "ltr", bcp47: "de" },
  nl: { messages: {} as Messages, displayName: "Nederlands", dir: "ltr", bcp47: "nl" },
} as const satisfies Record<string, LocaleConfig>;

/** Union of all registered locale codes. */
export type Locale = keyof typeof registry;

/** Default locale. */
export const DEFAULT_LOCALE: Locale = "tr";

/** All locale codes. */
export const LOCALE_CODES = Object.keys(registry) as Locale[];

/** Get config for a locale. */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return registry[locale];
}

/** Get all locale configs. */
export function getAllLocaleConfigs(): { code: Locale; config: LocaleConfig }[] {
  return LOCALE_CODES.map((code) => ({ code, config: registry[code] }));
}

/** Load messages (sync for TR, async for others). */
export async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  const config = registry[locale];

  if (locale === "tr") return config.messages as Messages;

  // Already loaded
  if (Object.keys(config.messages).length > 0) return config.messages as Messages;

  const loader = localeLoaders[locale];
  if (loader) {
    const messages = await loader();
    (registry[locale] as { messages: Messages | Record<string, never> }).messages = messages;
    return messages;
  }

  return config.messages as Messages;
}
