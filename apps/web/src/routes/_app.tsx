import { createFileRoute, Outlet, Link, useRouter, useMatches } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "~/lib/auth-client";
import { AudioProvider, AudioBar } from "~/components/audio";
import { useAudioStore } from "~/stores/useAudioStore";
import { usePreferencesStore, COLOR_PALETTES, ARABIC_FONTS } from "~/stores/usePreferencesStore";
import type { Theme, ColorPaletteId } from "~/stores/usePreferencesStore";
import { CommandPalette } from "~/components/CommandPalette";
import { HeaderSurahPicker } from "~/components/HeaderSurahPicker";
import type { Chapter } from "@mahfuz/shared/types";
import { TOTAL_PAGES } from "@mahfuz/shared/constants";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV_ITEMS = [
  { to: "/browse", label: "Mahfuz", icon: BookIcon },
  { to: "/memorize", label: "Ezberleme", icon: BrainIcon },
  { to: "/audio", label: "Dinleme", icon: HeadphonesIcon },
] as const;

function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const audioVisible = useAudioStore((s) => s.isVisible);
  const matches = useMatches();
  const queryClient = useQueryClient();

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Detect surah page and get chapter info from cache
  const surahMatch = matches.find((m) => m.routeId === "/_app/surah/$surahId");
  const surahId = (surahMatch?.params as { surahId?: string })?.surahId
    ? Number((surahMatch!.params as { surahId: string }).surahId)
    : null;
  const chapter = surahId
    ? queryClient.getQueryData<Chapter>(["chapter", surahId])
    : null;
  const allChapters = queryClient.getQueryData<Chapter[]>(["chapters"]);

  // Detect page route
  const pageMatch = matches.find((m) => m.routeId === "/_app/page/$pageNumber");
  const currentPage = (pageMatch?.params as { pageNumber?: string })?.pageNumber
    ? Number((pageMatch!.params as { pageNumber: string }).pageNumber)
    : null;

  // Detect juz detail route
  const juzMatch = matches.find((m) => m.routeId === "/_app/juz/$juzId");

  // Show inline search bar on detail pages
  const isDetailPage = !!(surahMatch || pageMatch || juzMatch);

  // Scroll-to-top
  const mainRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    await router.invalidate();
    router.navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--theme-bg)]">
      {/* Header */}
      <header className="glass sticky top-0 z-30 h-[88px] border-b border-[var(--theme-border)] px-4 sm:px-6">
        <div className="relative flex h-full items-center justify-between">
          {/* Left: Logo + Chapter/page context */}
          <div className="flex min-w-0 items-center gap-1">
            {/* Logo */}
            <Link to="/browse" className="mr-2 flex shrink-0 items-center gap-2 sm:mr-3">
              <img src="/images/mahfuz-logo.svg" alt="Mahfuz" className="logo-invert h-10 w-auto" />
            </Link>

            {/* Chapter/page prev/next (surah detail) */}
            {chapter && (
              <div className="relative flex items-center border-l border-[var(--theme-border)] pl-2 ml-2">
                <Link
                  to="/surah/$surahId"
                  params={{ surahId: String(Math.max(1, chapter.id - 1)) }}
                  className={`shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] ${chapter.id > 1 ? "text-[var(--theme-text-tertiary)]" : "pointer-events-none invisible"}`}
                  aria-label="Önceki sure"
                >
                  <ChevronLeftIcon />
                </Link>
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--theme-hover-bg)]"
                >
                  <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">
                    {chapter.id}
                  </span>
                  <span className="inline-grid text-base leading-none">
                    {allChapters?.map((c) => (
                      <span
                        key={c.id}
                        className={`arabic-text col-start-1 row-start-1 ${c.id === chapter.id ? "text-[var(--theme-text)]" : "invisible"}`}
                      >
                        {c.name_arabic}
                      </span>
                    ))}
                  </span>
                  <span className="hidden truncate text-[13px] font-medium text-[var(--theme-text-secondary)] sm:inline">
                    {chapter.translated_name.name}
                  </span>
                  <svg
                    className={`h-3 w-3 shrink-0 text-[var(--theme-text-tertiary)] transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <Link
                  to="/surah/$surahId"
                  params={{ surahId: String(Math.min(114, chapter.id + 1)) }}
                  className={`shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] ${chapter.id < 114 ? "text-[var(--theme-text-tertiary)]" : "pointer-events-none invisible"}`}
                  aria-label="Sonraki sure"
                >
                  <ChevronRightIcon />
                </Link>

                {pickerOpen && allChapters && (
                  <HeaderSurahPicker
                    currentChapterId={chapter.id}
                    chapters={allChapters}
                    onSelect={(id) => {
                      setPickerOpen(false);
                      router.navigate({
                        to: "/surah/$surahId",
                        params: { surahId: String(id) },
                      });
                    }}
                    onClose={() => setPickerOpen(false)}
                  />
                )}
              </div>
            )}

            {/* Page prev/next (page detail) */}
            {currentPage && !chapter && (
              <div className="flex items-center gap-1 border-l border-[var(--theme-border)] pl-2 ml-2">
                {currentPage > 1 && (
                  <Link
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(currentPage - 1) }}
                    className="rounded-md p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                    aria-label="Önceki sayfa"
                  >
                    <ChevronLeftIcon />
                  </Link>
                )}
                <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
                  Sayfa {currentPage}
                </span>
                {currentPage < TOTAL_PAGES && (
                  <Link
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(currentPage + 1) }}
                    className="rounded-md p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                    aria-label="Sonraki sayfa"
                  >
                    <ChevronRightIcon />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Center: Desktop nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                activeProps={{
                  className:
                    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-primary-600/10 text-primary-700 transition-colors",
                }}
                title={item.label}
              >
                <item.icon />
                <span className="text-[12px] font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right: Search + Settings + User + Menu */}
          <div className="flex items-center gap-1">
            <Link
              to="/bookmarks"
              className="hidden items-center justify-center rounded-lg p-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] lg:flex"
              activeProps={{
                className:
                  "hidden items-center justify-center rounded-lg p-1.5 text-primary-700 bg-primary-600/10 transition-colors lg:flex",
              }}
              title="Yer İmleri"
            >
              <BookmarkIcon />
            </Link>
            <ThemePopup />
            <FontPopup />

            {session ? (
              <div className="ml-1 hidden items-center gap-1 lg:flex">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-[var(--theme-hover-bg)]"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                      {session.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  aria-label="Çıkış yap"
                >
                  <LogOutIcon />
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="ml-1 hidden rounded-full bg-primary-600 px-4 py-1 text-xs font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97] lg:inline-block"
              >
                Giriş Yap
              </Link>
            )}

            {/* Mobile hamburger — rightmost */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] lg:hidden"
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            >
              <span className="flex h-4 w-5 flex-col justify-between">
                <span className={`h-[2px] w-full rounded-full bg-current transition-all duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`h-[2px] w-full rounded-full bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`h-[2px] w-full rounded-full bg-current transition-all duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Inline search bar on detail pages */}
      {isDetailPage && !paletteOpen && (
        <div className="border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mx-auto flex w-full max-w-[680px] items-center gap-2.5 rounded-xl bg-[var(--theme-input-bg)] px-3.5 py-2 text-left transition-colors hover:bg-[var(--theme-bg-primary)] hover:shadow-[var(--shadow-elevated)]"
          >
            <svg
              className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span className="flex-1 text-[14px] text-[var(--theme-text-tertiary)]">
              Sure, ayet veya sayfa ara...
            </span>
            <kbd className="hidden rounded-md bg-[var(--theme-hover-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-quaternary)] sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}

      {/* Page content */}
      <main ref={mainRef} className={`relative flex-1 overflow-y-auto ${audioVisible ? "pb-16 lg:pb-0" : ""}`}>
        <Outlet />
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-18 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-bg-primary)] shadow-[var(--shadow-elevated)] transition-all hover:shadow-[var(--shadow-modal)] active:scale-95 lg:bottom-6 lg:right-6"
            aria-label="Yukarı dön"
          >
            <svg className="h-5 w-5 text-[var(--theme-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </main>

      {/* Audio engine + player bar */}
      <AudioProvider />
      <AudioBar />

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[var(--theme-bg)] lg:hidden">
          {/* Menu header */}
          <div className="flex h-[88px] items-center justify-between border-b border-[var(--theme-border)] px-4 sm:px-6">
            <span className="text-lg font-semibold text-[var(--theme-text)]">Menü</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
              aria-label="Menüyü kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Navigation items */}
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-xl px-4 py-3.5 bg-primary-600/10 text-primary-700 transition-colors",
                  }}
                >
                  <item.icon />
                  <span className="text-[15px] font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-[var(--theme-border)]" />

            {/* Utility items */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPaletteOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                <SearchIcon />
                <span className="text-[15px] font-medium">Ara</span>
              </button>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-xl px-4 py-3.5 bg-primary-600/10 text-primary-700 transition-colors",
                }}
              >
                <SettingsIcon />
                <span className="text-[15px] font-medium">Ayarlar</span>
              </Link>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-[var(--theme-border)]" />

            {/* Auth section */}
            {session ? (
              <div className="space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                      {session.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                  <span className="text-[15px] font-medium">{session.user.name || "Profil"}</span>
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOutIcon />
                  <span className="text-[15px] font-medium">Çıkış Yap</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-primary-600 transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                <UserIcon />
                <span className="text-[15px] font-medium">Giriş Yap</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Header Popup Shell --

function usePopup() {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => { document.removeEventListener("mousedown", onClickOutside); document.removeEventListener("keydown", onEscape); };
  }, [open]);

  return { open, setOpen, popRef, btnRef };
}

