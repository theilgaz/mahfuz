import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { getQuestById } from "@mahfuz/shared/data/learn/quests";
import { useLearnStore } from "~/stores/useLearnStore";
import { useQuestSession } from "~/hooks/useQuest";
import { useTranslation } from "~/hooks/useTranslation";
import { QuestExerciseCard, QuestResults } from "~/components/learn";
import { LessonProgress } from "~/components/learn";

export const Route = createFileRoute("/_app/learn/quest/$questId")({
  component: QuestPage,
});

function QuestPage() {
  const { questId } = Route.useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const store = useLearnStore();

  const {
    quest,
    progress,
    exercises,
    isLoading,
    startSession,
    recordAnswer,
    nextExercise,
    finishSession,
  } = useQuestSession(questId, "anonymous");

  const [sessionResult, setSessionResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
  } | null>(null);

  const handleStartSession = useCallback(() => {
    startSession();
  }, [startSession]);

  const handleAnswer = useCallback(
    (selectedWordId: string, isCorrect: boolean) => {
      recordAnswer(store.currentExerciseIndex, selectedWordId, isCorrect);

      const nextIndex = store.currentExerciseIndex + 1;
      if (nextIndex >= exercises.length) {
        finishSession().then((result) => {
          if (result) setSessionResult(result);
        });
      } else {
        nextExercise();
      }
    },
    [store.currentExerciseIndex, exercises.length, recordAnswer, nextExercise, finishSession],
  );

  const handleRetry = useCallback(() => {
    setSessionResult(null);
    startSession();
  }, [startSession]);

  const handleContinue = useCallback(() => {
    router.navigate({ to: "/learn" });
  }, [router]);

  if (!quest) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[14px] text-[var(--theme-text-secondary)]">Quest not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Results phase
  if (sessionResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        <QuestResults
          totalExercises={sessionResult.total}
          correctCount={sessionResult.correctCount}
          sevapPointEarned={sessionResult.correctCount * quest.sevapPointPerCorrect}
          onRetry={handleRetry}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // Quest phase (exercises active)
  if (store.phase === "quest" && exercises.length > 0) {
    const currentExercise = exercises[store.currentExerciseIndex];
    if (!currentExercise) return null;

    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-4">
          <Link
            to="/learn"
            className="mb-3 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </Link>
          <LessonProgress
            current={store.currentExerciseIndex}
            total={exercises.length}
            sevapPoint={store.sessionSevapPoint}
          />
        </div>

        <QuestExerciseCard
          exercise={currentExercise}
          exerciseNumber={store.currentExerciseIndex + 1}
          totalExercises={exercises.length}
          sevapPointPerCorrect={quest.sevapPointPerCorrect}
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  // Info phase (landing)
  const letterChars: Record<number, string> = { 2: "ب", 3: "ت", 4: "ث" };
  const familyDisplay = quest.letterIds.map((id) => letterChars[id] || "").join(" ");
  const totalWords = quest.wordBank.length;
  const learnedWords = progress?.wordsCorrect.length || 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
      {/* Back link */}
      <Link
        to="/learn"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.common.back}
      </Link>

      {/* Quest info card */}
      <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        {/* Letter family display */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
            <span className="arabic-text text-2xl font-bold text-amber-700 dark:text-amber-400" dir="rtl">
              {familyDisplay}
            </span>
          </div>
        </div>

        {/* Title + description */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-[var(--theme-text)]">
            {t.learn.quests.ba.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--theme-text-secondary)]">
            {t.learn.quests.ba.desc}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-[var(--theme-text-tertiary)]">
              {learnedWords}/{totalWords} {t.learn.quests.wordsLearned}
            </span>
            {learnedWords > 0 && (
              <span className="font-medium text-[var(--theme-text)]">
                %{Math.round((learnedWords / totalWords) * 100)}
              </span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${totalWords > 0 ? (learnedWords / totalWords) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        {progress && progress.sessionsCompleted > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--theme-text)]">
                {progress.sessionsCompleted}
              </p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                {t.learn.quests.sessions}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--theme-text)]">
                %{progress.bestSessionScore}
              </p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                {t.learn.quests.bestScore}
              </p>
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStartSession}
          className="w-full rounded-xl bg-primary-600 px-6 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
        >
          {t.learn.quests.startSession}
        </button>
      </div>
    </div>
  );
}
