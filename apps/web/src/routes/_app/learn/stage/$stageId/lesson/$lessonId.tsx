import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { getLessonById } from "@mahfuz/shared/data/learn/curriculum";
import { getLetterById } from "@mahfuz/shared/data/learn/alphabet";
import { useLearnStore } from "~/stores/useLearnStore";
import { useLessonSession } from "~/hooks/useLearn";
import { useTranslation } from "~/hooks/useTranslation";
import {
  LetterCard,
  LetterFormsDisplay,
  HarakatDisplay,
  ExerciseCard,
  SoundMatchExercise,
  WordBuildExercise,
  TajweedIdentifyExercise,
  LessonProgress,
  LessonResults,
} from "~/components/learn";
import type { Exercise } from "@mahfuz/shared/types";
import { resolveNestedKey } from "~/lib/i18n-utils";
import type { ExerciseAttempt, ContentBlock } from "@mahfuz/shared/types";

export const Route = createFileRoute(
  "/_app/learn/stage/$stageId/lesson/$lessonId",
)({
  component: LessonPage,
});

function LessonPage() {
  const { stageId, lessonId } = Route.useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = "anonymous";
  const store = useLearnStore();

  const { lessonData, completeLesson } = useLessonSession(lessonId, userId);
  const [showingContent, setShowingContent] = useState(true);
  const [results, setResults] = useState<{
    score: number;
    sevapPointEarned: number;
    isPerfect: boolean;
    isFirstCompletion: boolean;
  } | null>(null);

  // Start lesson on mount
  useState(() => {
    store.startLesson(lessonId);
  });

  const handleStartExercises = useCallback(() => {
    if (!lessonData || lessonData.lesson.exercises.length === 0) {
      // No exercises, complete immediately
      completeLesson().then((r) => {
        if (r) setResults(r);
      });
      return;
    }
    setShowingContent(false);
  }, [lessonData, completeLesson]);

  const handleAnswer = useCallback(
    (attempt: ExerciseAttempt) => {
      store.recordAttempt(attempt);

      if (!lessonData) return;
      const nextIndex = store.currentExerciseIndex + 1;

      if (nextIndex >= lessonData.lesson.exercises.length) {
        // All exercises done
        completeLesson().then((r) => {
          if (r) setResults(r);
        });
      } else {
        store.nextExercise();
      }
    },
    [store, lessonData, completeLesson],
  );

  if (!lessonData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const { stage, lesson } = lessonData;
  const lessonTitle = resolveNestedKey(t.learn as Record<string, any>, lesson.titleKey) || lesson.titleKey;

  // Results phase
  if (results) {
    const correctCount = store.attempts.filter((a) => a.isCorrect).length;
    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        <LessonResults
          totalExercises={lesson.exercises.length}
          correctCount={correctCount}
          sevapPointEarned={results.sevapPointEarned}
          isPerfect={results.isPerfect}
          isFirstCompletion={results.isFirstCompletion}
          onContinue={() => router.navigate({ to: "/learn/stage/$stageId", params: { stageId } })}
          onRetry={() => {
            store.startLesson(lessonId);
            setShowingContent(true);
            setResults(null);
          }}
        />
      </div>
    );
  }

  // Exercise phase
  if (!showingContent && lesson.exercises.length > 0) {
    const currentExercise = lesson.exercises[store.currentExerciseIndex];
    if (!currentExercise) return null;

    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-4">
          <Link
            to="/learn/stage/$stageId"
            params={{ stageId }}
            className="mb-3 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </Link>
          <LessonProgress
            current={store.currentExerciseIndex}
            total={lesson.exercises.length}
            sevapPoint={store.sessionSevapPoint}
          />
        </div>

        <ExerciseDispatch
          exercise={currentExercise}
          onAnswer={handleAnswer}
          exerciseNumber={store.currentExerciseIndex + 1}
          totalExercises={lesson.exercises.length}
        />
      </div>
    );
  }

  // Content phase
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <Link
        to="/learn/stage/$stageId"
        params={{ stageId }}
        className="mb-3 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.common.back}
      </Link>

      <h1 className="mb-6 text-lg font-bold text-[var(--theme-text)]">
        {lessonTitle}
      </h1>

      {/* Content blocks */}
      <div className="space-y-4">
        {lesson.contentBlocks.map((block, i) => (
          <ContentBlockRenderer key={i} block={block} />
        ))}
      </div>

      {/* Start exercises button */}
      <div className="mt-8">
        <button
          onClick={handleStartExercises}
          className="w-full rounded-xl bg-primary-600 px-6 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
        >
          {lesson.exercises.length > 0 ? t.learn.startExercises : t.learn.completeLesson}
        </button>
      </div>
    </div>
  );
}

function ExerciseDispatch(props: { exercise: Exercise; onAnswer: (a: ExerciseAttempt) => void; exerciseNumber: number; totalExercises: number }) {
  switch (props.exercise.type) {
    case "sound_match":
      return <SoundMatchExercise {...props} />;
    case "word_build":
      return <WordBuildExercise {...props} />;
    case "tajweed_identify":
      return <TajweedIdentifyExercise {...props} />;
    default:
      return <ExerciseCard {...props} />;
  }
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  const { t } = useTranslation();

  switch (block.type) {
    case "text": {
      const text = resolveNestedKey(t.learn as Record<string, any>, block.data.key) || block.data.key;
      return (
        <p className="text-[14px] leading-relaxed text-[var(--theme-text-secondary)]">
          {text}
        </p>
      );
    }
    case "letter_display": {
      const letter = getLetterById(block.data.letterId);
      if (!letter) return null;
      return <LetterCard letter={letter} showDetails />;
    }
    case "letter_forms": {
      const letter = getLetterById(block.data.letterId);
      if (!letter) return null;
      return <LetterFormsDisplay letter={letter} />;
    }
    case "harakat_table":
      return (
        <HarakatDisplay
          letterId={block.data.letterId}
          harakats={block.data.harakats}
        />
      );
    case "word_example":
      return (
        <div className="rounded-xl bg-[var(--theme-bg-primary)] p-4 text-center shadow-[var(--shadow-card)]">
          <p className="arabic-text text-3xl leading-relaxed text-[var(--theme-text)]" dir="rtl">
            {block.data.arabic}
          </p>
          <p className="mt-1 text-[13px] text-primary-600">{block.data.transliteration}</p>
          {block.data.meaning && (
            <p className="text-[12px] text-[var(--theme-text-tertiary)]">{block.data.meaning}</p>
          )}
        </div>
      );
    case "tip": {
      const text = resolveNestedKey(t.learn as Record<string, any>, block.data.key) || block.data.key;
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-[13px] text-amber-800 dark:text-amber-300">
            💡 {text}
          </p>
        </div>
      );
    }
    case "audio_example":
      return null; // Audio handled separately
    default:
      return null;
  }
}
