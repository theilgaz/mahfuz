/**
 * Surah route — /surah/al-fatiha ... /surah/an-nas
 * Also supports numeric IDs: /surah/1 → redirects to /surah/al-fatiha
 */

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SurahView } from "~/components/reader/SurahView";
import { SettingsButton } from "~/components/SettingsButton";
import { AudioBar } from "~/components/reader/AudioBar";
import { surahDataQueryOptions, useSurahData } from "~/hooks/useQuranQuery";
import { useSettingsStore } from "~/stores/settings.store";
import { ScrollToTop } from "~/components/ScrollToTop";
import { surahIdFromSlug, surahSlug } from "~/lib/surah-slugs";

export const Route = createFileRoute("/surah/$surahSlug")({
  validateSearch: (search: Record<string, unknown>) => ({
    ayah: search.ayah ? Number(search.ayah) : undefined,
  }),
  beforeLoad: ({ params }) => {
    const { surahSlug: slug } = params;

    // Numeric ID → redirect to slug URL
    const numId = parseInt(slug, 10);
    if (!isNaN(numId) && numId >= 1 && numId <= 114) {
      throw redirect({
        to: "/surah/$surahSlug",
        params: { surahSlug: surahSlug(numId) },
        search: { ayah: undefined },
      });
    }

    const id = surahIdFromSlug(slug);
    if (!id) throw redirect({ to: "/" });
  },
  loader: ({ params, context }) => {
    const id = surahIdFromSlug(params.surahSlug)!;
    return context.queryClient.ensureQueryData(surahDataQueryOptions(id));
  },
  component: SurahRoute,
});

function SurahRoute() {
  const { surahSlug: slug } = Route.useParams();
  const { ayah } = Route.useSearch();
  const id = surahIdFromSlug(slug)!;
  const translationSlug = useSettingsStore((s) => s.translationSlug);
  const { data: surahData } = useSurahData(id, translationSlug);
  const firstPageNumber = surahData?.ayahs[0]?.pageNumber;

  return (
    <div className="min-h-screen relative">
      <SettingsButton
        context={{ surahId: id, pageNumber: firstPageNumber }}
        className="fixed top-4 right-4 z-20 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
      />

      <Link
        to="/"
        className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
        aria-label="Home"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10L10 3L17 10" />
          <path d="M5 9V17H8V12H12V17H15V9" />
        </svg>
      </Link>

      <SurahView surahId={id} highlightAyah={ayah} />
      <AudioBar />
      <ScrollToTop />
    </div>
  );
}
