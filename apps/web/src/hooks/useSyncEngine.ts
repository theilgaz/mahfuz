/**
 * Unified sync engine — replaces useReadingSync + useSettingsSync.
 *
 * Pull on mount, push on store changes (debounced 2s),
 * pull on visibility change (throttled 30s), flush outbox on reconnect,
 * periodic poll every 5 min.
 */

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings.store";
import { useLocaleStore } from "~/stores/locale.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useHifzStore } from "~/stores/hifz.store";
import { useReadingStore } from "~/stores/reading.store";
import { useSyncStore } from "~/stores/sync.store";
import { pushChanges, pullChanges, type PullResult } from "~/lib/sync-service";
import { loadLocaleMessages, type Locale, LOCALE_CODES } from "~/locales/registry";
import type { Session } from "~/lib/auth";

const PUSH_DEBOUNCE_MS = 2000;
const PULL_THROTTLE_MS = 30_000;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min

// ── Apply server data to all stores ──────────────────────

function applyPull(data: PullResult) {
  const { settings, hifzMemorized, bookmarks, readingPositions } = data;

  // Settings — sadece gerçekten farklı olan değerleri güncelle
  // (aynı değerle setState yapmak yeni dizi referansı oluşturur → gereksiz re-render)
  const settingsPatch: Record<string, any> = {};
  const currentSettings = useSettingsStore.getState();
  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined) continue;
    const currentVal = (currentSettings as any)[key];
    if (JSON.stringify(currentVal) !== JSON.stringify(value)) {
      settingsPatch[key] = value;
    }
  }
  if (Object.keys(settingsPatch).length > 0) {
    useSettingsStore.setState(settingsPatch);
    if (settingsPatch.theme) {
      document.documentElement.setAttribute("data-theme", settingsPatch.theme);
    }
  }

  // Locale
  if (settings.locale && LOCALE_CODES.includes(settings.locale as Locale)) {
    const ls = useLocaleStore.getState();
    if (settings.locale !== ls.locale) {
      loadLocaleMessages(settings.locale as Locale).then(() => {
        ls.setLocale(settings.locale as Locale);
      });
    }
  }

  // Bookmarks — server is source of truth
  if (bookmarks.length > 0) {
    useBookmarksStore.setState({ bookmarks });
  }

  // Hifz
  if (Object.keys(hifzMemorized).length > 0) {
    useHifzStore.setState({ memorized: hifzMemorized });
  }

  // Reading positions
  if (readingPositions.length > 0) {
    useReadingStore.getState()._loadFromDb(readingPositions);
  }

  // Update sync version
  useSyncStore.getState().setServerVersion(data.version);
  useSyncStore.getState().markPulled();
}

// ── Collect current state for push ───────────────────────

function collectChanges(): {
  settings: Record<string, { value: any; ts: number }>;
  bookmarks: Array<{ surahId: number; ayahNumber: number; pageNumber: number; createdAt: number }>;
  hifz: Array<{ surahId: number; verses: number[]; ts: number }>;
  readingPositions: Array<{ surahId: number; ayahNumber: number; pageNumber: number }>;
} {
  const now = Date.now();
  const s = useSettingsStore.getState();
  const l = useLocaleStore.getState();
  const b = useBookmarksStore.getState();
  const h = useHifzStore.getState();
  const r = useReadingStore.getState();

  // Settings — each field gets current timestamp
  const settingsFields: Record<string, any> = {
    theme: s.theme,
    textStyle: s.textStyle,
    translationSlugs: s.translationSlugs,
    showTranslation: s.showTranslation,
    showTranslit: s.showTranslit,
    showTajweed: s.showTajweed,
    readingMode: s.readingMode,
    surahListFilter: s.surahListFilter,
    reciterSlug: s.reciterSlug,
    arabicFontSize: s.arabicFontSize,
    translationFontSize: s.translationFontSize,
    locale: l.locale,
  };

  const settings: Record<string, { value: any; ts: number }> = {};
  for (const [key, value] of Object.entries(settingsFields)) {
    settings[key] = { value, ts: now };
  }

  // Hifz — per-surah
  const hifz = Object.entries(h.memorized).map(([surahId, verses]) => ({
    surahId: Number(surahId),
    verses,
    ts: now,
  }));

  return {
    settings,
    bookmarks: b.bookmarks,
    hifz,
    readingPositions: r.recentPositions,
  };
}

