/**
 * Yer imleri sayfası — /bookmarks
 * Grouped by surah (default) or sorted by recent.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSurahs, surahsQueryOptions } from "~/hooks/useQuranQuery";
import { BookmarkRow } from "~/components/BookmarkRow";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/bookmarks")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions()),
  component: BookmarksPage,
});

type SortMode = "surah" | "recent";

function BookmarksPage() {
  const { t, locale } = useTranslation();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const { data: surahs } = useSurahs();
  const surahMap = useMemo(() => new Map(surahs.map((s) => [s.id, s])), [surahs]);
  const [sort, setSort] = useState<SortMode>("surah");

  // Grouped by surah
  const grouped = useMemo(() => {
    const map = new Map<number, typeof bookmarks>();
    for (const bm of bookmarks) {
      const arr = map.get(bm.surahId) ?? [];
      arr.push(bm);
      map.set(bm.surahId, arr);
    }
    // sort groups by surahId, verses within by ayahNumber
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([surahId, bms]) => ({
        surahId,
        surah: surahMap.get(surahId),
        bookmarks: bms.sort((a, b) => a.ayahNumber - b.ayahNumber),
      }));
  }, [bookmarks, surahMap]);

  // Flat list sorted by recent
  const recentSorted = useMemo(
    () => [...bookmarks].sort((a, b) => b.createdAt - a.createdAt),
    [bookmarks],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">{t.nav.bookmarks}</h1>
        {bookmarks.length > 0 && (
          <span className="text-xs text-[var(--color-text-secondary)]">
            {bookmarks.length}
          </span>
        )}
        <div className="flex-1" />
        {bookmarks.length > 0 && (
          <button
            onClick={() => setSort(sort === "surah" ? "recent" : "surah")}
            className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80 text-[var(--color-text-secondary)] transition-colors"
          >
            {sort === "surah" ? t.bookmarks.sortByRecent : t.bookmarks.sortBySurah}
          </button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--color-border)" strokeWidth="1.5" className="mx-auto mb-3">
            <path d="M8 4H24A2 2 0 0126 6V28L17 21L8 28V6A2 2 0 018 4Z" />
          </svg>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t.profile.noBookmarks}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {t.bookmarks.emptyHint}
          </p>
        </div>
      ) : sort === "surah" ? (
        /* Grouped by surah */
        <div className="space-y-4">
          {grouped.map(({ surahId, surah, bookmarks: bms }) => (
            <section key={surahId}>
              {/* Section header */}
              <div className="flex items-center gap-2 px-3 py-1.5 mb-0.5 sticky top-0 bg-[var(--color-bg)] z-10">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {surahId}. {surah?.nameSimple ?? `${t.common.surah} ${surahId}`}
                </span>
                {surah?.nameArabic && (
                  <span className="text-xs text-[var(--color-text-secondary)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                    {surah.nameArabic}
                  </span>
                )}
                <span className="text-[10px] text-[var(--color-text-secondary)] ml-auto">
                  {bms.length} {t.bookmarks.verses}
                </span>
              </div>

              {/* Rows */}
              {bms.map((bm, i) => (
                <BookmarkRow
                  key={`${bm.surahId}:${bm.ayahNumber}`}
                  surahId={bm.surahId}
                  ayahNumber={bm.ayahNumber}
                  pageNumber={bm.pageNumber}
                  surahName={getSurahName(bm.surahId, locale) || surah?.nameSimple || `${t.common.surah} ${bm.surahId}`}
                  surahNameArabic={surah?.nameArabic}
                  showDivider={i < bms.length - 1}
                />
              ))}
            </section>
          ))}
        </div>
      ) : (
        /* Sorted by recent */
        <div>
          {recentSorted.map((bm, i) => {
            const surah = surahMap.get(bm.surahId);
            return (
              <BookmarkRow
                key={`${bm.surahId}:${bm.ayahNumber}`}
                surahId={bm.surahId}
                ayahNumber={bm.ayahNumber}
                pageNumber={bm.pageNumber}
                surahName={getSurahName(bm.surahId, locale) || surah?.nameSimple || `${t.common.surah} ${bm.surahId}`}
                surahNameArabic={surah?.nameArabic}
                showDivider={i < recentSorted.length - 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
