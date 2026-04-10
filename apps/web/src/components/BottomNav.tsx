/**
 * Alt navigasyon çubuğu — anasayfa, keşfet, devam et (popup), ara, profil.
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";

import { useReadingStore } from "~/stores/reading.store";
import { useHifzStore, computeHifzStats } from "~/stores/hifz.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { SettingsPanel } from "~/components/reader/SettingsPanel";

// ── Menu item types ────────────────────────────────────────

interface MenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
}

// ── User Card ─────────────────────────────────────────────

function StatPip({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-xs font-bold text-[var(--color-accent)] tabular-nums leading-none">{value ?? "-"}</span>
      <span className="text-[9px] text-[var(--color-text-secondary)] leading-none">{label}</span>
    </div>
  );
}

function UserCard({
  user,
  loginCta,
  guestName,
  onClose,
}: {
  user?: { id?: string; name?: string | null; email?: string | null; image?: string | null } | null;
  loginCta: string;
  guestName: string;
  onClose: () => void;
}) {
  const memorized = useHifzStore((s) => s.memorized);
  const hifz = computeHifzStats(memorized);


  if (!user) {
    return (
      <Link to="/auth/login" search={{ redirect: "/" }} onClick={onClose}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-surface)] hover:bg-[var(--color-border)]/30 transition-colors">
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
          </svg>
        </span>
        <span className="flex-1 text-sm font-semibold text-[var(--color-accent)]">{loginCta}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)]">
          <path d="M4 2l4 4-4 4" />
        </svg>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] overflow-hidden">
      {/* Single compact row: avatar + name + stats + profile */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {user.image ? (
          <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shrink-0">
            {(user.name ?? guestName).charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 shrink-0 w-28">
          <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{user.name ?? guestName}</p>
          {user.email && <p className="text-[10px] text-[var(--color-text-secondary)] truncate">{user.email}</p>}
        </div>

        {/* Stats inline */}
        <div className="flex flex-1 items-center justify-around min-w-0">
          <StatPip label="Hıfz" value={`${hifz.percentage}%`} />
          <div className="w-px h-6 bg-[var(--color-border)]" />
          <StatPip label="Sure" value={hifz.completeSurahs} />
          <div className="w-px h-6 bg-[var(--color-border)]" />
          <StatPip label="Ayet" value={hifz.totalVerses} />
        </div>

        <Link to="/profile" onClick={onClose}
          className="text-[10px] text-[var(--color-accent)] font-medium px-2 py-1 rounded-lg bg-[var(--color-accent)]/10 shrink-0">
          →
        </Link>
      </div>
    </div>
  );
}

// ── iOS-style Action Sheet ────────────────────────────────

function ActionSheet({
  open,
  onClose,
  groups,
  user,
  loginCta,
  guestName,
}: {
  open: boolean;
  onClose: () => void;
  groups: { label?: string; items: MenuAction[] }[];
  user?: { id?: string; name?: string | null; email?: string | null; image?: string | null } | null;
  loginCta: string;
  guestName: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-250 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 inset-x-0 z-50 rounded-t-[28px] bg-[var(--color-bg)]/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out pb-[calc(env(safe-area-inset-bottom)+8px)] ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-2">
          <div className="w-8 h-[3px] rounded-full bg-[var(--color-border)]" />
        </div>

        {/* User card + Premium */}
        <div className="px-3 pb-3 flex items-stretch gap-2">
          <div className="flex-1 min-w-0">
            <UserCard user={user} loginCta={loginCta} guestName={guestName} onClose={onClose} />
          </div>
          <Link
            to="/premium"
            onClick={onClose}
            className="flex flex-col items-center justify-center gap-1 px-3 rounded-2xl bg-[var(--color-surface)] text-[var(--color-accent)] shrink-0 hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-[9px] font-semibold">Mürşid</span>
          </Link>
        </div>

        {/* Groups */}
        <div className="px-3 pb-4 grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[11px] font-medium text-[var(--color-text-secondary)] px-1 mb-1">
                  {group.label}
                </p>
              )}
              <div className="rounded-2xl overflow-hidden bg-[var(--color-surface)]">
                {group.items.map((item, i) => {
                  const inner = (
                    <>
                      <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--color-accent)] text-white shrink-0">
                        {item.icon}
                      </span>
                      <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-border)] shrink-0">
                        <path d="M4 2l4 4-4 4" />
                      </svg>
                    </>
                  );

                  const cls = `flex items-center gap-3 px-3 py-2.5 active:bg-[var(--color-border)]/30 transition-colors ${i < group.items.length - 1 ? "border-b border-[var(--color-border)]/50" : ""}`;

                  if (item.to) {
                    return (
                      <Link key={item.id} to={item.to as "/"} onClick={onClose} className={cls}>
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <button key={item.id} onClick={() => { item.onClick?.(); onClose(); }} className={`w-full text-left ${cls}`}>
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
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

  // Action sheet groups
  const menuGroups: { label?: string; items: MenuAction[] }[] = [
    {
      label: t.nav.menuReading,
      items: [
        {
          id: "continue",
          label: t.nav.continueReading,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        },
        {
          id: "bookmarks",
          label: t.nav.bookmarks,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ),
          to: "/bookmarks",
        },
        {
          id: "notes",
          label: t.nav.notes,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          id: "search",
          label: t.nav.search,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ),
          to: "/search",
        },
      ],
    },
    {
      label: t.nav.menuLearning,
      items: [
        {
          id: "alifba",
          label: t.nav.alifba,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      items: [
        {
          id: "discover",
          label: t.nav.hub,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
            </svg>
          ),
          to: "/discover",
        },
        {
          id: "hub",
          label: "Hub", // proper name, no translation needed
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          ),
          to: "/hub",
        },
        {
          id: "profile",
          label: t.nav.profile,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
            </svg>
          ),
          to: user ? "/profile" : "/auth/login",
        },
        {
          id: "settings",
          label: t.nav.settings,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <ActionSheet open={sheetOpen} onClose={closeSheet} groups={menuGroups} user={user} loginCta={t.nav.loginCta} guestName={t.nav.guestName} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <nav aria-label="Mahfuz" className="fixed bottom-0 inset-x-0 z-30 bg-[var(--color-bg)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 max-w-xs mx-auto">

          {/* 1. Ana sayfa */}
          <Link
            to="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-6 py-1 ${pathname === "/" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11L11 3L19 11" />
              <path d="M5 10V19H9V14H13V19H17V10" />
            </svg>
            <span className="text-[10px]">{t.nav.home}</span>
          </Link>

          {/* 2. Meem — action sheet */}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 px-6 py-1 transition-colors text-[var(--color-accent)]"
            aria-label="Menü"
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
            className={`flex flex-col items-center gap-0.5 px-6 py-1 ${pathname === "/profile" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
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
            <span className="text-[10px]">{t.nav.profile}</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