// -- Theme Popup --

const QS_THEMES: { value: Theme; label: string; color: string; border: string }[] = [
  { value: "light", label: "Açık", color: "#ffffff", border: "#d2d2d7" },
  { value: "sepia", label: "Sepia", color: "#f5ead6", border: "#d4b882" },
  { value: "dark", label: "Koyu", color: "#1a1a1a", border: "#444" },
  { value: "dimmed", label: "Gece", color: "#22272e", border: "#444c56" },
];

function ThemePopup() {
  const { open, setOpen, popRef, btnRef } = usePopup();
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const setColorizeWords = usePreferencesStore((s) => s.setColorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const setColorPalette = usePreferencesStore((s) => s.setColorPalette);

  const currentTheme = QS_THEMES.find((t) => t.value === theme);

  return (
    <div className="relative hidden lg:flex">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors ${open ? "bg-[var(--theme-hover-bg)] text-[var(--theme-text)]" : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"}`}
        aria-label="Tema ayarları"
        aria-expanded={open}
      >
        <span className="h-4 w-4 rounded-full border-2" style={{ backgroundColor: currentTheme?.color, borderColor: currentTheme?.border }} />
      </button>

      {open && (
        <div ref={popRef} className="absolute right-0 top-full z-50 mt-2 w-56 animate-toolbar-in rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-3.5 shadow-[var(--shadow-float)]" style={{ backdropFilter: "saturate(180%) blur(20px)" }}>
          <div className="mb-3 flex items-center gap-3">
            {QS_THEMES.map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)} className="flex flex-col items-center gap-1" aria-label={t.label}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${theme === t.value ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`} style={{ backgroundColor: t.color }}>
                  {theme === t.value && <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke={t.value === "dark" || t.value === "dimmed" ? "#e5e5e5" : "#059669"} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="text-[10px] text-[var(--theme-text-tertiary)]">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-2.5">
            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">Kelime Renklendirme</span>
            <button onClick={() => setColorizeWords(!colorizeWords)} className={`relative h-[20px] w-[36px] rounded-full transition-colors ${colorizeWords ? "bg-primary-600" : "bg-[var(--theme-divider)]"}`} role="switch" aria-checked={colorizeWords}>
              <span className={`absolute top-[2px] left-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform ${colorizeWords ? "translate-x-[16px]" : ""}`} />
            </button>
          </div>
          {colorizeWords && (
            <div className="mt-2 flex items-center gap-2">
              {COLOR_PALETTES.map((p) => (
                <button key={p.id} onClick={() => setColorPalette(p.id as ColorPaletteId)} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${colorPaletteId === p.id ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`} aria-label={p.name} title={p.name}>
                  <svg width="16" height="16" viewBox="0 0 18 18"><rect x="1" y="1" width="7" height="7" rx="1.5" fill={p.colors[0]} /><rect x="10" y="1" width="7" height="7" rx="1.5" fill={p.colors[1]} /><rect x="1" y="10" width="7" height="7" rx="1.5" fill={p.colors[2]} /><rect x="10" y="10" width="7" height="7" rx="1.5" fill={p.colors[3]} /></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -- Font Popup --

const FONT_SHORT_LABELS: Record<string, string> = {
  "uthmani-hafs": "Mushaf · Klasik",
  "scheherazade-new": "Nesih · Zarif",
  "amiri": "Nesih · Matbaa",
  "noto-naskh-arabic": "Modern · Temiz",
  "rubik": "Modern · Yumuşak",
  "zain": "Modern · İnce",
  "reem-kufi": "Kûfi · Güçlü",
  "playpen-sans-arabic": "El Yazısı · Samimi",
};

function FontPopup() {
  const { open, setOpen, popRef, btnRef } = usePopup();
  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const setArabicFont = usePreferencesStore((s) => s.setArabicFont);

  // Lazy-load Google Fonts when popup opens
  useEffect(() => {
    if (!open) return;
    ARABIC_FONTS.forEach((f) => {
      if (f.source === "google" && f.googleUrl) {
        const id = `font-link-${f.id}`;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = f.googleUrl;
          document.head.appendChild(link);
        }
      }
    });
  }, [open]);

  return (
    <div className="relative hidden lg:flex">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors ${open ? "bg-[var(--theme-hover-bg)] text-[var(--theme-text)]" : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"}`}
        aria-label="Yazı tipi"
        aria-expanded={open}
      >
        <span className="arabic-text leading-none">ع</span>
      </button>

      {open && (
        <div ref={popRef} className="absolute right-0 top-full z-50 mt-2 w-60 animate-toolbar-in rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-2 shadow-[var(--shadow-float)]" style={{ backdropFilter: "saturate(180%) blur(20px)" }}>
          <div className="flex flex-col gap-0.5">
            {ARABIC_FONTS.map((f) => {
              const tag = FONT_SHORT_LABELS[f.id] ?? f.name;
              return (
                <button
                  key={f.id}
                  onClick={() => setArabicFont(f.id)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all ${arabicFontId === f.id ? "bg-primary-600/10" : "hover:bg-[var(--theme-hover-bg)]"}`}
                >
                  <div className="min-w-0 text-left">
                    <span className={`block text-[11px] font-medium leading-tight ${arabicFontId === f.id ? "text-primary-700" : "text-[var(--theme-text)]"}`}>{f.name}</span>
                    <span className="block text-[10px] leading-tight text-[var(--theme-text-quaternary)]">{tag}</span>
                  </div>
                  <span className="arabic-text shrink-0 text-[16px] leading-none text-[var(--theme-text)]" style={{ fontFamily: f.family }} dir="rtl">بِسْمِ ٱللَّهِ</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Icons (simple inline SVG) --

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
