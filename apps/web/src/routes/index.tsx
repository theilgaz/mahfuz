/**
 * Ana sayfa — devam et, alışkanlık, yer imleri, sure listesi.
 */

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useReadingStore } from "~/stores/reading.store";
import { useSettingsStore } from "~/stores/settings.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSurahs, surahsQueryOptions } from "~/hooks/useQuranQuery";
import { SurahList } from "~/components/SurahList";
import { BottomNav } from "~/components/BottomNav";
import { signOut } from "~/lib/auth-client";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";
import { SettingsButton } from "~/components/SettingsButton";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const { t } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const { data: surahs } = useSurahs();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      {/* Başlık + arama */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <MahfuzLogo size={28} />
          Mahfuz
        </h1>
        <div className="flex-1" />
        <Link
          to="/search"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-colors shrink-0"
          aria-label={t.nav.search}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11L14 14" />
          </svg>
          <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">{t.nav.search}</span>
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            &#8984;K
          </kbd>
        </Link>

        <SettingsButton />

        {/* Auth */}
        {session ? (
          <button
            onClick={async () => {
              await signOut();
              await router.invalidate();
            }}
            className="flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs hover:bg-[var(--color-surface)] transition-colors"
            title={t.nav.signOut}
          >
            <span className="h-6 w-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[11px] font-medium text-white">
              {session.user.name?.[0]?.toUpperCase() || "?"}
            </span>
          </button>
        ) : (
          <Link
            to="/auth/login"
            search={{ redirect: "" }}
            className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)] transition-colors"
          >
            {t.nav.login}
          </Link>
        )}
      </div>

      {/* Devam et kartı */}
      {lastPosition && (() => {
        const surah = surahs.find((s) => s.id === lastPosition.surahId);
        const cls = "flex items-center gap-2.5 mb-4 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors";
        const inner = (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3l7 5-7 5V3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--color-text-secondary)]">{t.home.continueReading}</p>
              <p className="text-sm font-medium truncate">
                {surah ? surah.nameSimple : `${t.common.surah} ${lastPosition.surahId}`}
                <span className="text-[var(--color-text-secondary)] font-normal text-xs"> · {t.common.verse} {lastPosition.ayahNumber}</span>
              </p>
            </div>
            {surah && (
              <span className="text-lg shrink-0 leading-none" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                {surah.nameArabic}
              </span>
            )}
          </>
        );
        return readingMode === "list" ? (
          <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(lastPosition.surahId) }} search={{ ayah: lastPosition.ayahNumber }} className={cls}>
            {inner}
          </Link>
        ) : (
          <Link to="/page/$pageNumber" params={{ pageNumber: String(lastPosition.pageNumber) }} search={{ ayah: undefined }} className={cls}>
            {inner}
          </Link>
        );
      })()}

      {/* Yer imleri */}
      {bookmarks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--color-text-secondary)]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
                <path d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z" />
              </svg>
            </span>
            {bookmarks.slice(0, 10).map((bm) => (
              <Link
                key={`${bm.surahId}:${bm.ayahNumber}`}
                to="/page/$pageNumber"
                params={{ pageNumber: String(bm.pageNumber) }}
                search={{ ayah: undefined }}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs transition-colors"
              >
                {bm.surahId}:{bm.ayahNumber}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sure listesi + yüzen cüz butonu */}
      <SurahList surahs={surahs} />

      <BottomNav />
    </div>
  );
}
