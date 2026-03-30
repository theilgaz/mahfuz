/**
 * Surah route — /surah/al-fatiha ... /surah/an-nas
 * Also supports numeric IDs: /surah/1 → redirects to /surah/al-fatiha
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { SurahView } from "~/components/reader/SurahView";
import { AudioBar } from "~/components/reader/AudioBar";
import { surahDataQueryOptions } from "~/hooks/useQuranQuery";
import { ScrollToTop } from "~/components/ScrollToTop";
import { FontSizeControl } from "~/components/reader/FontSizeControl";
import { surahIdFromSlug, surahSlug } from "~/lib/surah-slugs";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

export const Route = createFileRoute("/surah/$surahSlug")({
  validateSearch: (search: Record<string, unknown>) => ({
    ayah: search.ayah ? Number(search.ayah) : undefined,
  }),
  beforeLoad: ({ params }) => {
    const { surahSlug: slug } = params;

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
  errorComponent: RouteErrorFallback,
});

function SurahRoute() {
  const { surahSlug: slug } = Route.useParams();
  const { ayah } = Route.useSearch();
  const id = surahIdFromSlug(slug)!;

  return (
    <div className="min-h-screen relative pb-20">
      <SurahView surahId={id} highlightAyah={ayah} />
      <FontSizeControl />
      <AudioBar />
      <ScrollToTop />
    </div>
  );
}
