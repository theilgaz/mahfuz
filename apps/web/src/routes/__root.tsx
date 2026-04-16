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
import { RecitationBar } from "~/components/recitation/RecitationBar";
import { AudioProvider } from "~/components/reader/AudioProvider";
import { AudioBar } from "~/components/reader/AudioBar";
import { BottomNav } from "~/components/BottomNav";
import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useGamesFavoritesStore } from "~/stores/gamesFavorites.store";
import { SettingsPanel } from "~/components/reader/SettingsPanel";
import { SurahPicker } from "~/components/reader/SurahPicker";
import { VerseJumpDialog } from "~/components/reader/VerseJumpDialog";
import { SmartPlayButton } from "~/components/reader/SmartPlayButton";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";
import { LanguageSelector } from "~/components/LanguageSelector";
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
      { name: "theme-color", content: "#eef3f2" },
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
    <div className="fixed top-0 inset-x-0 z-50 h-0.5 bg-[var(--color-accent)] animate-pulse" role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
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
        className="px-5 py-2.5 rounded bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
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

const BreadcrumbChevron = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
    <path d="M7 4L13 10L7 16" />
  </svg>
);

function BreadcrumbNav({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="flex items-center gap-1 min-w-0 flex-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <BreadcrumbChevron />}
          {item.to ? (
            <Link to={item.to} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] shrink-0">
              {item.label}
            </Link>
          ) : (
            <span className="text-sm font-medium truncate">{item.label}</span>
          )}
        </span>
      ))}
      <div className="flex-1" />
    </div>
  );
}

