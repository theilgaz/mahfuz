/**
 * Alt navigasyon -- minimal iOS tarzi tab bar.
 * 4 tab: Ana sayfa, Ara, Kesfet, Ayarlar.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsPanel } from "~/components/reader/SettingsPanel";
import { surahIdFromSlug } from "~/lib/surah-slugs";
import { useReadingStore } from "~/stores/reading.store";

export function BottomNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { t } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Route degisince settings kapat
  useEffect(() => { setSettingsOpen(false); }, [pathname]);

  // Derive context for SettingsPanel (needed for reading mode switch navigation)
  const settingsContext = useMemo(() => {
    const ctx: { surahId?: number; pageNumber?: number } = {};
    const surahMatch = pathname.match(/^\/surah\/(.+)$/);
    const pageMatch = pathname.match(/^\/page\/(\d+)$/);
    if (surahMatch) ctx.surahId = surahIdFromSlug(surahMatch[1]);
    if (pageMatch) ctx.pageNumber = parseInt(pageMatch[1], 10) || undefined;
    if (!ctx.surahId && lastPosition) ctx.surahId = lastPosition.surahId;
    if (!ctx.pageNumber && lastPosition) ctx.pageNumber = lastPosition.pageNumber;
    return ctx;
  }, [pathname, lastPosition]);

  const tabs = [
    {
      id: "home",
      label: t.nav.home,
      to: "/",
      isActive: pathname === "/",
      icon: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11L11 3L19 11" />
          <path d="M5 10V19H9V14H13V19H17V10" />
        </svg>
      ),
    },
    {
      id: "search",
      label: t.nav.search,
      to: "/search",
      isActive: pathname === "/search",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: "fihrist",
      label: t.nav.fihrist,
      to: "/fihrist",
      isActive: pathname.startsWith("/fihrist"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: "discover",
      label: t.nav.hub,
      to: "/discover",
      isActive: pathname.startsWith("/discover"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
  ] as const;

  return (
    <>
      <SettingsPanel open={settingsOpen} onClose={closeSettings} context={settingsContext} />

      <nav
        aria-label="Mahfuz"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
      >
        <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to as "/"}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                tab.isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          ))}

          {/* Ayarlar tab -- buton, Link degil */}
          <button
            onClick={openSettings}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
              settingsOpen
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.settings}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
