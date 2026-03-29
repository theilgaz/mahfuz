/**
 * Settings sync hook.
 * Giriş yapılmışsa:
 *   - Açılışta DB'den ayarları yükle (bir kez)
 *   - Ayar değiştiğinde DB'ye debounced kaydet
 */

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings.store";
import { useLocaleStore } from "~/stores/locale.store";
import { getUserSettings, saveUserSettings, type UserSettingsData } from "~/lib/settings-service";
import { loadLocaleMessages, type Locale, LOCALE_CODES } from "~/locales/registry";
import type { Session } from "~/lib/auth";

const SAVE_DEBOUNCE_MS = 2000;

/** Collect current settings as a plain object for DB storage */
function collectSettings(): UserSettingsData {
  const s = useSettingsStore.getState();
  const l = useLocaleStore.getState();
  return {
    theme: s.theme,
    textStyle: s.textStyle,
    translationSlugs: s.translationSlugs,
    showTranslation: s.showTranslation,
    showWbw: s.showWbw,
    wbwTranslation: s.wbwTranslation,
    wbwTranslit: s.wbwTranslit,
    showTajweed: s.showTajweed,
    readingMode: s.readingMode,
    surahListFilter: s.surahListFilter,
    reciterSlug: s.reciterSlug,
    arabicFontSize: s.arabicFontSize,
    translationFontSize: s.translationFontSize,
    locale: l.locale,
  };
}

/** Apply settings from DB to stores */
function applySettings(data: UserSettingsData) {
  const ss = useSettingsStore.getState();
  const ls = useLocaleStore.getState();

  // Settings store — only apply fields that exist in data
  const patch: Record<string, any> = {};
  if (data.theme) patch.theme = data.theme;
  if (data.textStyle) patch.textStyle = data.textStyle;
  if (data.translationSlugs) patch.translationSlugs = data.translationSlugs;
  if (data.showTranslation !== undefined) patch.showTranslation = data.showTranslation;
  if (data.showWbw !== undefined) patch.showWbw = data.showWbw;
  if (data.wbwTranslation) patch.wbwTranslation = data.wbwTranslation;
  if (data.wbwTranslit) patch.wbwTranslit = data.wbwTranslit;
  if (data.showTajweed !== undefined) patch.showTajweed = data.showTajweed;
  if (data.readingMode) patch.readingMode = data.readingMode;
  if (data.surahListFilter) patch.surahListFilter = data.surahListFilter;
  if (data.reciterSlug) patch.reciterSlug = data.reciterSlug;
  if (data.arabicFontSize) patch.arabicFontSize = data.arabicFontSize;
  if (data.translationFontSize) patch.translationFontSize = data.translationFontSize;

  if (Object.keys(patch).length > 0) {
    useSettingsStore.setState(patch);
    // Apply theme to DOM
    if (patch.theme) {
      document.documentElement.setAttribute("data-theme", patch.theme);
    }
  }

  // Locale
  if (data.locale && LOCALE_CODES.includes(data.locale as Locale) && data.locale !== ls.locale) {
    loadLocaleMessages(data.locale as Locale).then(() => {
      ls.setLocale(data.locale as Locale);
    });
  }
}

export function useSettingsSync(session: Session | null) {
  const userId = session?.user?.id;
  const loadedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const snapshotRef = useRef("");

  // Load from DB once on mount
  useEffect(() => {
    if (!userId || loadedRef.current) return;
    loadedRef.current = true;

    getUserSettings({ data: userId })
      .then((data) => {
        if (data) {
          applySettings(data);
          // Set initial snapshot so we don't immediately save back
          snapshotRef.current = JSON.stringify(collectSettings());
        }
      })
      .catch(() => {});
  }, [userId]);

  // Subscribe to store changes and save debounced
  useEffect(() => {
    if (!userId) return;

    const unsub1 = useSettingsStore.subscribe(() => scheduleSave());
    const unsub2 = useLocaleStore.subscribe(() => scheduleSave());

    function scheduleSave() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const current = collectSettings();
        const json = JSON.stringify(current);
        if (json === snapshotRef.current) return; // No change
        snapshotRef.current = json;

        saveUserSettings({ data: { userId: userId!, data: current } }).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    }

    return () => {
      unsub1();
      unsub2();
      clearTimeout(timerRef.current);
    };
  }, [userId]);
}
