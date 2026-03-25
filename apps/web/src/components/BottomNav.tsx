/**
 * Alt navigasyon çubuğu — mobilde ana sayfa, arama, yer imleri erişimi.
 */

import { Link, useLocation } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useReadingStore } from "~/stores/reading.store";
import { useTranslation } from "~/hooks/useTranslation";

export function BottomNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { t } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[var(--color-bg)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-center justify-around h-14">
        {/* Ana sayfa */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
            pathname === "/" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11L11 3L19 11" />
            <path d="M5 10V19H9V14H13V19H17V10" />
          </svg>
          <span className="text-[10px]">{t.nav.home}</span>
        </Link>

        {/* Devam et */}
        {lastPosition ? (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: String(lastPosition.pageNumber) }}
            search={{ ayah: undefined }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[var(--color-text-secondary)]"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4H14A4 4 0 0118 8V18H8A4 4 0 014 14V4Z" />
              <path d="M4 10H18" />
              <path d="M11 4V18" />
            </svg>
            <span className="text-[10px]">{t.nav.continueReading}</span>
          </Link>
        ) : (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: "1" }}
            search={{ ayah: undefined }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[var(--color-text-secondary)]"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4H14A4 4 0 0118 8V18H8A4 4 0 014 14V4Z" />
              <path d="M4 10H18" />
              <path d="M11 4V18" />
            </svg>
            <span className="text-[10px]">{t.nav.read}</span>
          </Link>
        )}

        {/* Ara */}
        <Link
          to="/search"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
            pathname === "/search" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="6.5" />
            <path d="M15 15L20 20" />
          </svg>
          <span className="text-[10px]">{t.nav.search}</span>
        </Link>

        {/* Yer İmleri */}
        <Link
          to="/bookmarks"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${
            pathname === "/bookmarks" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 3H17A1 1 0 0118 4V19L11.5 15L5 19V4A1 1 0 015 3Z" />
          </svg>
          {bookmarkCount > 0 && (
            <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[8px] flex items-center justify-center">
              {bookmarkCount > 9 ? "9+" : bookmarkCount}
            </span>
          )}
          <span className="text-[10px]">{t.nav.bookmarks}</span>
        </Link>
      </div>
    </nav>
  );
}
