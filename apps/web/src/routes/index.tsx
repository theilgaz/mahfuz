/**
 * Ana sayfa — devam et, alışkanlık, yer imleri, sure listesi.
 */

import { createFileRoute } from "@tanstack/react-router";
import { surahsQueryOptions, dailyVerseQueryOptions } from "~/hooks/useQuranQuery";
import { HomeHero } from "~/components/minimal-ui/HomeHero";
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
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-surface)] animate-pulse" />
          <div className="w-16 h-5 rounded bg-[var(--color-surface)] animate-pulse" />
        </div>
        <div className="flex-1" />
        <div className="w-20 h-8 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] animate-pulse" />
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="mu-home">
      <HomeHero />
    </div>
  );
}
