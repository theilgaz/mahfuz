/**
 * Hız Oyunu — /alifba/games/speed
 * 30 saniyede mümkün olduğunca çok harfi doğru tanı.
 * Harf gösterilir, 4 seçenekten birini seç — doğruysa puan kazan.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { ARABIC_LETTERS, shuffle } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";

export const Route = createFileRoute("/alifba/games/speed")({
  component: SpeedGamePage,
});

const GAME_DURATION = 30; // seconds


function nextQuestion() {
  const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
  const distractors = shuffle(ARABIC_LETTERS.filter((l) => l.id !== letter.id)).slice(0, 3);
  return { letter, choices: shuffle([letter, ...distractors]) };
}

function SpeedGamePage() {
  const { t } = useTranslation();
  const updateGameHighScore = useAlifbaStore((s) => s.updateGameHighScore);

  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [q, setQ] = useState(nextQuestion);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, done]);

  useEffect(() => {
    if (timeLeft === 0 && started) {
      updateGameHighScore("speed", score);
      setDone(true);
    }
  }, [timeLeft, started, score, updateGameHighScore]);

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!started || done) return;
      const isCorrect = choiceId === q.letter.id;
      if (isCorrect) {
        setScore((s) => s + 1);
        setFlash("correct");
        playCorrect();
      } else {
        setFlash("wrong");
        playWrong();
      }
      setTimeout(() => {
        setFlash(null);
        setQ(nextQuestion());
      }, 300);
    },
    [started, done, q],
  );

  const restart = () => {
    setStarted(false);
    setDone(false);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setQ(nextQuestion());
    setFlash(null);
  };

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-6">
        <Link to="/alifba/games" className="self-start text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <div className="text-center mt-8">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <h1 className="text-xl font-semibold mt-3 mb-2">{t.alifba.speedGame}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{GAME_DURATION} {t.alifba.speedGameDesc2}</p>
        </div>
        <button onClick={() => setStarted(true)} className="px-8 py-3 rounded-2xl bg-[var(--color-accent)] text-white font-medium">
          {t.alifba.start}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <h2 className="text-lg font-semibold">{t.alifba.quizComplete}</h2>
        <p className="text-2xl font-bold text-[var(--color-accent)]">{score}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{t.alifba.score}</p>
        <div className="flex gap-3">
          <Link to="/alifba/games" className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
          <button onClick={restart} className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm">
            {t.alifba.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 10 ? "bg-[var(--color-accent)]" : "bg-red-500";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-[var(--color-accent)]">{score}</span>
        <span className={`text-sm font-semibold ${timeLeft <= 10 ? "text-red-500" : "text-[var(--color-text-secondary)]"}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div className={`h-full ${timerColor} transition-all`} style={{ width: `${timerPct}%` }} />
      </div>

      <div className={`flex items-center justify-center py-10 mb-6 rounded-2xl border transition-colors ${
        flash === "correct" ? "bg-green-500/15 border-green-500/50" :
        flash === "wrong" ? "bg-red-500/15 border-red-500/50" :
        "bg-[var(--color-surface)] border-[var(--color-border)]"
      }`}>
        <span className="text-7xl leading-none" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
          {q.letter.arabic}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="flex items-center justify-center py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] active:scale-95 transition-colors text-sm font-medium"
          >
            {choice.name}
          </button>
        ))}
      </div>
    </div>
  );
}
