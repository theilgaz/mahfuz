import { useTranslation } from "~/hooks/useTranslation";

interface LessonProgressProps {
  current: number;
  total: number;
  sevapPoint: number;
}

export function LessonProgress({ current, total, sevapPoint }: LessonProgressProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Puan counter */}
      <span className="shrink-0 text-[12px] font-semibold text-primary-600">
        {sevapPoint} {t.learn.pointLabel}
      </span>
    </div>
  );
}
