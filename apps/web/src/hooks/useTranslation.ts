import { useI18nStore } from "../stores/useI18nStore";
import { tr } from "../locales/tr";
import { getLocaleConfig } from "../locales/registry";
import { deepMerge } from "../locales/merge";
import type { Messages } from "../locales/types";
import type { Locale } from "../locales/registry";

/** Module-level cache for resolved message bundles. */
const resolved = new Map<string, Messages>();

function resolveMessages(locale: Locale): Messages {
  const cached = resolved.get(locale);
  if (cached) return cached;

  const config = getLocaleConfig(locale);

  if (config.complete) {
    const msgs = config.messages as Messages;
    resolved.set(locale, msgs);
    return msgs;
  }

  return deepMerge(locale, tr, config.messages);
}

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  return { t: resolveMessages(locale), locale };
}
