/**
 * Sure fihristi — tüm 114 sure, filtre ve arama.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useSurahs, surahsQueryOptions } from "~/hooks/useQuranQuery";
import { SurahIndex } from "~/components/minimal-ui/SurahIndex";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/fihrist")({
  head: () => staticHead("fihrist"),
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions()),
  component: FihristPage,
  pendingComponent: FihristSkeleton,
});

function FihristSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
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

function FihristPage() {
  const { data: surahs } = useSurahs();
  return (
    <div className="mu-home">
      <SurahIndex surahs={surahs} />
    </div>
  );
}
