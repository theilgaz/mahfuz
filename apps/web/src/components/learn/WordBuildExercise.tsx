import { useState } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface WordBuildExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

export function WordBuildExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: WordBuildExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const { t } = useTranslation();

  const handleSelect = (index: number) => {
    if (answered) return;

    setSelectedIndex(index);
    setAnswered(true);

    const isCorrect = exercise.options[index].isCorrect;

    // Record attempt after brief delay for feedback
    setTimeout(() => {
      onAnswer({
        exerciseId: exercise.id,
        selectedOptionIndex: index,
        isCorrect,
        timestamp: Date.now(),
      });
      // Reset for next exercise
      setSelectedIndex(null);
      setAnswered(false);
    }, 1200);
  };

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  // Extract transliteration hint from the correct option's text or from promptKey context
  const correctOption = exercise.options.find((o) => o.isCorrect);
  const transliterationHint = correctOption?.text ?? "";

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      {/* Exercise counter */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] text-[var(--theme-text-tertiary)]">
          {exerciseNumber}/{totalExercises}
        </span>
        <span className="text-[12px] font-medium text-primary-600">
          +{exercise.sevapPointReward} {t.learn.pointLabel}
        </span>
      </div>

      {/* Prompt */}
      <p className="mb-4 text-[14px] font-medium text-[var(--theme-text)]">
        {promptText}
      </p>

      {/* Arabic display */}
      {exercise.arabicDisplay && (
        <div className="mb-2 flex items-center justify-center rounded-xl bg-[var(--theme-bg)] py-6">
          <span
            className="arabic-text text-[48px] leading-none text-[var(--theme-text)]"
            dir="rtl"
          >
            {exercise.arabicDisplay}
          </span>
        </div>
      )}

      {/* Transliteration hint */}
      {transliterationHint && (
        <p className="mb-6 text-center text-[13px] italic text-[var(--theme-text-secondary)]">
          {transliterationHint}
        </p>
      )}

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((option, index) => {
          let bg = "bg-[var(--theme-bg)] hover:bg-[var(--theme-hover-bg)]";
          let border = "border-[var(--theme-border)]";
          let textColor = "text-[var(--theme-text)]";

          if (answered && selectedIndex === index) {
            if (option.isCorrect) {
              bg = "bg-emerald-50 dark:bg-emerald-950/30";
              border = "border-emerald-500";
              textColor = "text-emerald-700 dark:text-emerald-400";
            } else {
              bg = "bg-red-50 dark:bg-red-950/30";
              border = "border-red-500";
              textColor = "text-red-700 dark:text-red-400";
            }
          } else if (answered && option.isCorrect) {
            bg = "bg-emerald-50 dark:bg-emerald-950/30";
            border = "border-emerald-500";
            textColor = "text-emerald-700 dark:text-emerald-400";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={answered}
              className={`rounded-xl border-2 ${border} ${bg} px-4 py-3 text-center text-[14px] font-medium ${textColor} transition-all ${!answered ? "active:scale-[0.97]" : ""}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && selectedIndex !== null && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-center text-[13px] font-medium ${
            exercise.options[selectedIndex].isCorrect
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          {exercise.options[selectedIndex].isCorrect
            ? t.learn.correct
            : t.learn.incorrect}
        </div>
      )}
    </div>
  );
}
