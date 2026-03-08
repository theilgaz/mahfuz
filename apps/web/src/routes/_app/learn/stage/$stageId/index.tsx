import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CURRICULUM, getStageById } from "@mahfuz/shared/data/learn/curriculum";
import { useStageUnlockStatus } from "~/hooks/useLearn";
import { useTranslation } from "~/hooks/useTranslation";
import { useStagePrefetch } from "~/hooks/useLearnAudio";
import { useState, useEffect } from "react";
import { resolveNestedKey } from "~/lib/i18n-utils";
import { learnRepository } from "@mahfuz/db";
import type { LessonProgressEntry } from "@mahfuz/db";

export const Route = createFileRoute("/_app/learn/stage/$stageId/")({
  component: StageDetail,
});

function StageDetail() {
  const { stageId } = Route.useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = "anonymous";
  const stageIdNum = Number(stageId);
  const stage = getStageById(stageIdNum);
  const { unlockedStages } = useStageUnlockStatus(userId);
  const [lessonProgress, setLessonProgress] = useState<Map<string, LessonProgressEntry>>(new Map());
  useStagePrefetch(stage);

  useEffect(() => {
    if (!stage) return;
    learnRepository.getAllProgressForStage(userId, stageIdNum).then((entries) => {
      const map = new Map<string, LessonProgressEntry>();
      for (const e of entries) map.set(e.lessonId, e);
      setLessonProgress(map);
    });
  }, [userId, stageIdNum, stage]);

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--theme-text-secondary)]">{t.error.notFound}</p>
      </div>
    );
  }

  if (!unlockedStages.has(stageIdNum)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mb-3 text-[48px]">🔒</div>
          <h2 className="text-lg font-bold text-[var(--theme-text)]">{t.learn.stageLocked}</h2>
          <p className="mt-2 text-[13px] text-[var(--theme-text-secondary)]">
            {t.learn.stageLockedDesc}
          </p>
          <Link
            to="/learn"
            className="mt-4 inline-block rounded-xl bg-primary-600 px-6 py-2.5 text-[14px] font-medium text-white hover:bg-primary-700"
          >
            {t.learn.backToLearn}
          </Link>
        </div>
      </div>
    );
  }

  const title = resolveNestedKey(t.learn as Record<string, any>, stage.titleKey) || stage.titleKey;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <Link
        to="/learn"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.learn.backToLearn}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-[13px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
            {stageIdNum}
          </span>
          <h1 className="text-xl font-bold text-[var(--theme-text)]">{title}</h1>
        </div>
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        {stage.lessons.map((lesson, index) => {
          const progress = lessonProgress.get(lesson.id);
          const isCompleted = progress?.status === "completed";
          const lessonTitle = resolveNestedKey(t.learn as Record<string, any>, lesson.titleKey) || `${t.learn.lesson} ${index + 1}`;

          return (
            <Link
              key={lesson.id}
              to="/learn/stage/$stageId/lesson/$lessonId"
              params={{ stageId: String(stageIdNum), lessonId: lesson.id }}
              className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4 transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.99]"
            >
              {/* Status icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-quaternary)]"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[12px] font-medium">{index + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--theme-text)]">
                  {lessonTitle}
                </p>
                <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                  {lesson.exercises.length} {lesson.exercises.length === 1 ? t.learn.exerciseCount : t.learn.exerciseCountPlural} · {lesson.sevapPointOnComplete} {t.learn.pointLabel}
                </p>
              </div>

              {/* Score */}
              {isCompleted && progress && (
                <span className="text-[12px] font-semibold text-emerald-600">
                  %{progress.score}
                </span>
              )}

              {/* Chevron */}
              <svg className="h-4 w-4 shrink-0 text-[var(--theme-text-quaternary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
