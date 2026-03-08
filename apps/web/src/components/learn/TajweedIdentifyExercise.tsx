import { useState } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface TajweedIdentifyExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

/**
 * Parses arabicDisplay for tajweed highlight markers.
 * Supports two formats:
 *   1. Bracket markers: "بسم <<الله>> الرحمن". Text between << >> is highlighted
 *   2. Plain text: falls back to displaying the full text without highlight
 */
function renderHighlightedArabic(arabicDisplay: string) {
  const markerRegex = /<<(.+?)>>/;
  const match = arabicDisplay.match(markerRegex);

  if (match) {
    const before = arabicDisplay.slice(0, match.index);
    const highlighted = match[1];
    const after = arabicDisplay.slice((match.index ?? 0) + match[0].length);

    return (
      <>
        {before && <span>{before}</span>}
        <span className="rounded-md bg-amber-200/70 px-1 py-0.5 dark:bg-amber-700/40">
          {highlighted}
        </span>
        {after && <span>{after}</span>}
      </>
    );
  }

  // No markers, display as-is
  return <span>{arabicDisplay}</span>;
}

export function TajweedIdentifyExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: TajweedIdentifyExerciseProps) {
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

      {/* Arabic display with tajweed highlight */}
      {exercise.arabicDisplay && (
        <div className="mb-6 flex items-center justify-center rounded-xl bg-[var(--theme-bg)] py-6">
          <span
            className="arabic-text text-[48px] leading-none text-[var(--theme-text)]"
            dir="rtl"
          >
            {renderHighlightedArabic(exercise.arabicDisplay)}
          </span>
        </div>
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
