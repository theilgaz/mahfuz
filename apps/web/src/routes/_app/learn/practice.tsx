import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useAdaptivePractice } from "~/hooks/useLearn";

export const Route = createFileRoute("/_app/learn/practice")({
  component: LearnPractice,
});

function LearnPractice() {
  const { t } = useTranslation();
  const userId = "anonymous";
  const { dueConcepts, isLoading } = useAdaptivePractice(userId);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/learn"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.learn.backToLearn}
      </Link>

      <h1 className="mb-4 text-xl font-bold text-[var(--theme-text)]">
        {t.learn.practiceTitle}
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : dueConcepts.length === 0 ? (
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mb-3 text-[48px]">✨</div>
          <h2 className="text-lg font-bold text-[var(--theme-text)]">{t.learn.noPractice}</h2>
          <p className="mt-2 text-[13px] text-[var(--theme-text-secondary)]">{t.learn.noPracticeDesc}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-[14px] text-[var(--theme-text-secondary)]">
            {dueConcepts.length} {t.learn.conceptsDue}
          </p>
        </div>
      )}
    </div>
  );
}
