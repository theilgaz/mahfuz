/**
 * Mushaf sayfası route'u — /sayfa/1 ... /sayfa/604
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { MushafPage } from "~/components/reader/MushafPage";
import { SettingsButton } from "~/components/SettingsButton";
import { AudioBar } from "~/components/reader/AudioBar";
import { pageDataQueryOptions, usePageData } from "~/hooks/useQuranQuery";
import { useSettingsStore } from "~/stores/settings.store";
import { ScrollToTop } from "~/components/ScrollToTop";

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
  const page = parseInt(pageNumber, 10);
  const translationSlug = useSettingsStore((s) => s.translationSlug);
  const { data: pageData } = usePageData(page, translationSlug);
  const firstSurahId = pageData?.surahGroups[0]?.surah.id;

  return (
    <div className="min-h-screen relative">
      {/* Ayar butonu */}
      <SettingsButton
        context={{ surahId: firstSurahId, pageNumber: page }}
        className="fixed top-4 right-4 z-20 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
      />

      {/* Ana sayfaya dön */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
        aria-label="Ana sayfa"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10L10 3L17 10" />
          <path d="M5 9V17H8V12H12V17H15V9" />
        </svg>
      </Link>

      {/* Mushaf sayfası */}
      <MushafPage pageNumber={page} highlightAyah={ayah} />

      {/* Audio bar */}
      <AudioBar />

      <ScrollToTop />
    </div>
  );
}
