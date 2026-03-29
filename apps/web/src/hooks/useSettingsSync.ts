/**
 * Settings sync hook.
 * Giriş yapılmışsa:
 *   - Açılışta DB'den tüm kullanıcı verilerini yükle (bir kez)
 *   - Değişiklik olduğunda DB'ye debounced kaydet
 * Kapsam: ayarlar, dil, yer imleri, ezber durumu
 */

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings.store";
import { useLocaleStore } from "~/stores/locale.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useHifzStore } from "~/stores/hifz.store";
import { getUserSettings, saveUserSettings, type UserSettingsData } from "~/lib/settings-service";
import { loadLocaleMessages, type Locale, LOCALE_CODES } from "~/locales/registry";
import type { Session } from "~/lib/auth";

const SAVE_DEBOUNCE_MS = 2000;

/** Collect all user data as a plain object for DB storage */
function collectAll(): UserSettingsData {
  const s = useSettingsStore.getState();
  const l = useLocaleStore.getState();
  const b = useBookmarksStore.getState();
  const h = useHifzStore.getState();
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
    bookmarks: b.bookmarks,
    hifzMemorized: h.memorized,
  };
}

/** Apply data from DB to all stores */
function applyAll(data: UserSettingsData) {
  // Settings store
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
    if (patch.theme) {
      document.documentElement.setAttribute("data-theme", patch.theme);
    }
  }

  // Locale
  if (data.locale && LOCALE_CODES.includes(data.locale as Locale)) {
    const ls = useLocaleStore.getState();
    if (data.locale !== ls.locale) {
      loadLocaleMessages(data.locale as Locale).then(() => {
        ls.setLocale(data.locale as Locale);
      });
    }
  }

  // Bookmarks — DB is source of truth if it has data
  if (data.bookmarks && data.bookmarks.length > 0) {
    useBookmarksStore.setState({ bookmarks: data.bookmarks });
  }

  // Hifz — DB is source of truth if it has data
  if (data.hifzMemorized && Object.keys(data.hifzMemorized).length > 0) {
    useHifzStore.setState({ memorized: data.hifzMemorized });
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
          applyAll(data);
          snapshotRef.current = JSON.stringify(collectAll());
        }
      })
      .catch(() => {});
  }, [userId]);

  // Subscribe to all store changes and save debounced
  useEffect(() => {
    if (!userId) return;

    const unsubs = [
      useSettingsStore.subscribe(() => scheduleSave()),
      useLocaleStore.subscribe(() => scheduleSave()),
      useBookmarksStore.subscribe(() => scheduleSave()),
      useHifzStore.subscribe(() => scheduleSave()),
    ];

    function scheduleSave() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const current = collectAll();
        const json = JSON.stringify(current);
        if (json === snapshotRef.current) return;
        snapshotRef.current = json;

        saveUserSettings({ data: { userId: userId!, data: current } }).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    }

    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(timerRef.current);
    };
  }, [userId]);
}
