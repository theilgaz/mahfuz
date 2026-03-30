import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";
import { AudioProvider } from "~/components/reader/AudioProvider";
import { BottomNav } from "~/components/BottomNav";
import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { SettingsPanel } from "~/components/reader/SettingsPanel";
import { ReadingProgressBar } from "~/components/reader/ReadingProgressBar";
import { SurahPicker } from "~/components/reader/SurahPicker";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";
import { Link, useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import { getSession } from "~/lib/auth-session";
import { useSyncEngine } from "~/hooks/useSyncEngine";
import { surahSlug, surahIdFromSlug } from "~/lib/surah-slugs";
import type { Session } from "~/lib/auth";
import appCss from "~/styles/app.css?url";

export interface RouterContext {
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    // Numeric shorthand: /33 → /surah/al-ahzab, /33/5 → /surah/al-ahzab?ayah=5
    const numMatch = location.pathname.match(/^\/(\d+)(?:\/(\d+))?$/);
    if (numMatch) {
      const id = parseInt(numMatch[1], 10);
      if (id >= 1 && id <= 114) {
        const ayah = numMatch[2] ? parseInt(numMatch[2], 10) : undefined;
        throw redirect({
          to: "/surah/$surahSlug",
          params: { surahSlug: surahSlug(id) },
          search: { ayah },
        });
      }
    }

    return { session };
  },
  notFoundComponent: NotFound,
  errorComponent: RouteErrorFallback,
  pendingComponent: PendingIndicator,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#111111", media: "(prefers-color-scheme: dark)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Mahfuz محفوظ" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preload", href: "/fonts/KFGQPCUthmanicScriptHAFS.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "/fonts/ScheherazadeNew-Regular.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function PendingIndicator() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-0.5 bg-[var(--color-accent)] animate-pulse" />
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl mb-4" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>٤٠٤</p>
      <p className="text-lg font-medium mb-2">{t.error.notFound}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {t.error.notFoundDesc}
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t.error.goHome}
      </Link>
    </div>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function AppHeader() {
  const labsEnabled = useSettingsStore((s) => s.labsEnabled);
  const { t } = useTranslation();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labsMenuOpen, setLabsMenuOpen] = useState(false);
  const { session } = useRouteContext({ from: "__root__" });
  const labsMenuRef = useRef<HTMLDivElement>(null);
  const labsDropdownRef = useRef<HTMLDivElement>(null);
  const closeLabsMenu = useCallback(() => setLabsMenuOpen(false), []);
  useFocusTrap(labsDropdownRef, labsMenuOpen, closeLabsMenu);

  const path = routerState.location.pathname;
  const isHome = path === "/";
  const isAuth = path.startsWith("/auth");
  if (isAuth) return null;

  // Reading route detection
  const surahSlugMatch = path.match(/^\/surah\/(.+)$/);
  const pageNumMatch = path.match(/^\/page\/(\d+)$/);
  const isReadingRoute = !!(surahSlugMatch || pageNumMatch);

  // Current surah ID for reading routes
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const currentSurahId = surahSlugMatch
    ? undefined // will be resolved by SurahPicker from slug
    : pageNumMatch
      ? lastPosition?.surahId ?? 1
      : undefined;
  const currentPage = pageNumMatch ? parseInt(pageNumMatch[1], 10) : undefined;

  // Sayfa başlığı (non-reading routes only)
  const title = isHome || isReadingRoute ? null
    : path === "/discover" ? t.hub.title
    : path === "/search" ? t.nav.search
    : path === "/profile" ? t.nav.profile
    : path === "/bookmarks" ? t.hub.bookmarks
    : path === "/alifba" ? t.hub.alifba
    : path === "/hifz" ? t.hub.hifz
    : path.startsWith("/changelog") ? t.changelog.banner
    : null;

  const settingsContext = useMemo(() => {
    const ctx: { surahId?: number; pageNumber?: number } = {};
    if (surahSlugMatch) {
      ctx.surahId = surahIdFromSlug(surahSlugMatch[1]);
    }
    if (pageNumMatch) {
      ctx.pageNumber = parseInt(pageNumMatch[1], 10) || undefined;
    }
    if (!ctx.surahId && lastPosition) ctx.surahId = lastPosition.surahId;
    if (!ctx.pageNumber && lastPosition) ctx.pageNumber = lastPosition.pageNumber;
    return ctx;
  }, [surahSlugMatch, pageNumMatch, lastPosition]);

  return (
    <>
      <div className="sticky top-0 z-40">
        {/* Tema bandı */}
        <div className="h-[3px]" style={{ background: "var(--header-band)" }} />

        {/* Main header */}
        <header className="flex items-center h-11 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 w-full max-w-3xl mx-auto px-4">
          {/* Left: logo or back */}
          {isHome ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <MahfuzLogo size={22} />
              <span className="text-sm font-semibold">Mahfuz</span>
            </div>
          ) : (
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
              aria-label={t.nav.back}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4L7 10L13 16" />
              </svg>
            </button>
          )}

          {/* Center: title or reading nav */}
          {isReadingRoute ? (
            <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
              {surahSlugMatch ? (
                <SurahPickerNav surahSlug={surahSlugMatch[1]} />
              ) : pageNumMatch ? (
                <PagePickerNav page={currentPage!} surahId={currentSurahId ?? 1} />
              ) : null}
            </div>
          ) : title ? (
            <>
              <span className="text-sm font-medium truncate">{title}</span>
              <div className="flex-1" />
            </>
          ) : (
            <div className="flex-1" />
          )}

          {/* Changelog — sadece discover sayfasında */}
          {path === "/discover" && (
            <Link
              to="/changelog"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
              aria-label={t.changelog.banner}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z" />
              </svg>
            </Link>
          )}

          {/* Labs menu — sadece keşif modunda */}
          {labsEnabled && (
            <div className="relative" ref={labsMenuRef}>
              <button
                onClick={() => setLabsMenuOpen((v) => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
                aria-label="Labs"
                aria-haspopup="true"
                aria-expanded={labsMenuOpen}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H15V8L19 14V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V14L9 8V3Z" />
                  <path d="M9 3H15" />
                  <path d="M12 11V15" />
                  <path d="M10 13H14" />
                </svg>
              </button>
              {labsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLabsMenuOpen(false)} />
                  <div ref={labsDropdownRef} role="menu" className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 py-1 overflow-hidden">
                    {[
                      { to: "/discover", label: t.hub.listenMemorize, icon: "🎧" },
                      { to: "/discover", label: t.hub.apps, icon: "📦" },
                      { to: "/alifba", label: t.hub.alifba, icon: "ا ب" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setLabsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
                      >
                        <span className="w-5 text-center text-xs">{item.icon}</span>
                        <span>{item.label}</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">Keşif</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search */}
          <Link
            to="/search"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label={t.nav.search}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11L14 14" />
            </svg>
          </Link>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label={t.settings.title}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

        </div>
        </header>
        <ReadingProgressBar />
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        context={settingsContext}
      />
    </>
  );
}

// ── Reading route nav helpers ────────────────────────────

const TOTAL_CHAPTERS = 114;
const TOTAL_PAGES = 604;

function SurahPickerNav({ surahSlug: slug }: { surahSlug: string }) {
  const id = surahIdFromSlug(slug) ?? 1;
  return (
    <>
      {id > 1 ? (
        <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(id - 1) }} search={{ ayah: undefined }}
          className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5L7 10L12 15" /></svg>
        </Link>
      ) : <div className="w-6" />}
      <SurahPicker currentSurahId={id} />
      {id < TOTAL_CHAPTERS ? (
        <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(id + 1) }} search={{ ayah: undefined }}
          className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 5L13 10L8 15" /></svg>
        </Link>
      ) : <div className="w-6" />}
    </>
  );
}

function PagePickerNav({ page, surahId }: { page: number; surahId: number }) {
  return (
    <>
      {page > 1 ? (
        <Link to="/page/$pageNumber" params={{ pageNumber: String(page - 1) }} search={{ ayah: undefined }}
          className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5L7 10L12 15" /></svg>
        </Link>
      ) : <div className="w-6" />}
      <SurahPicker currentSurahId={surahId} mode="page" currentPage={page} totalPages={TOTAL_PAGES} />
      {page < TOTAL_PAGES ? (
        <Link to="/page/$pageNumber" params={{ pageNumber: String(page + 1) }} search={{ ayah: undefined }}
          className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 5L13 10L8 15" /></svg>
        </Link>
      ) : <div className="w-6" />}
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const { session } = useRouteContext({ from: "__root__" });

  // Unified cross-device sync
  useSyncEngine(session);

  // Tema uygula + FOUC engelle
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // CSS loaded — reveal content
    document.documentElement.classList.remove("loading");
    document.documentElement.classList.add("loaded");
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  // Global Cmd+K / Ctrl+K → arama sayfası
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate({ to: "/search" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('loading')` }} />
        <style dangerouslySetInnerHTML={{ __html: `.loading{opacity:0}.loaded{opacity:1;transition:opacity .15s ease}` }} />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased overflow-x-hidden">
        <AppHeader />
        <AudioProvider />
        {children}
        <BottomNav />
        <Scripts />
      </body>
    </html>
  );
}
