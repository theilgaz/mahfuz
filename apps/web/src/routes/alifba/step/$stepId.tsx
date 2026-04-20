/**
 * Adim detay sayfasi -- /alifba/step/:stepId
 * Her adimin derslerini, icerik bloklarini ve alistirmalarini gosterir.
 */

import { useState, useMemo, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useQaidaStore } from "~/stores/qaida.store";
import { getStageForStep, resolveLearnKey } from "~/lib/qaida-helpers";
import { STEPS } from "~/lib/qaida-roadmap";
import { ContentBlockRenderer } from "~/components/qaida/ContentBlockRenderer";
import { ExerciseRunner } from "~/components/qaida/ExerciseRunner";
import { STEP_EXAMPLES } from "~/components/minimal-ui/AlifbaPage";
import type { Lesson } from "@mahfuz/shared/types";

export const Route = createFileRoute("/alifba/step/$stepId")({
  component: StepPage,
});

function StepPage() {
  const { stepId } = Route.useParams();
  const { t } = useTranslation();
  const stepNum = Number(stepId);
  const step = STEPS.find((s) => s.id === stepNum);
  const stage = getStageForStep(stepNum);
  const { lessonProgress, completeLesson } = useQaidaStore();
  const completedLessons = useMemo(
    () => new Set(Object.keys(lessonProgress)),
    [lessonProgress],
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showExercises, setShowExercises] = useState(false);

  const titleText =
    (t.hub as unknown as Record<string, string>)?.[step?.titleKey ?? ""] ??
    step?.titleKey ??
    "";
  const example = STEP_EXAMPLES[stepNum];

  if (!step || !stage) {
    return (
      <div className="mu-roadmap" style={{ textAlign: "center", paddingTop: 40 }}>
        <p style={{ color: "var(--mu-muted)" }}>
          {"Ad\u0131m bulunamad\u0131."}{" "}
          <Link to="/alifba/" style={{ color: "var(--mu-accent)" }}>{t.nav.back}</Link>
        </p>
      </div>
    );
  }

  if (stepNum === 1) {
    return (
      <div className="mu-roadmap" style={{ textAlign: "center", paddingTop: 40 }}>
        <Link to="/alifba/letters" style={{ color: "var(--mu-accent)" }}>
          {"Harfleri tan\u0131 sayfas\u0131na git"}
        </Link>
      </div>
    );
  }

  const activeLesson = activeLessonId
    ? stage.lessons.find((l) => l.id === activeLessonId)
    : null;

  const handleExerciseComplete = useCallback(
    (score: number, _total: number) => {
      if (activeLessonId) {
        completeLesson(activeLessonId, stage.id, score);
      }
      setShowExercises(false);
      setActiveLessonId(null);
    },
    [activeLessonId, stage.id, completeLesson],
  );

  // Exercise view
  if (activeLesson && showExercises) {
    return (
      <div className="mu-roadmap">
        <button onClick={() => { setShowExercises(false); setActiveLessonId(null); }} className="mu-letters-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4" /></svg>
          {t.nav.back}
        </button>
        <ExerciseRunner exercises={activeLesson.exercises} onComplete={handleExerciseComplete} />
      </div>
    );
  }

  // Lesson content view
  if (activeLesson) {
    const learn = t.learn as Record<string, unknown>;
    const lessonTitle = resolveLearnKey(learn, activeLesson.titleKey);

    return (
      <div className="mu-roadmap">
        <button onClick={() => setActiveLessonId(null)} className="mu-letters-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4" /></svg>
          {t.nav.back}
        </button>

        <h1 className="mu-step-lesson-title">{lessonTitle}</h1>

        <div className="mu-step-blocks">
          {activeLesson.contentBlocks.map((block, i) => (
            <ContentBlockRenderer key={i} block={block} />
          ))}
        </div>

        {activeLesson.exercises.length > 0 && (
          <button onClick={() => setShowExercises(true)} className="mu-btn primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
            {t.learn?.startExercises ?? "Al\u0131\u015Ft\u0131rmalara ba\u015Fla"} ({activeLesson.exercises.length})
          </button>
        )}
      </div>
    );
  }

  // Step overview
  const completedCount = stage.lessons.filter((l) => completedLessons.has(l.id)).length;
  const allDone = completedCount === stage.lessons.length;
  const prevStep = stepNum > 2 ? stepNum - 1 : null;
  const nextStep = stepNum < 10 ? stepNum + 1 : null;

  return (
    <div className="mu-roadmap">
      {/* Back */}
      <Link to="/alifba/" className="mu-letters-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4" /></svg>
        {t.nav.back}
      </Link>

      {/* Step header */}
      <div className="mu-step-header">
        <div className="mu-step-meta">
          <span className="mu-step-num">{stepNum}. {"Ad\u0131m"}</span>
          {allDone && <span className="mu-step-badge">{"Tamamland\u0131"}</span>}
        </div>
        <h1 className="mu-step-title">{titleText}</h1>

        {/* Description first, then examples */}
        {example && (
          <>
            <p className="mu-tl-hint" style={{ marginTop: 6 }}>{example.desc}</p>
            <div className="mu-tl-words" dir="rtl" style={{ marginTop: 8 }}>
              {example.words.map(([ar, lat], wi) => (
                <div key={wi} className={`mu-tl-word ${wi % 2 === 0 ? "a" : "b"}`}>
                  <span className="mu-tl-word-ar">{ar}</span>
                  <span className="mu-tl-word-lat">{lat}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Progress */}
      <div className="mu-step-progress-header">
        <span>Dersler</span>
        <span>{completedCount} / {stage.lessons.length}</span>
      </div>
      <div className="mu-letters-progress" style={{ marginBottom: 16 }}>
        <div className="mu-letters-progress-fill" style={{ width: `${(completedCount / stage.lessons.length) * 100}%` }} />
      </div>

      {/* Lessons list */}
      <div className="mu-step-lessons">
        {stage.lessons.map((lesson, i) => {
          const isDone = completedLessons.has(lesson.id);
          return (
            <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)} className={`mu-step-lesson ${isDone ? "done" : ""}`}>
              <div className={`mu-step-lesson-dot ${isDone ? "done" : ""}`}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="mu-step-lesson-text"><LessonTitle lesson={lesson} /></span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mu-step-lesson-arrow"><path d="M5 3l4 4-4 4" /></svg>
            </button>
          );
        })}
      </div>

      {/* Exam link */}
      {step.examLink && (
        <Link to={step.examLink as string} className="mu-btn primary" style={{ justifyContent: "center", marginTop: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
          {t.hub?.qaidaExamStart ?? "S\u0131nava gir"}
        </Link>
      )}

      {/* Prev/Next */}
      <div className="mu-step-nav">
        {prevStep ? (
          <Link to="/alifba/step/$stepId" params={{ stepId: String(prevStep) }} className="mu-step-nav-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
            {prevStep}. {"Ad\u0131m"}
          </Link>
        ) : <div />}
        {nextStep ? (
          <Link to="/alifba/step/$stepId" params={{ stepId: String(nextStep) }} className="mu-step-nav-link">
            {nextStep}. {"Ad\u0131m"}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3l4 4-4 4" /></svg>
          </Link>
        ) : (
          <Link to="/tajweed" className="mu-step-nav-link accent">
            Tecvid
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3l4 4-4 4" /></svg>
          </Link>
        )}
      </div>
    </div>
  );
}

function LessonTitle({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const learn = t.learn as Record<string, unknown>;
  return <>{resolveLearnKey(learn, lesson.titleKey)}</>;
}
