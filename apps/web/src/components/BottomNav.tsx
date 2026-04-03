/**
 * Alt navigasyon çubuğu — anasayfa, keşfet, devam et (popup), ara, profil.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";

import { useReadingStore } from "~/stores/reading.store";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { useFocusTrap } from "~/hooks/useFocusTrap";

export function BottomNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const recentPositions = useReadingStore((s) => s.recentPositions);
  const { session } = useRouteContext({ from: "__root__" });

  const user = session?.user;

  // Devam et popup
  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupContentRef = useRef<HTMLDivElement>(null);
  const closePopup = useCallback(() => setPopupOpen(false), []);
  useFocusTrap(popupContentRef, popupOpen, closePopup);

  useEffect(() => {
    if (!popupOpen) return;
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popupOpen]);

  const handleMeemClick = () => {
    if (recentPositions.length === 0) {
      // Hiç kayıt yoksa direkt 1. sayfaya git
      navigate({ to: "/page/$pageNumber", params: { pageNumber: "1" }, search: { ayah: undefined } });
      return;
    }
    if (recentPositions.length === 1) {
      // Tek kayıt varsa direkt oraya git
      const pos = recentPositions[0];
      navigate({
        to: "/surah/$surahSlug",
        params: { surahSlug: surahSlug(pos.surahId) },
        search: { ayah: pos.ayahNumber > 1 ? pos.ayahNumber : undefined },
      });
      return;
    }
    setPopupOpen(!popupOpen);
  };

  return (
    <nav aria-label="Mahfuz" className="fixed bottom-0 inset-x-0 z-30 bg-[var(--color-bg)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {/* 1. Ana sayfa */}
        <Link
          to="/"
          aria-current={pathname === "/" ? "page" : undefined}
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

        {/* 2. Keşfet */}
        <Link
          to="/discover"
          aria-current={pathname === "/discover" ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${
            pathname === "/discover" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-[10px]">{t.nav.hub}</span>
        </Link>

        {/* 3. Devam et — Meem ikonu + popup */}
        <div className="relative" ref={popupRef}>
          <button
            onClick={handleMeemClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[var(--color-accent)] cursor-pointer"
            aria-label={t.nav.continueReading}
            aria-haspopup={recentPositions.length > 1 ? "true" : undefined}
            aria-expanded={popupOpen ? true : undefined}
          >
            <svg width="26" height="26" viewBox="118 152 93 138" fill="currentColor">
              <path d="M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977" />
            </svg>
          </button>

          {/* Recent positions popup */}
          {popupOpen && recentPositions.length > 1 && (
            <div ref={popupContentRef} role="menu" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <p className="px-3 pt-2.5 pb-1.5 text-[11px] text-[var(--color-text-secondary)]">
                {t.home.continueReading}
              </p>

              {/* Satırlar */}
              {recentPositions.map((pos, i) => {
                const name = getSurahName(pos.surahId, locale) || `Sure ${pos.surahId}`;
                return (
                  <button
                    key={pos.surahId}
                    role="menuitem"
                    onClick={() => {
                      setPopupOpen(false);
                      navigate({
                        to: "/surah/$surahSlug",
                        params: { surahSlug: surahSlug(pos.surahId) },
                        search: { ayah: pos.ayahNumber > 1 ? pos.ayahNumber : undefined },
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface)]"
                  >
                    <span className="text-xs text-[var(--color-text-secondary)] w-4 text-right shrink-0">
                      {pos.surahId}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${i === 0 ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>{name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        {t.common.verse} {pos.ayahNumber} · {t.common.page} {pos.pageNumber}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Ara */}
        <Link
          to="/search"
          aria-current={pathname === "/search" ? "page" : undefined}
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

        {/* 5. Profil */}
        <Link
          to={user ? "/profile" : "/auth/login"}
          aria-current={pathname === "/profile" ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
            pathname === "/profile" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className={`w-[22px] h-[22px] rounded-full object-cover ${
                pathname === "/profile" ? "ring-1.5 ring-[var(--color-accent)]" : ""
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="8" r="4" />
              <path d="M4 19C4 15.134 7.134 12 11 12C14.866 12 18 15.134 18 19" />
            </svg>
          )}
          <span className="text-[10px]">{t.nav.profile}</span>
        </Link>
      </div>
    </nav>
  );
}
