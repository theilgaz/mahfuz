import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { resolveNestedKey } from "~/lib/i18n-utils";

interface StageCardProps {
  stageId: number;
  titleKey: string;
  descriptionKey: string;
  lessonCount: number;
  completedCount: number;
  isUnlocked: boolean;
}

export function StageCard({
  stageId,
  titleKey,
  descriptionKey,
  lessonCount,
  completedCount,
  isUnlocked,
}: StageCardProps) {
  const { t } = useTranslation();
  const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
  const isComplete = completedCount >= lessonCount && lessonCount > 0;
  const title = resolveNestedKey(t.learn as Record<string, any>, titleKey) || titleKey;
  const description = resolveNestedKey(t.learn as Record<string, any>, descriptionKey) || descriptionKey;

  const card = (
    <div
      className={`rounded-2xl border-2 p-4 transition-all sm:p-5 ${
        isComplete
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : isUnlocked
            ? "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]"
            : "border-[var(--theme-border)] bg-[var(--theme-bg)] opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Stage number */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${
            isComplete
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : isUnlocked
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-quaternary)]"
          }`}
        >
          {isComplete ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isUnlocked ? (
            stageId
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-[var(--theme-text)]">
            {title}
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
            {description}
          </p>

          {/* Progress */}
          {isUnlocked && lessonCount > 0 && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--theme-text-quaternary)]">
                  {completedCount}/{lessonCount} {t.learn.lessons}
                </span>
                {progress > 0 && (
                  <span className="font-medium text-[var(--theme-text-tertiary)]">
                    %{progress}
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-emerald-500" : "bg-primary-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isUnlocked) return card;

  return (
    <Link to="/learn/stage/$stageId" params={{ stageId: String(stageId) }}>
      {card}
    </Link>
  );
}
