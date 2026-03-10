import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";

interface QuestResultsProps {
  totalExercises: number;
  correctCount: number;
  sevapPointEarned: number;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuestResults({
  totalExercises,
  correctCount,
  sevapPointEarned,
  onRetry,
  onContinue,
}: QuestResultsProps) {
  const { t } = useTranslation();
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100;
  const isPerfect = accuracy === 100;

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 text-[48px]">
          {isPerfect ? "🎉" : accuracy >= 70 ? "✅" : "📝"}
        </div>
        <h2 className="text-xl font-bold text-[var(--theme-text)]">
          {t.learn.quests.sessionComplete}
        </h2>
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
        <Button variant="secondary" fullWidth onClick={onRetry}>
          {t.learn.retry}
        </Button>
        <Button fullWidth onClick={onContinue}>
          {t.memorize.results.continue}
        </Button>
      </div>
    </div>
  );
}
