/**
 * Bosluk Doldurma Alistirmasi
 * Arapca metin gosterilir, eksik kisim icin seceneklerden biri secilir.
 */

import { useState, useMemo } from "react";
import type { Exercise, ExerciseOption } from "@mahfuz/shared/types";
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

export function FillBlankExercise({ exercise, prompt, onComplete }: Props) {
  const segments = (exercise.contextDisplay ?? "").split("|");
  const blankPos = exercise.blankPosition ?? 0;

  const options = useMemo(() => shuffle(exercise.options), [exercise.options]);
  const [selected, setSelected] = useState<number | null>(null);
  const [filledText, setFilledText] = useState<string | null>(null);

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);

    const opt = options[idx];
    if (opt.isCorrect) {
      playCorrect();
      setFilledText(opt.text);
      setTimeout(() => onComplete(true), 800);
    } else {
      playWrong();
      const correct = options.find((o) => o.isCorrect);
      if (correct) setFilledText(correct.text);
      setTimeout(() => onComplete(false), 800);
    }
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
        {prompt}
      </p>

      {/* Context with blank */}
      <div
        className="flex flex-row-reverse flex-wrap items-center justify-center gap-1.5 mb-8 px-2"
        dir="rtl"
        lang="ar"
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        {segments.map((seg, i) => {
          if (i === blankPos) {
            return (
              <span
                key={i}
                className={`inline-flex items-center justify-center min-w-12 px-2 py-1 rounded-lg text-3xl leading-[1.8] transition-all duration-300 ${
                  filledText
                    ? selected !== null && options[selected]?.isCorrect
                      ? "game-pop"
                      : ""
                    : "game-pulse-glow"
                }`}
                style={{
                  ...(filledText
                    ? selected !== null && options[selected]?.isCorrect
                      ? {
                          backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.08))",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-accent)",
                          border: "2px solid var(--color-accent)",
                        }
                      : {
                          backgroundColor: "#fef2f2",
                          borderColor: "#fca5a5",
                          color: "#dc2626",
                          border: "2px solid #fca5a5",
                        }
                    : {
                        border: "2px dashed var(--color-accent)",
                        backgroundColor: "var(--color-accent-bg, rgba(16,185,129,0.04))",
                        ["--glow-color" as string]: "var(--color-accent)",
                      }),
                }}
              >
                {filledText ?? "\u00A0?\u00A0"}
              </span>
            );
          }
          return (
            <span key={i} className="text-3xl leading-[1.8] text-[var(--color-text-primary)]">
              {seg}
            </span>
          );
        })}
      </div>

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
    </div>
  );
}
