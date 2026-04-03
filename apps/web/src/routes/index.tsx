/**
 * Ana sayfa — devam et, alışkanlık, yer imleri, sure listesi.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettingsStore } from "~/stores/settings.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSurahs, surahsQueryOptions } from "~/hooks/useQuranQuery";
import { SurahList } from "~/components/SurahList";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";
import { SettingsButton } from "~/components/SettingsButton";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions()),
  component: HomePage,
  pendingComponent: HomePageSkeleton,
});

function HomePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-surface)] animate-pulse" />
          <div className="w-16 h-5 rounded bg-[var(--color-surface)] animate-pulse" />
        </div>
        <div className="flex-1" />
        <div className="w-20 h-8 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] animate-pulse" />
      </div>

      {/* Sure listesi skeleton */}
      <div className="space-y-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 rounded bg-[var(--color-surface)] animate-pulse" />
                <div className="w-16 h-5 rounded bg-[var(--color-surface)] animate-pulse" />
              </div>
              <div className="w-32 h-3 rounded bg-[var(--color-surface)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage() {
  const { session } = Route.useRouteContext();
  const { t } = useTranslation();
  const { readingMode, labsEnabled } = useSettingsStore(
    useShallow((s) => ({ readingMode: s.readingMode, labsEnabled: s.labsEnabled }))
  );
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const { data: surahs } = useSurahs();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Labs: Tilavet kartı */}
      {labsEnabled && (
        <Link
          to="/recite"
          className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)]/25 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <path d="M12 17v4" />
              <path d="M8 21h8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Tilavet</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Okuma pratiği yap</p>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold tracking-wide shrink-0">BETA</span>
        </Link>
      )}

      {/* Yer imleri */}
      {bookmarks.length > 0 && (() => {
        const surahMap = new Map(surahs.map((s) => [s.id, s]));
        const visible = bookmarks.slice(0, 8);
        const remaining = bookmarks.length - visible.length;
        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[var(--color-text-secondary)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
                  <path d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z" />
                </svg>
              </span>
              {visible.map((bm) => {
                const surah = surahMap.get(bm.surahId);
                const name = surah?.nameSimple || String(bm.surahId);
                const label = `${name} ${bm.ayahNumber}`;
                const linkProps = readingMode !== "mushaf"
                  ? { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(bm.surahId) }, search: { ayah: bm.ayahNumber } }
                  : { to: "/page/$pageNumber" as const, params: { pageNumber: String(bm.pageNumber) }, search: { ayah: undefined } };
                return (
                  <Link
                    key={`${bm.surahId}:${bm.ayahNumber}`}
                    {...linkProps}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs transition-colors"
                  >
                    {label}
                  </Link>
                );
              })}
              {remaining > 0 && (
                <Link
                  to="/bookmarks"
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs text-[var(--color-text-secondary)] transition-colors"
                >
                  +{remaining}
                </Link>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sure listesi + yüzen cüz butonu */}
      <SurahList surahs={surahs} />

    </div>
  );
}
