/**
 * Çoktan seçmeli alıştırma akışı.
 * Soruları sırayla gösterir, geri bildirim verir, sonunda onComplete çağırır.
 */

import { useState, useCallback, useMemo } from "react";
import type { Exercise, ExerciseOption } from "@mahfuz/shared/types";
import { resolveLearnKey } from "~/lib/qaida-helpers";
import { useTranslation } from "~/hooks/useTranslation";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { LetterTapExercise } from "./LetterTapExercise";
import { WordBuildExercise } from "./WordBuildExercise";
import { MatchingExercise } from "./MatchingExercise";
import { FillBlankExercise } from "./FillBlankExercise";

/** Harf seçme alıştırması mı? */
const TAP_PROMPTS: Record<string, "sukun" | "shadda"> = {
  "exercises.findSukun": "sukun",
  "exercises.countSukun": "sukun",
  "exercises.findShadda": "shadda",
};

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tüm alıştırmalar için seçenekleri bir kez karıştır */
function shuffleAllOptions(exercises: Exercise[]): ExerciseOption[][] {
  return exercises.map((ex) => shuffle(ex.options));
}

interface ExerciseRunnerProps {
  exercises: Exercise[];
  onComplete: (score: number, total: number) => void;
}

export function ExerciseRunner({ exercises, onComplete }: ExerciseRunnerProps) {
  const { t } = useTranslation();
  const learn = t.learn as Record<string, unknown>;
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const exercise = exercises[current];
  const total = exercises.length;
  const shuffledOptions = useMemo(() => shuffleAllOptions(exercises), [exercises]);
  const options = shuffledOptions[current];

  const handleAnswer = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);

      const isCorrect = options[idx].isCorrect;
      if (isCorrect) {
        playCorrect();
        setScore((s) => s + 1);
      } else {
        playWrong();
      }

      setTimeout(() => {
        if (current + 1 >= total) {
          onComplete(isCorrect ? score + 1 : score, total);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, exercise, current, total, score, onComplete],
  );

  const prompt = resolveLearnKey(learn, exercise.promptKey);
  const tapType = TAP_PROMPTS[exercise.promptKey];

  const handleTapComplete = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) setScore((s) => s + 1);
      if (current + 1 >= total) {
        onComplete(isCorrect ? score + 1 : score, total);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
      }
    },
    [current, total, score, onComplete],
  );

  return (
    <div>
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-[var(--color-border)] mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {current + 1} / {total}
        </span>
        <span className="text-xs font-medium text-[var(--color-accent)]">
          {t.learn.score}: {score}
        </span>
      </div>

      {/* Exercise type dispatch */}
      {tapType && exercise.arabicDisplay ? (
        <LetterTapExercise
          key={current}
          arabicDisplay={exercise.arabicDisplay}
          targetType={tapType}
          prompt={prompt}
          onComplete={handleTapComplete}
        />
      ) : (exercise.type === "word_build" || exercise.type === "letter_order") && exercise.letters?.length ? (
        <WordBuildExercise
          key={current}
          exercise={exercise}
          prompt={prompt}
          onComplete={handleTapComplete}
        />
      ) : exercise.type === "matching" && exercise.pairs?.length ? (
        <MatchingExercise
          key={current}
          exercise={exercise}
          prompt={prompt}
          onComplete={handleTapComplete}
        />
      ) : exercise.type === "fill_blank" && exercise.contextDisplay ? (
        <FillBlankExercise
          key={current}
          exercise={exercise}
          prompt={prompt}
          onComplete={handleTapComplete}
        />
      ) : (
        <>
          {/* Prompt */}
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
            {prompt}
          </p>

          {/* Arabic display */}
          {exercise.arabicDisplay && (
            <div className="flex justify-center mb-8">
              <span
                className="text-6xl leading-[1.8]"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {exercise.arabicDisplay}
              </span>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-2.5">
            {options.map((opt, idx) => {
              const isCorrect = opt.isCorrect;
              const isSelected = selected === idx;

              let bgColor = "var(--color-surface)";
              let borderColor = "var(--color-border)";
              let textColor = "var(--color-text-primary)";
              let extraClass = "";

              if (selected !== null) {
                if (isCorrect) {
                  bgColor = "var(--color-accent-bg, rgba(16,185,129,0.08))";
                  borderColor = "var(--color-accent)";
                  textColor = "var(--color-accent)";
                  extraClass = "scale-[1.02]";
                } else if (isSelected) {
                  bgColor = "#fef2f2";
                  borderColor = "#fca5a5";
                  textColor = "#dc2626";
                } else {
                  extraClass = "opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selected !== null}
                  className={`flex items-center justify-center px-3 py-4 rounded-xl border text-center transition-all ${extraClass}`}
                  style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                >
                  <span className="text-sm font-semibold">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
