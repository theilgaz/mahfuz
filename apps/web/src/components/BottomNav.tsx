/**
 * Alt navigasyon çubuğu — anasayfa, meem menü, profil.
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";

import { useReadingStore } from "~/stores/reading.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { SettingsPanel } from "~/components/reader/SettingsPanel";

// ── Menu item types ────────────────────────────────────────

type IconColor = "accent" | "amber" | "neutral";

interface MenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  /** true = icon is already styled (e.g. profile photo), skip the color wrapper */
  rawIcon?: boolean;
  to?: string;
  onClick?: () => void;
}

const ICON_COLOR_CLASSES: Record<IconColor, string> = {
  accent: "bg-[var(--color-accent)] text-white",
  amber: "bg-orange-600 text-white",
  neutral: "bg-[var(--color-text-secondary)]/15 text-[var(--color-text-primary)]",
};

// ── Action Sheet ─────────────────────────────────────────

interface MenuGroup {
  label?: string;
  iconColor: IconColor;
  items: MenuAction[];
}

interface HeroAction {
  label: string;
  desc?: string;
  icon: ReactNode;
  onClick: () => void;
}

function ActionSheet({
  open,
  onClose,
  hero,
  groups,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  hero: HeroAction;
  groups: MenuGroup[];
  pathname: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const stagger = (i: number) =>
    open ? { animation: `meem-item-in 350ms cubic-bezier(0.25,1,0.5,1) ${i * 40}ms both` } : undefined;

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      className="rounded-[24px] bg-[var(--color-bg)]/90 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden"
      style={{
        transition: "opacity 300ms cubic-bezier(0.25,1,0.5,1), transform 400ms cubic-bezier(0.25,1,0.5,1)",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-9 h-[5px] rounded-full bg-[var(--color-border)]/50" />
      </div>

      {/* Hero CTA */}
      <div className="px-4 pb-3.5" style={stagger(0)}>
        <button
          onClick={() => { hero.onClick(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-[18px] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/85 text-white hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-[13px] bg-white/20 shrink-0">
            {hero.icon}
          </span>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[15px] font-semibold">{hero.label}</span>
            {hero.desc && (
              <p className="text-xs text-white/70 leading-tight mt-0.5 truncate">{hero.desc}</p>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-white/60">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* Groups */}
      <div className="px-4 pb-4 max-h-[55vh] overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} style={stagger(gi + 1)}>
            {group.label && (
              <p className="text-[15px] font-bold text-[var(--color-text-primary)] px-1 mb-2.5 mt-1 first:mt-0">
                {group.label}
              </p>
            )}

            <div className="flex flex-wrap gap-0 mb-4 last:mb-0">
              {group.items.map((item) => {
                const isActive = item.to ? pathname.startsWith(item.to) : false;
                const iconEl = item.rawIcon ? (
                  <span className="flex items-center justify-center w-12 h-12 rounded-[16px] shrink-0 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)]">{item.icon}</span>
                ) : (
                  <span className={`flex items-center justify-center w-12 h-12 rounded-[16px] shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${ICON_COLOR_CLASSES[group.iconColor]}`}>{item.icon}</span>
                );

                const activeCls = isActive ? "bg-[var(--color-accent)]/8" : "";
                const cls = `flex flex-col items-center text-center gap-0.5 px-1 py-1 rounded-2xl w-[64px] ${activeCls} active:scale-[0.93] transition-transform duration-150`;

                const inner = (
                  <>
                    {iconEl}
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight line-clamp-1">{item.label}</span>
                  </>
                );

                if (item.to) {
                  return (
                    <Link key={item.id} to={item.to as "/"} onClick={onClose} className={cls}>
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button key={item.id} onClick={() => { item.onClick?.(); onClose(); }} className={cls}>
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BottomNav ──────────────────────────────────────────────

export function BottomNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const recentPositions = useReadingStore((s) => s.recentPositions);
  const { session } = useRouteContext({ from: "__root__" });

  const user = session?.user;

  // Meem action sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Close on route change
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  const lastPos = recentPositions[0];

  // Hero CTA — "Devam Et" extracted from groups
  const heroAction: HeroAction = {
    label: t.nav.continueReading,
    desc: lastPos
      ? `${getSurahName(lastPos.surahId, locale)}${lastPos.ayahNumber > 1 ? ` · ${lastPos.ayahNumber}. ayet` : ""}`
      : undefined,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6C2 6 4 4 8 4C12 4 14 6 14 6V20C14 20 12 18 8 18C4 18 2 20 2 20V6Z" />
        <path d="M14 6C14 6 16 4 20 4C22 4 22 4 22 4V18C22 18 21 18 20 18C16 18 14 20 14 20V6Z" />
      </svg>
    ),
    onClick: () => {
      if (lastPos) {
        navigate({
          to: "/surah/$surahSlug",
          params: { surahSlug: surahSlug(lastPos.surahId) },
          search: { ayah: lastPos.ayahNumber > 1 ? lastPos.ayahNumber : undefined },
        });
      } else {
        navigate({ to: "/page/$pageNumber", params: { pageNumber: "1" }, search: { ayah: undefined } });
      }
    },
  };

  // Action sheet groups
  const menuGroups: MenuGroup[] = [
    {
      label: t.nav.menuReading,
      iconColor: "accent",
      items: [
        {
          id: "bookmarks",
          label: t.nav.bookmarks,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ),
          to: "/bookmarks",
        },
        {
          id: "notes",
          label: t.nav.notes,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ),
          to: "/notes",
        },
        {
          id: "hatim",
          label: "Hatim",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
          to: "/hatim",
        },
      ],
    },
    {
      label: t.nav.menuLearning,
      iconColor: "amber",
      items: [
        {
          id: "alifba",
          label: t.nav.alifba,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          ),
          to: "/alifba",
        },
        {
          id: "qaida",
          label: t.nav.qaida,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          ),
          to: "/qaida",
        },
        {
          id: "tajweed",
          label: t.nav.tajweed,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              <path d="M12 8v4l3 3" />
            </svg>
          ),
          to: "/tajweed",
        },
        {
          id: "games",
          label: t.nav.games,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M7 10v4M5 12h4" />
              <path d="M17 10h.01M19 12h.01" />
            </svg>
          ),
          to: "/games",
        },
      ],
    },
    {
      label: t.nav.menuExplore,
      iconColor: "neutral",
      items: [
        {
          id: "discover",
          label: t.nav.hub,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
            </svg>
          ),
          to: "/discover",
        },
        {
          id: "mursid",
          label: "Mürşid",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          to: "/premium",
        },
        {
          id: "search",
          label: t.nav.search,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ),
          to: "/search",
        },
        {
          id: "about",
          label: "Hakkında",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
          to: "/about",
        },
        {
          id: "settings",
          label: t.nav.settings,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
          onClick: () => setSettingsOpen(true),
        },
      ],
    },
  ];

  return (
    <>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Backdrop — z-40, nav container z-50 ustunde kalir */}
      <div
        onClick={closeSheet}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-250 ${sheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Nav container — z-50, backdrop'un ustunde */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex flex-col items-center pointer-events-none pb-[max(env(safe-area-inset-bottom),12px)]">

        {/* Action sheet — sits above the nav pill, same container width on desktop */}
        <div className={`w-full max-w-lg px-3 mb-2 ${sheetOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <ActionSheet open={sheetOpen} onClose={closeSheet} hero={heroAction} groups={menuGroups} pathname={pathname} />
        </div>

        {/* Nav pill */}
        <nav
          aria-label="Mahfuz"
          className="pointer-events-auto flex items-center gap-1 h-14 px-2 rounded-2xl bg-[var(--color-bg)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        >
          {/* 1. Ana sayfa */}
          <Link
            to="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 w-16 py-1.5 rounded-xl transition-colors ${pathname === "/" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11L11 3L19 11" />
              <path d="M5 10V19H9V14H13V19H17V10" />
            </svg>
            <span className="text-[10px]">{t.nav.home}</span>
          </Link>

          {/* 2. Meem — action sheet toggle */}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 w-16 py-1.5 rounded-xl transition-colors text-[var(--color-accent)]"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <svg width="26" height="26" viewBox="118 152 93 138" fill="currentColor">
              <path d="M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977" />
            </svg>
          </button>

          {/* 3. Profil */}
          <Link
            to={user ? "/profile" : "/auth/login"}
            aria-current={pathname === "/profile" ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 w-16 py-1.5 rounded-xl transition-colors ${pathname === "/profile" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
          >
            {user?.image ? (
              <img
                src={user.image}
                alt=""
                className={`w-[22px] h-[22px] rounded-full object-cover ${pathname === "/profile" ? "ring-1.5 ring-[var(--color-accent)]" : ""}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="8" r="4" />
                <path d="M4 19C4 15.134 7.134 12 11 12C14.866 12 18 15.134 18 19" />
              </svg>
            )}
            <span className="text-[10px]">{user?.name?.split(" ")[0] ?? t.nav.profile}</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
