/**
 * Eşleştirme Alıştırması
 * Sol sütundan (Arapça) bir öğe seç, sağ sütundan (Latin/anlam) eşini seç.
 */

import { useState, useMemo, useCallback } from "react";
import type { Exercise, MatchingPair } from "@mahfuz/shared/types";
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

export function MatchingExercise({ exercise, prompt, onComplete }: Props) {
  const pairs: MatchingPair[] = exercise.pairs ?? [];

  const shuffledLeft = useMemo(() => shuffle(pairs.map((p) => p.left)), [pairs]);
  const shuffledRight = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  const [lastCorrectPair, setLastCorrectPair] = useState<string | null>(null);

  const checkPair = useCallback(
    (leftIdx: number, rightIdx: number) => {
      const leftVal = shuffledLeft[leftIdx];
      const rightVal = shuffledRight[rightIdx];
      const isMatch = pairs.some((p) => p.left === leftVal && p.right === rightVal);

      if (isMatch) {
        playCorrect();
        const pairKey = `${leftVal}-${rightVal}`;
        setLastCorrectPair(pairKey);
        const next = new Set(matched);
        next.add(leftVal);
        setMatched(next);
        setSelectedLeft(null);
        setSelectedRight(null);

        setTimeout(() => setLastCorrectPair(null), 400);

        if (next.size === pairs.length) {
          setTimeout(() => onComplete(errors === 0), 800);
        }
      } else {
        playWrong();
        setErrors((e) => e + 1);
        setShaking(`${leftIdx}-${rightIdx}`);
        setTimeout(() => {
          setShaking(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
      }
    },
    [pairs, shuffledLeft, shuffledRight, matched, errors, onComplete],
  );

  function handleLeftClick(idx: number) {
    if (matched.has(shuffledLeft[idx])) return;
    setSelectedLeft(idx);
    if (selectedRight !== null) {
      checkPair(idx, selectedRight);
    }
  }

  function handleRightClick(idx: number) {
    const rightVal = shuffledRight[idx];
    const isMatched = pairs.some((p) => p.right === rightVal && matched.has(p.left));
    if (isMatched) return;
    setSelectedRight(idx);
    if (selectedLeft !== null) {
      checkPair(selectedLeft, idx);
    }
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
        {prompt}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column (Arabic) */}
        <div className="flex flex-col gap-2">
          {shuffledLeft.map((val, idx) => {
            const isMatched = matched.has(val);
            const isSelected = selectedLeft === idx;
            const isShaking = shaking?.startsWith(`${idx}-`);

            return (
              <button
                key={idx}
                onClick={() => handleLeftClick(idx)}
                disabled={isMatched}
                className={`px-3 py-3.5 rounded-xl border text-center transition-all duration-200 ${isShaking ? "game-shake" : ""} ${isMatched ? "game-pop" : ""}`}
                dir="rtl"
                lang="ar"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: "1.25rem",
                  ...(isMatched
                    ? {
                        backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                        borderColor: "var(--color-accent)",
                        color: "var(--color-accent)",
                        opacity: 0.6,
                      }
                    : isSelected
                      ? {
                          backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-text-primary)",
                        }
                      : {
                          backgroundColor: "var(--color-surface)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }),
                }}
              >
                {val}
              </button>
            );
          })}
        </div>

        {/* Right column (Latin/meaning) */}
        <div className="flex flex-col gap-2">
          {shuffledRight.map((val, idx) => {
            const pair = pairs.find((p) => p.right === val);
            const isMatched = pair ? matched.has(pair.left) : false;
            const isSelected = selectedRight === idx;
            const isShaking = shaking?.endsWith(`-${idx}`);

            return (
              <button
                key={idx}
                onClick={() => handleRightClick(idx)}
                disabled={isMatched}
                className={`px-3 py-3.5 rounded-xl border text-center transition-all duration-200 ${isShaking ? "game-shake" : ""} ${isMatched ? "game-pop" : ""}`}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  ...(isMatched
                    ? {
                        backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                        borderColor: "var(--color-accent)",
                        color: "var(--color-accent)",
                        opacity: 0.6,
                      }
                    : isSelected
                      ? {
                          backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-text-primary)",
                        }
                      : {
                          backgroundColor: "var(--color-surface)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }),
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