function AppHeader() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [verseJumpOpen, setVerseJumpOpen] = useState(false);
  const { session } = useRouteContext({ from: "__root__" });

  const isHome = path === "/";
  const isAuth = path.startsWith("/auth");
  if (isAuth) return null;

  // Reading route detection
  const surahSlugMatch = path.match(/^\/surah\/(.+)$/);
  const pageNumMatch = path.match(/^\/page\/(\d+)$/);
  const isReadingRoute = !!(surahSlugMatch || pageNumMatch);
  const { data: surahsForJump } = useSurahs();
  const currentSurahId = surahSlugMatch ? (surahIdFromSlug(surahSlugMatch[1]) ?? 1) : 1;
  const currentAyahCount = surahsForJump.find((s) => s.id === currentSurahId)?.ayahCount ?? 286;

  const lastPosition = useReadingStore((s) => s.lastPosition);
  const currentPage = pageNumMatch ? parseInt(pageNumMatch[1], 10) : undefined;

  // Alifba sub-route tespiti
  const isAlifbaGame = path.startsWith("/alifba/games/");
  const isAlifbaSubRoute = path.startsWith("/alifba/") && path !== "/alifba/";

  // Game sub-route tespiti (e.g. /games/fill-blank)
  const isGameSubRoute = path.startsWith("/games/") && path !== "/games/" && path !== "/games";
  const gameTitle = isGameSubRoute
    ? path === "/games/fill-blank" ? t.gamesHub.fillBlankTitle
    : path === "/games/surah-guess" ? t.gamesHub.surahGuessTitle
    : path === "/games/verse-chain" ? t.gamesHub.verseChainTitle
    : path === "/games/word-meaning" ? t.wordMeaningGame.title
    : path === "/games/hexagon" ? t.hexagonGame.title
    : path === "/games/kelime-tahmini" ? t.gamesHub.kelimeTahminiTitle
    : path === "/games/ayah-2048" ? t.gamesHub.ayet2048Title
    : null
    : null;

  // Sayfa basligi (non-reading routes only)
  const title = isHome || isReadingRoute ? null
    : path === "/discover" ? t.hub.title
    : path === "/search" ? t.nav.search
    : path === "/profile" ? t.nav.profile
    : path === "/bookmarks" ? t.hub.bookmarks
    : (path === "/alifba" || path === "/alifba/") ? t.hub.alifba
    : path === "/hifz" ? t.hub.hifz
    : path.startsWith("/changelog") ? t.changelog.banner
    : isAlifbaGame ? t.alifba.games
    : isAlifbaSubRoute ? t.hub.alifba
    : path === "/qaida" || path === "/qaida/" ? t.hub.qaida
    : path.startsWith("/qaida/lesson/") ? t.hub.qaida
    : path.startsWith("/qaida/exam/") ? t.hub.qaidaExamTitle
    : isGameSubRoute ? null // handled by breadcrumb
    : path === "/games" || path === "/games/" ? t.gamesHub.title
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
        {/* Main header */}
        <header className="flex items-center h-11 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 w-full max-w-3xl mx-auto px-4">
          {/* Left: logo (always links home) */}
          {isHome ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <MahfuzLogo size={22} />
              <span className="text-sm font-semibold">Mahfuz</span>
            </div>
          ) : (
            <Link to="/" className="flex items-center shrink-0 hover:opacity-70 transition-opacity">
              <MahfuzLogo size={20} />
            </Link>
          )}

          {/* Center: title or reading nav */}
          {isReadingRoute ? (
            <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
              {surahSlugMatch ? (
                <SurahPickerNav surahSlug={surahSlugMatch[1]} />
              ) : pageNumMatch ? (
                <PagePickerNav page={currentPage!} />
              ) : null}
            </div>
          ) : isGameSubRoute && gameTitle ? (
            <BreadcrumbNav items={[{ label: t.gamesHub.title, to: "/games" }, { label: gameTitle }]} />
          ) : isAlifbaGame ? (
            <BreadcrumbNav items={[{ label: t.hub.alifba, to: "/alifba" }, { label: t.alifba.games }]} />
          ) : isAlifbaSubRoute ? (
            <BreadcrumbNav items={[{ label: t.hub.alifba, to: "/alifba" }, { label: title ?? "" }]} />
          ) : path.startsWith("/qaida/lesson/") ? (
            <BreadcrumbNav items={[{ label: t.hub.qaida, to: "/qaida" }, { label: title ?? "" }]} />
          ) : path.startsWith("/qaida/exam/") ? (
            <BreadcrumbNav items={[{ label: t.hub.qaida, to: "/qaida" }, { label: title ?? "" }]} />
          ) : path.startsWith("/khatm/") && path !== "/khatm" && path !== "/khatm/" ? (
            <BreadcrumbNav items={[{ label: "Hatim", to: "/khatm" }, { label: title ?? "" }]} />
          ) : path.startsWith("/analyse/") ? (
            <BreadcrumbNav items={[{ label: title ?? "" }]} />
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


          {/* Ayete git — sadece sure rotasında */}
          {surahSlugMatch && (
            <button
              onClick={() => setVerseJumpOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
              aria-label={t.reader.verseJumpTitle}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="7" x2="15" y2="7" />
                <line x1="5" y1="13" x2="15" y2="13" />
                <line x1="8" y1="4" x2="6" y2="16" />
                <line x1="14" y1="4" x2="12" y2="16" />
              </svg>
            </button>
          )}

          {/* Akıllı oynat — sadece okuma rotalarında */}
          {surahSlugMatch && (
            <SmartPlayButton mode="surah" surahId={surahIdFromSlug(surahSlugMatch[1]) ?? 1} />
          )}
          {pageNumMatch && currentPage && (
            <SmartPlayButton mode="page" pageNumber={currentPage} />
          )}

          {/* Game favorite star */}
          <GameFavoriteStar path={path} />

          {/* User avatar / login */}
          {session?.user ? (
            <Link
              to="/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full hover:ring-2 hover:ring-[var(--color-accent)]/30 transition-all shrink-0 overflow-hidden"
              aria-label={session.user.name || t.hub.profile}
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ""}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-semibold text-white">
                  {session.user.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
              aria-label={t.auth?.login || "Login"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          )}

        </div>
        </header>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        context={settingsContext}
      />
      {surahSlugMatch && (
        <VerseJumpDialog
          open={verseJumpOpen}
          onClose={() => setVerseJumpOpen(false)}
          surahId={currentSurahId}
          ayahCount={currentAyahCount}
        />
      )}
    </>
  );
}

// ── Game favorite star (header) ──────────────────────────

const GAME_ROUTE_TO_ID: Record<string, string> = {
  "/games/fill-blank": "kelime-doldurma",
  "/games/verse-chain": "ayet-zinciri",
  "/games/surah-guess": "sure-tanima",
  "/games/word-meaning": "kelime-anlami",
  "/games/hexagon": "hexagon-harf",
  "/games/kelime-tahmini": "kelime-tahmini",
  "/games/ayah-2048": "ayet-2048",
};

function GameFavoriteStar({ path }: { path: string }) {
  const gameId = GAME_ROUTE_TO_ID[path];
  const toggle = useGamesFavoritesStore((s) => s.toggle);
  const isFavorite = useGamesFavoritesStore((s) => gameId ? s.isFavorite(gameId) : false);

  if (!gameId) return null;

  return (
    <button
      onClick={() => toggle(gameId)}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        className={isFavorite ? "text-amber-400" : "text-[var(--color-text-secondary)]"}
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

// ── Reading route nav helpers ────────────────────────────

import { TOTAL_CHAPTERS, TOTAL_PAGES } from "@mahfuz/shared";
import { useSurahs } from "~/hooks/useQuranQuery";

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

function PagePickerNav({ page }: { page: number }) {
  const { data: surahs } = useSurahs();
  // Sayfadaki ilk sureyi pageStart'a göre türet (stale store'a güvenmeden)
  const surahId = surahs.reduce<number>((best, s) => {
    if (s.pageStart <= page && s.pageStart > (surahs.find(x => x.id === best)?.pageStart ?? 0)) return s.id;
    return best;
  }, 1);

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
  const { t } = useTranslation();
  const { session } = useRouteContext({ from: "__root__" });

  // Unified cross-device sync
  useSyncEngine(session);

  // Tema uygula + FOUC engelle + favicon/theme-color senkronize et
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // CSS loaded — reveal content
    document.documentElement.classList.remove("loading");
    document.documentElement.classList.add("loaded");

    // Read computed theme tokens (after setAttribute forces re-calc)
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue("--color-surface").trim() || "#e0eae6";
    const fg = cs.getPropertyValue("--color-accent").trim() || "#0d7377";

    // Generate SVG favicon with current theme colors
    const MEEM_PATH = "M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${bg}"/><svg x="4" y="1" width="24" height="30" viewBox="118 152 93 138"><path fill="${fg}" d="${MEEM_PATH}"/></svg></svg>`;
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (iconLink) iconLink.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    // Sync browser chrome color
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { m.content = bg; });
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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('loading')` }} />
        <style dangerouslySetInnerHTML={{ __html: `.loading{opacity:0}.loaded{opacity:1;transition:opacity .15s ease}` }} />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased overflow-x-hidden">
        <a href="#main-content" className="skip-link">
          {t.a11y?.skipToContent ?? "Skip to content"}
        </a>
        <AppHeader />
        <AudioProvider />
        <main id="main-content">
          {children}
        </main>
        <AudioBar />
        <RecitationBar />
        <BottomNav />
        <LanguageSelector />
        <Scripts />
      </body>
    </html>
  );
}
