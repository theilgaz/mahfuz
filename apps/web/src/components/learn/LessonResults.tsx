import { useTranslation } from "~/hooks/useTranslation";

interface LessonResultsProps {
  totalExercises: number;
  correctCount: number;
  sevapPointEarned: number;
  isPerfect: boolean;
  isFirstCompletion: boolean;
  onContinue: () => void;
  onRetry: () => void;
}

export function LessonResults({
  totalExercises,
  correctCount,
  sevapPointEarned,
  isPerfect,
  isFirstCompletion,
  onContinue,
  onRetry,
}: LessonResultsProps) {
  const { t } = useTranslation();
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100;

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 text-[48px]">
          {isPerfect ? "🎉" : accuracy >= 70 ? "✅" : "📝"}
        </div>
        <h2 className="text-xl font-bold text-[var(--theme-text)]">
          {isPerfect ? t.learn.perfectScore : t.learn.lessonComplete}
        </h2>
        {isFirstCompletion && (
          <p className="mt-1 text-[13px] text-primary-600">{t.learn.firstCompletion}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--theme-text)]">{totalExercises}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.total}</p>
        </div>
        <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.correct}</p>
        </div>
        <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">+{sevapPointEarned}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.pointLabel}</p>
        </div>
      </div>

      {/* Accuracy bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="text-[var(--theme-text-secondary)]">{t.memorize.results.accuracy}</span>
          <span className="font-semibold text-[var(--theme-text)]">%{accuracy}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              accuracy >= 80 ? "bg-emerald-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {accuracy < 100 && (
          <button
            onClick={onRetry}
            className="flex-1 rounded-xl border-2 border-[var(--theme-border)] px-4 py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
          >
            {t.learn.retry}
          </button>
        )}
        <button
          onClick={onContinue}
          className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
        >
          {t.memorize.results.continue}
        </button>
      </div>
    </div>
  );
}
