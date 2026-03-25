import { useState, useEffect } from "react";
import { useLocaleStore } from "~/stores/locale.store";
import { tr } from "~/locales/tr";
import { getLocaleConfig, loadLocaleMessages } from "~/locales/registry";
import { deepMerge } from "~/locales/merge";
import type { Messages } from "~/locales/types";
import type { Locale } from "~/locales/registry";

/** Module-level cache for resolved message bundles. */
const resolved = new Map<string, Messages>();

function resolveMessagesSync(locale: Locale): Messages | null {
  if (locale === "tr") return tr;

  const cached = resolved.get(locale);
  if (cached) return cached;

  const config = getLocaleConfig(locale);
  if (Object.keys(config.messages).length > 0) {
    const msgs = config.messages as Messages;
    resolved.set(locale, msgs);
    return msgs;
  }

  return null;
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const [messages, setMessages] = useState<Messages>(() => resolveMessagesSync(locale) ?? tr);

  useEffect(() => {
    const sync = resolveMessagesSync(locale);
    if (sync) {
      setMessages(sync);
      return;
    }

    let cancelled = false;
    loadLocaleMessages(locale).then((loaded) => {
      if (cancelled) return;
      const config = getLocaleConfig(locale);
      const msgs = Object.keys(loaded).length > 0 ? loaded : deepMerge(locale, tr, loaded);
      resolved.set(locale, msgs);
      setMessages(msgs);
    });

    return () => { cancelled = true; };
  }, [locale]);

  return { t: messages, locale };
}
