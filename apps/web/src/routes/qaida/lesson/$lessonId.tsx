/**
 * Qaida ders sayfasi - /qaida/lesson/:lessonId
 * Icerik bloklari -> Alistirmalar -> Tamamlanma ekrani
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getLessonWithStage, getNextLesson, getLessonIndex, resolveLearnKey } from "~/lib/qaida-helpers";
import { ContentBlockRenderer } from "~/components/qaida/ContentBlockRenderer";
import { ExerciseRunner } from "~/components/qaida/ExerciseRunner";
import { useQaidaStore } from "~/stores/qaida.store";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/qaida/lesson/$lessonId")({
  component: LessonPage,
});

type Phase = "content" | "exercises" | "complete";

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const learn = t.learn as Record<string, unknown>;
  const completeLesson = useQaidaStore((s) => s.completeLesson);

  const result = getLessonWithStage(lessonId);

  const [phase, setPhase] = useState<Phase>("content");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  if (!result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Ders bulunamadi</p>
        <Link to="/qaida" className="text-[var(--color-accent)] text-sm font-semibold">
          {t.learn.backToQaida}
        </Link>
      </div>
    );
  }

  const { lesson, stage } = result;
  const lessonIndex = getLessonIndex(lessonId, stage);
  const lessonTitle = resolveLearnKey(learn, lesson.titleKey);
  const next = getNextLesson(lessonId);

  const handleExerciseComplete = (s: number, tot: number) => {
    setScore(s);
    setTotal(tot);
    setPhase("complete");
    completeLesson(lessonId, stage.id, s);
  };

  const handleNext = () => {
    if (next) {
      navigate({ to: "/qaida/lesson/$lessonId", params: { lessonId: next.lesson.id } });
      setPhase("content");
      setScore(0);
      setTotal(0);
    } else {
      navigate({ to: "/qaida" });
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Title + progress */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          {lessonTitle}
        </h1>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.learn.lessonOf
            .replace("{current}", String(lessonIndex + 1))
            .replace("{total}", String(stage.lessons.length))}
        </span>
      </div>

      {/* Content phase */}
      {phase === "content" && (
        <>
          <div className="mb-6">
            {lesson.contentBlocks.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} />
            ))}
          </div>

          {lesson.exercises.length > 0 ? (
            <button
              onClick={() => setPhase("exercises")}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all bg-[var(--color-accent)]"
            >
              {t.learn.startPractice}
            </button>
          ) : (
            <button
              onClick={() => {
                completeLesson(lessonId, stage.id, 0);
                handleNext();
              }}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all bg-[var(--color-accent)]"
            >
              {next ? t.learn.nextLesson : t.learn.backToQaida}
            </button>
          )}
        </>
      )}

      {/* Exercise phase */}
      {phase === "exercises" && (
        <ExerciseRunner
          exercises={lesson.exercises}
          onComplete={handleExerciseComplete}
        />
      )}

      {/* Complete phase */}
      {phase === "complete" && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            {score === total ? t.learn.perfect : t.learn.lessonComplete}
          </h2>

          <p className="text-lg font-semibold text-[var(--color-accent)] mb-1">
            {score} / {total}
          </p>

          <p className="text-xs text-[var(--color-text-secondary)] mb-6">
            +{lesson.sevapPointOnComplete} {t.learn.sevapPoints}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-[var(--color-accent)]"
            >
              {next ? t.learn.nextLesson : t.learn.backToQaida}
            </button>
            <Link
              to="/qaida"
              className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-sm"
            >
              {t.learn.backToQaida}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
