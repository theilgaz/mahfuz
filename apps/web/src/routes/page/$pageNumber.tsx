/**
 * Mushaf sayfası route'u — /page/1 ... /page/604
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { MushafPage } from "~/components/reader/MushafPage";
import { ReadingHeader } from "~/components/reader/ReadingHeader";
import { SurahPicker } from "~/components/reader/SurahPicker";
import { AudioBar } from "~/components/reader/AudioBar";
import { pageDataQueryOptions, usePageData } from "~/hooks/useQuranQuery";
import { useSettingsStore } from "~/stores/settings.store";
import { ScrollToTop } from "~/components/ScrollToTop";
import { FontSizeControl } from "~/components/reader/FontSizeControl";
import { useSwipeNav } from "~/hooks/useSwipeNav";
import { useTranslation } from "~/hooks/useTranslation";

const TOTAL_PAGES = 604;

export const Route = createFileRoute("/page/$pageNumber")({
  validateSearch: (search: Record<string, unknown>) => ({
    ayah: (search.ayah as string) || undefined,
  }),
  loader: ({ params, context }) => {
    const pageNumber = parseInt(params.pageNumber, 10);
    return context.queryClient.ensureQueryData(pageDataQueryOptions(pageNumber));
  },
  component: PageRoute,
});

function PageRoute() {
  const { pageNumber } = Route.useParams();
  const { ayah } = Route.useSearch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const page = parseInt(pageNumber, 10);
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const { data: pageData } = usePageData(page, translationSlugs);
  const firstSurahId = pageData?.surahGroups[0]?.surah.id;

  const goTo = useCallback(
    (p: number) => {
      if (p < 1 || p > TOTAL_PAGES) return;
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) }, search: { ayah: undefined } });
    },
    [navigate],
  );

  // Klavye navigasyonu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(page + 1);
      if (e.key === "ArrowRight") goTo(page - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, goTo]);

  // Swipe navigasyonu
  useSwipeNav({
    onSwipeLeft: () => goTo(page + 1),
    onSwipeRight: () => goTo(page - 1),
  });

  return (
    <div className="min-h-screen relative pb-20">
      <ReadingHeader settingsContext={{ surahId: firstSurahId, pageNumber: page }}>
        {/* Önceki sayfa */}
        {page > 1 ? (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: String(page - 1) }}
            search={{ ayah: undefined }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label="Önceki sayfa"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5L7 10L12 15" />
            </svg>
          </Link>
        ) : (
          <div className="w-7" />
        )}

        {/* Sayfa picker */}
        <SurahPicker
          currentSurahId={firstSurahId ?? 1}
          mode="page"
          currentPage={page}
          totalPages={TOTAL_PAGES}
        />

        {/* Sonraki sayfa */}
        {page < TOTAL_PAGES ? (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: String(page + 1) }}
            search={{ ayah: undefined }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label="Sonraki sayfa"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 5L13 10L8 15" />
            </svg>
          </Link>
        ) : (
          <div className="w-7" />
        )}
      </ReadingHeader>

      <MushafPage pageNumber={page} highlightAyah={ayah} />
      <FontSizeControl />
      <AudioBar />
      <ScrollToTop />
    </div>
  );
}