// ── Main hook ────────────────────────────────────────────

export function useSyncEngine(session: Session | null) {
  const userId = session?.user?.id;
  const initRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const snapshotRef = useRef("");
  const lastPullRef = useRef(0);

  // ── Pull: load from server ─────────────────────────

  useEffect(() => {
    if (!userId || initRef.current) return;
    initRef.current = true;

    const syncStore = useSyncStore.getState();

    // Flush outbox first
    flushOutbox(userId).then(() => {
      doPull(userId, syncStore.serverVersion);
    });
  }, [userId]);

  // ── Push: subscribe to all store changes ───────────

  useEffect(() => {
    if (!userId) return;

    function schedulePush() {
      clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => doPush(userId!), PUSH_DEBOUNCE_MS);
    }

    const unsubs = [
      useSettingsStore.subscribe(schedulePush),
      useLocaleStore.subscribe(schedulePush),
      useBookmarksStore.subscribe(schedulePush),
      useHifzStore.subscribe(schedulePush),
      useReadingStore.subscribe(schedulePush),
    ];

    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(pushTimerRef.current);
    };
  }, [userId]);

  // ── Visibility change: pull on tab focus ───────────

  useEffect(() => {
    if (!userId) return;

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastPullRef.current < PULL_THROTTLE_MS) return;
      doPull(userId!, useSyncStore.getState().serverVersion);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [userId]);

  // ── Online/offline: flush outbox on reconnect ──────

  useEffect(() => {
    if (!userId) return;

    function handleOnline() {
      useSyncStore.getState().setSyncStatus("idle");
      flushOutbox(userId!).then(() => {
        doPull(userId!, useSyncStore.getState().serverVersion);
      });
    }

    function handleOffline() {
      useSyncStore.getState().setSyncStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId]);

  // ── Periodic poll (5 min) ──────────────────────────

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      doPull(userId, useSyncStore.getState().serverVersion);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [userId]);

  // ── Internal helpers ───────────────────────────────

  async function doPull(uid: string, clientVersion: number) {
    const syncStore = useSyncStore.getState();
    syncStore.setSyncStatus("pulling");
    lastPullRef.current = Date.now();

    try {
      const result = await pullChanges({
        data: { userId: uid, clientVersion },
      });

      if (result) {
        applyPull(result);
        // Take snapshot after applying to avoid immediate push-back
        snapshotRef.current = JSON.stringify(collectChanges());
      }
      syncStore.setSyncStatus("idle");
    } catch {
      syncStore.setSyncStatus("error");
    }
  }

  async function doPush(uid: string) {
    const changes = collectChanges();
    const json = JSON.stringify(changes);
    if (json === snapshotRef.current) return;
    snapshotRef.current = json;

    const syncStore = useSyncStore.getState();

    if (!navigator.onLine) {
      syncStore.addToOutbox({
        settings: changes.settings,
        hifz: changes.hifz,
        bookmarks: changes.bookmarks,
        readingPositions: changes.readingPositions,
      });
      syncStore.setSyncStatus("offline");
      return;
    }

    syncStore.setSyncStatus("pushing");
    try {
      const result = await pushChanges({
        data: {
          userId: uid,
          settings: changes.settings,
          hifz: changes.hifz,
          bookmarks: changes.bookmarks,
          readingPositions: changes.readingPositions,
        },
      });
      syncStore.setServerVersion(result.version);
      syncStore.markPushed();
      syncStore.setSyncStatus("idle");
    } catch {
      // Queue for retry
      syncStore.addToOutbox({
        settings: changes.settings,
        hifz: changes.hifz,
        bookmarks: changes.bookmarks,
        readingPositions: changes.readingPositions,
      });
      syncStore.setSyncStatus("error");
    }
  }
}

// ── Flush offline queue ──────────────────────────────────

async function flushOutbox(userId: string) {
  const syncStore = useSyncStore.getState();
  while (syncStore.outbox.length > 0) {
    const change = syncStore.shiftOutbox();
    if (!change) break;
    try {
      await pushChanges({ data: { userId, ...change } });
    } catch {
      // Re-add to front if still failing
      syncStore.addToOutbox(change);
      break;
    }
  }
}
