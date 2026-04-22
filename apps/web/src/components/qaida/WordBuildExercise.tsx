/**
 * Kelime Olusturma Alistirmasi
 * Karisik harflere tiklayarak kelimeyi dogru siraya diz.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { Exercise } from "@mahfuz/shared/types";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  exercise: Exercise;
  prompt: string;
  onComplete: (isCorrect: boolean) => void;
}

const MAX_ATTEMPTS = 2;

export function WordBuildExercise({ exercise, prompt, onComplete }: Props) {
  const letters = exercise.letters ?? [];
  const targetWord = exercise.targetWord ?? "";

  const shuffled = useMemo(() => shuffle(letters), [letters]);
  const [selected, setSelected] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);
  const [status, setStatus] = useState<"playing" | "correct" | "revealed">("playing");
  const attempts = useRef(0);

  const autoCheck = useCallback(
    (next: number[]) => {
      if (next.length !== letters.length) return;
      const word = next.map((i) => shuffled[i]).join("");

      if (word === targetWord) {
        playCorrect();
        setStatus("correct");
        setTimeout(() => onComplete(true), 800);
      } else {
        playWrong();
        attempts.current += 1;
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          if (attempts.current >= MAX_ATTEMPTS) {
            setStatus("revealed");
            setTimeout(() => onComplete(false), 1200);
          } else {
            setSelected([]);
          }
        }, 600);
      }
    },
    [letters.length, shuffled, targetWord, onComplete],
  );

  function handleLetterClick(idx: number) {
    if (status !== "playing") return;
    if (selected.includes(idx)) {
      setSelected((prev) => prev.filter((i) => i !== idx));
    } else {
      const next = [...selected, idx];
      setSelected(next);
      autoCheck(next);
    }
  }

  function handleSlotClick(pos: number) {
    if (status !== "playing") return;
    setSelected((prev) => prev.filter((_, i) => i !== pos));
  }

  const isAnswered = status === "correct" || status === "revealed";

  return (
    <div className={shaking ? "game-shake" : ""}>
      {/* Prompt */}
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
        {prompt}
      </p>

      {/* Target hint */}
      {exercise.arabicDisplay && (
        <div className="flex justify-center mb-2">
          <span
            className={`text-4xl leading-[1.8] transition-all duration-300 ${status === "correct" || status === "revealed" ? "" : "blur-sm opacity-40"}`}
            dir="rtl"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {exercise.arabicDisplay}
          </span>
        </div>
      )}

      {/* Answer slots */}
      <div className="flex flex-row-reverse gap-1.5 justify-center mb-6 mt-4">
        {letters.map((_, i) => {
          const cellIdx = selected[i];
          const letter = cellIdx !== undefined ? shuffled[cellIdx] : null;
          const isRevealed = status === "revealed";

          return (
            <button
              key={i}
              onClick={() => letter && handleSlotClick(i)}
              disabled={!letter || isAnswered}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-200"
              dir="rtl"
              lang="ar"
              style={{
                fontFamily: "var(--font-arabic)",
                ...(isRevealed
                  ? {
                      border: "2px solid var(--color-accent)",
                      backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                      color: "var(--color-accent)",
                    }
                  : letter
                    ? {
                        border: "2px solid var(--color-accent)",
                        backgroundColor: status === "correct"
                          ? "var(--color-accent-bg, rgba(16,185,129,0.08))"
                          : "var(--color-surface)",
                        color: status === "correct" ? "var(--color-accent)" : "var(--color-text-primary)",
                      }
                    : { border: "2px dashed var(--color-border)" }),
              }}
            >
              {isRevealed ? (letters[i] ?? "") : (letter ?? "")}
            </button>
          );
        })}
      </div>

      {/* Shuffled letter tiles */}
      {!isAnswered && (
        <div className="flex flex-row-reverse gap-2 flex-wrap justify-center mb-4">
          {shuffled.map((letter, idx) => {
            const isSel = selected.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleLetterClick(idx)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-150 active:scale-90"
                dir="rtl"
                lang="ar"
                style={{
                  fontFamily: "var(--font-arabic)",
                  ...(isSel
                    ? {
                        backgroundColor: "var(--color-accent)",
                        color: "white",
                        border: "2px solid var(--color-accent)",
                        opacity: 0.3,
                      }
                    : {
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                        border: "2px solid var(--color-border)",
                      }),
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear button */}
      {!isAnswered && selected.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setSelected([])}
            className="px-5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {"\u2715"}
          </button>
        </div>
      )}

      {/* Revealed answer feedback */}
      {status === "revealed" && (
        <p className="text-center text-sm text-[#dc2626] mt-2">
          {targetWord}
        </p>
      )}
    </div>
  );
}
