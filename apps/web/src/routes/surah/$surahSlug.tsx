/**
 * Surah route — /surah/al-fatiha ... /surah/an-nas
 * Also supports numeric IDs: /surah/1 → redirects to /surah/al-fatiha
 */

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SurahView } from "~/components/reader/SurahView";
import { ReadingHeader } from "~/components/reader/ReadingHeader";
import { SurahPicker } from "~/components/reader/SurahPicker";
import { AudioBar } from "~/components/reader/AudioBar";
import { surahDataQueryOptions, useSurahData } from "~/hooks/useQuranQuery";
import { useSettingsStore } from "~/stores/settings.store";
import { ScrollToTop } from "~/components/ScrollToTop";
import { FontSizeControl } from "~/components/reader/FontSizeControl";
import { surahIdFromSlug, surahSlug } from "~/lib/surah-slugs";

const TOTAL_CHAPTERS = 114;

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
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const { data: surahData } = useSurahData(id, translationSlugs);
  const firstPageNumber = surahData?.ayahs[0]?.pageNumber;

  return (
    <div className="min-h-screen relative pb-20">
      <ReadingHeader settingsContext={{ surahId: id, pageNumber: firstPageNumber }}>
        {/* Önceki sure */}
        {id > 1 ? (
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: surahSlug(id - 1) }}
            search={{ ayah: undefined }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label="Önceki sure"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5L7 10L12 15" />
            </svg>
          </Link>
        ) : (
          <div className="w-7" />
        )}

        {/* Sure picker */}
        <SurahPicker currentSurahId={id} />

        {/* Sonraki sure */}
        {id < TOTAL_CHAPTERS ? (
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: surahSlug(id + 1) }}
            search={{ ayah: undefined }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
            aria-label="Sonraki sure"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 5L13 10L8 15" />
            </svg>
          </Link>
        ) : (
          <div className="w-7" />
        )}
      </ReadingHeader>

      <SurahView surahId={id} highlightAyah={ayah} />
      <FontSizeControl />
      <AudioBar />
      <ScrollToTop />
    </div>
  );
}
