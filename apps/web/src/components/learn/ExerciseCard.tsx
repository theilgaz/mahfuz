import { useState, useMemo } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

export function ExerciseCard({ exercise, onAnswer, exerciseNumber, totalExercises }: ExerciseCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const { t } = useTranslation();

  const shuffledOptions = useMemo(() => {
    const arr = [...exercise.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  const handleSelect = (index: number) => {
    if (answered) return;

    setSelectedIndex(index);
    setAnswered(true);

    const isCorrect = shuffledOptions[index].isCorrect;

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

  const promptText = (t.learn.exercises as Record<string, string>)[exercise.promptKey.replace("exercises.", "")] || exercise.promptKey;

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
        <div className="mb-6 flex items-center justify-center rounded-xl bg-[var(--theme-bg)] py-6">
          <span className="arabic-text text-[48px] leading-none text-[var(--theme-text)]" dir="rtl">
            {exercise.arabicDisplay}
          </span>
        </div>
      )}

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((option, index) => {
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
              aria-label={option.text}
              className={`rounded-xl border-2 ${border} ${bg} px-4 py-3 text-center text-[14px] font-medium ${textColor} transition-all ${!answered ? "active:scale-[0.97]" : ""}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && selectedIndex !== null && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-center text-[13px] font-medium ${
          shuffledOptions[selectedIndex].isCorrect
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        }`}>
          {exercise.options[selectedIndex].isCorrect
            ? t.learn.correct
            : t.learn.incorrect}
        </div>
      )}
    </div>
  );
}
