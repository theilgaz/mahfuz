import type { SessionResult } from "~/stores/useMemorizationStore";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";

interface SessionResultsProps {
  results: SessionResult[];
  onContinue: () => void;
}

export function SessionResults({ results, onContinue }: SessionResultsProps) {
  const { t } = useTranslation();
  const total = results.length;
  const correct = results.filter((r) => r.wasCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="animate-scale-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="mb-6 text-center text-xl font-bold text-[var(--theme-text)]">
        {t.memorize.results.title}
      </h2>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--theme-text)]">
            {total}
          </p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.total}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{correct}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.correct}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-600">{accuracy}%</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.accuracy}
          </p>
        </div>
      </div>

      {/* Per-card breakdown */}
      <div className="mb-6 divide-y divide-[var(--theme-divider)] rounded-xl bg-[var(--theme-bg)] p-1">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2"
          >
            <span className="text-[13px] tabular-nums text-[var(--theme-text-secondary)]">
              {r.verseKey}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                r.wasCorrect
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {r.grade}/5
            </span>
          </div>
        ))}
      </div>

      <Button size="lg" fullWidth onClick={onContinue}>
        {t.memorize.results.continue}
      </Button>
    </div>
  );
}
