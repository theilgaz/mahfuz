import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, useState, useEffect } from "react";
import { useMemorizationDashboard } from "~/hooks/useMemorization";
import { StatsOverview, SurahSelector, GoalsSettings } from "~/components/memorization";
import { memorizationRepository, type MemorizationCardEntry } from "@mahfuz/db";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";

export const Route = createFileRoute("/_app/_protected/memorize/")({
  component: MemorizePage,
});

function MemorizePage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const { stats, isLoading } = useMemorizationDashboard(userId);
  const { t } = useTranslation();
  const [allCards, setAllCards] = useState<MemorizationCardEntry[]>([]);
  useEffect(() => {
    memorizationRepository.getAllCards(userId).then(setAllCards);
  }, [userId, stats]);

  return (
    <div className="mx-auto max-w-4xl md:max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          {t.memorize.title}
        </h1>
        <div className="flex gap-2">
          {stats && stats.totalCards > 0 && (
            <Button
              variant="secondary"
              onClick={() => navigate({ to: "/memorize/practice" })}
            >
              {t.memorize.practice.button}
            </Button>
          )}
          {stats && stats.dueToday > 0 && (
            <Button
              onClick={() => navigate({ to: "/memorize/review" })}
            >
              {t.memorize.startReview} ({stats.dueToday})
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 animate-fade-in">
        {/* Stats or welcome */}
        {isLoading ? (
          <div className="space-y-4 rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton lines={2} />
          </div>
        ) : stats && stats.totalCards === 0 ? (
          <div className="animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="mb-2 text-lg font-semibold text-[var(--theme-text)]">
              {t.memorize.emptyTitle}
            </p>
            <p className="text-[14px] text-[var(--theme-text-tertiary)]">
              {t.memorize.emptyDesc}
            </p>
          </div>
        ) : stats ? (
          <>
            <StatsOverview stats={stats} cards={allCards} />
            <details className="group">
              <summary className="cursor-pointer list-none px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                {t.memorize.goals}
                <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <GoalsSettings userId={userId} />
            </details>
          </>
        ) : null}

        {/* Goals for new users (no details wrapper) */}
        {stats && stats.totalCards === 0 && <GoalsSettings userId={userId} />}

        {/* Surah list */}
        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-20" />
              ))}
            </div>
          }
        >
          <SurahSelector userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
