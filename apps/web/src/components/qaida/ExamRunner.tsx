/**
 * Sınav runner -- konu sınavları ve seviye testi için.
 * ExerciseRunner'dan farkı: geçme/kalma sonuç ekranı, farklı soru tipleri (audio-mcq, tap).
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { ExamQuestion } from "~/lib/exam-generators";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { playLetterAudio, type LetterAudioHandle } from "~/lib/letter-audio";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";
import { LetterTapExercise } from "./LetterTapExercise";
import { useTranslation } from "~/hooks/useTranslation";

interface ExamRunnerProps {
  questions: ExamQuestion[];
  passThreshold: number;
  onComplete: (score: number, total: number, passed: boolean) => void;
  title?: string;
  backLink?: string;
}

export function ExamRunner({ questions, passThreshold, onComplete, title, backLink = "/alifba" }: ExamRunnerProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const q = questions[current];
  const audioRef = useRef<LetterAudioHandle | null>(null);
  const playedKeyRef = useRef<string | null>(null);

  // Auto-play audio for audio-mcq questions
  useEffect(() => {
    if (finished || !q || q.type !== "audio-mcq" || !q.letterId) return;
    const key = `exam-${current}`;
    if (playedKeyRef.current === key) return;
    playedKeyRef.current = key;
    audioRef.current = playLetterAudio(q.letterId, q.letterId, () => {});
    return () => {
      audioRef.current?.stop();
    };
  }, [current, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);

      const isCorrect = q.options[idx].isCorrect;
      if (isCorrect) {
        playCorrect();
        setScore((s) => s + 1);
      } else {
        playWrong();
      }

      setTimeout(() => {
        if (current + 1 >= total) {
          const finalScore = isCorrect ? score + 1 : score;
          const passed = finalScore / total >= passThreshold;
          setFinished(true);
          onComplete(finalScore, total, passed);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, q, current, total, score, passThreshold, onComplete],
  );

  const handleTapComplete = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        playCorrect();
        setScore((s) => s + 1);
      } else {
        playWrong();
      }
      setTimeout(() => {
        if (current + 1 >= total) {
          const finalScore = isCorrect ? score + 1 : score;
          const passed = finalScore / total >= passThreshold;
          setFinished(true);
          onComplete(finalScore, total, passed);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
        }
      }, 800);
    },
    [current, total, score, passThreshold, onComplete],
  );

  const handleRetry = useCallback(() => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    playedKeyRef.current = null;
  }, []);

  // -- Sonuc ekrani --
  if (finished) {
    const finalScore = score;
    const passed = finalScore / total >= passThreshold;
    const pct = Math.round((finalScore / total) * 100);

    return (
      <div className="mu-roadmap">
        <div className="mu-exam-result">
          <div className="mu-exam-result-badge" style={{ background: passed ? "var(--mu-accent-soft)" : "var(--mu-bg-soft)", color: passed ? "var(--mu-accent)" : "var(--mu-muted)" }}>
            {passed ? (
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <span className="mu-exam-result-score">{finalScore}/{total}</span>
          <p className="mu-exam-result-pct">%{pct}</p>
          <p className="mu-exam-result-msg">
            {passed
              ? (t.hub?.qaidaExamPass ?? "S\u0131nav\u0131 ge\u00E7tin!")
              : (t.hub?.qaidaExamFail ?? "Ge\u00E7me puan\u0131: {count}").replace("{count}", String(Math.ceil(total * passThreshold)))}
          </p>
          <div className="mu-exam-result-actions">
            <Link to={backLink as "/alifba"} className="mu-btn primary small">
              {t.hub?.qaidaExamBack ?? "Geri d\u00F6n"}
            </Link>
            {!passed && (
              <button onClick={handleRetry} className="mu-btn ghost small">
                {t.hub?.qaidaExamRetry ?? "Tekrar dene"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- Soru ekrani --
  return (
    <div className="mu-roadmap">
      {/* Header */}
      <div className="mu-step-progress-header">
        <span>{title || "S\u0131nav"}</span>
        <span>{current + 1} / {total}</span>
      </div>

      {/* Progress */}
      <div className="mu-letters-progress" style={{ marginBottom: 24 }}>
        <div className="mu-letters-progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>

      {/* Tap question */}
      {q.type === "tap" && q.tapData ? (
        <LetterTapExercise
          key={current}
          arabicDisplay={q.tapData.text}
          targetType={q.tapData.targetType}
          prompt={q.prompt}
          onComplete={handleTapComplete}
        />
      ) : (
        <>
          {/* Question */}
          <div className="mu-exam-question">
            <p className="mu-exam-prompt">{q.prompt}</p>

            {q.type === "audio-mcq" && q.letterId && (
              <div className="mu-exam-audio-center">
                <LetterAudioButton letterId={q.letterId} size="lg" />
              </div>
            )}

            {q.arabicDisplay && (
              <span className={`mu-exam-arabic${q.type === "audio-mcq" ? " small" : ""}`} dir="rtl">
                {q.arabicDisplay}
              </span>
            )}
          </div>

          {/* Options */}
          <div className={`mu-exam-options${q.options.length === 3 ? " cols-3" : ""}`}>
            {q.options.map((opt, idx) => {
              const isCorrect = opt.isCorrect;
              const isSelected = selected === idx;
              const cls = [
                "mu-exam-option",
                selected !== null && isCorrect ? "correct" : "",
                selected !== null && isSelected && !isCorrect ? "wrong" : "",
                selected !== null && !isCorrect && !isSelected ? "faded" : "",
              ].filter(Boolean).join(" ");

              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null} className={cls}>
                  <span>{opt.text}</span>
                  {selected !== null && isCorrect && (
                    <svg className="mu-exam-option-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {selected !== null && isSelected && !isCorrect && (
                    <svg className="mu-exam-option-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Score */}
      <div className="mu-exam-score">
        {score} / {current + (selected !== null ? 1 : 0)}
      </div>
    </div>
  );
}
