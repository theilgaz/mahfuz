import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useReviewSession, useMemorizationDashboard } from "~/hooks/useMemorization";
import { ReviewCard, SessionResults } from "~/components/memorization";
import { GoalCelebration } from "~/components/memorization/GoalCelebration";
import { useMemorizationStore } from "~/stores/useMemorizationStore";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";

interface ReviewSearch {
  surahId?: number;
}

export const Route = createFileRoute("/_app/_protected/memorize/review")({
  component: ReviewPage,
  validateSearch: (search: Record<string, unknown>): ReviewSearch => ({
    surahId: search.surahId ? Number(search.surahId) : undefined,
  }),
});

function ReviewPage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId } = Route.useSearch();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const reviewGoal = useMemorizationStore((s) => s.reviewCardsPerDay);

  const {
    phase,
    sessionCards,
    currentCardIndex,
    sessionResults,
    revealedWords,
    totalWords,
    startReview,
    gradeCurrentCard,
    nextCard,
    revealNextWord,
    revealAll,
    setRevealState,
    resetSession,
  } = useReviewSession(userId);

  const { stats, refreshStats } = useMemorizationDashboard(userId);
  const { t } = useTranslation();

  // Auto-start review on mount
  useEffect(() => {
    if (phase === "idle") {
      startReview(surahId);
    }
  }, [phase, surahId, startReview]);

  const currentCard = sessionCards[currentCardIndex];

  const handleGrade = async (grade: 0 | 1 | 2 | 3 | 4 | 5) => {
    await gradeCurrentCard(grade);
    nextCard();
  };

  const handleContinue = () => {
    resetSession();
    refreshStats();
    navigate({ to: "/memorize" });
  };

  // Check goal completion when results are shown
  const reviewedTotal = (stats?.reviewedToday || 0) + sessionResults.length;
  const goalMet = reviewedTotal >= reviewGoal && !celebrationShown;

  // Results screen
  if (phase === "results") {
    // Show celebration if goal was met during this session
    if (goalMet && !showCelebration) {
      setShowCelebration(true);
      setCelebrationShown(true);
    }

    return (
      <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        {showCelebration && (
          <GoalCelebration
            onBackToPanel={handleContinue}
            onContinue={() => {
              setShowCelebration(false);
              // Restart a new batch
              resetSession();
              startReview(surahId);
            }}
          />
        )}
        <SessionResults results={sessionResults} onContinue={handleContinue} />
      </div>
    );
  }

  // Empty state
  if (phase === "reviewing" && !currentCard) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title={t.memorize.congratulations}
          description={t.memorize.allCardsDone}
          action={{ label: t.memorize.backToPanel, onClick: () => navigate({ to: "/memorize" }) }}
        />
      </div>
    );
  }

  // Loading state
  if (phase === "idle" || !currentCard) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={handleContinue}
            className="text-[13px] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
          >
            {t.common.close}
          </button>
          <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
            {currentCardIndex + 1} / {sessionCards.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{
              width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div key={currentCard.id} className="animate-fade-in">
        <ReviewCard
          card={currentCard}
          revealedWords={revealedWords}
          totalWords={totalWords}
          onRevealNext={revealNextWord}
          onRevealAll={revealAll}
          onGrade={handleGrade}
          onSetRevealState={setRevealState}
        />
      </div>
    </div>
  );
}
