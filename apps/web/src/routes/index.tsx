/**
 * Ana sayfa — devam et, alışkanlık, yer imleri, sure listesi.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useSurahs, surahsQueryOptions, dailyVerseQueryOptions } from "~/hooks/useQuranQuery";
import { HomeHero } from "~/components/minimal-ui/HomeHero";
import { SurahIndex } from "~/components/minimal-ui/SurahIndex";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/")({
  head: () => staticHead("home"),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(surahsQueryOptions()),
    context.queryClient.prefetchQuery(dailyVerseQueryOptions()),
  ]),
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
          <div key={i} className="flex items-center gap-3 px-3 py-3 rounded">
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
  const { data: surahs } = useSurahs();

  return (
    <div className="mu-home">
      <HomeHero />
      <SurahIndex surahs={surahs} />
    </div>
  );
}
