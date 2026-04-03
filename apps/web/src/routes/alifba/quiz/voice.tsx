/**
 * Sesli Quiz — /alifba/quiz/voice
 * Harfin sesini dinle, 4 seçenekten doğru harfi bul.
 */

import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";

export const Route = createFileRoute("/alifba/quiz/voice")({
  component: VoiceQuizPage,
});

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions() {
  return shuffle(ARABIC_LETTERS).map((letter) => {
    const distractors = shuffle(ARABIC_LETTERS.filter((l) => l.id !== letter.id)).slice(0, 3);
    return {
      letter,
      choices: shuffle([letter, ...distractors]),
    };
  });
}

function VoiceQuizPage() {
  const { t } = useTranslation();
  const setVoiceScore = useAlifbaStore((s) => s.setVoiceScore);

  const [questions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (selected) return;
      setSelected(choiceId);
      const isCorrect = choiceId === q.letter.id;
      if (isCorrect) setCorrect((c) => c + 1);

      setTimeout(() => {
        if (index + 1 >= questions.length) {
          const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
          // Save score per letter
          questions.forEach((qu) => setVoiceScore(qu.letter.id, score));
          setDone(true);
        } else {
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, q, index, correct, questions, setVoiceScore],
  );

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
          <span className="text-3xl font-bold text-[var(--color-accent)]">{pct}%</span>
        </div>
        <h2 className="text-lg font-semibold">{t.alifba.quizComplete}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {correct} / {questions.length} {t.alifba.correct}
        </p>
        <div className="flex gap-3">
          <Link to="/alifba/" className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
          <button
            onClick={() => {
              setIndex(0);
              setSelected(null);
              setCorrect(0);
              setDone(false);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm"
          >
            {t.alifba.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/alifba/" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.alifba.question} {index + 1} {t.alifba.of} {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${((index) / questions.length) * 100}%` }}
        />
      </div>

      {/* Soru */}
      <div className="flex flex-col items-center gap-4 py-8 mb-6">
        <p className="text-sm text-[var(--color-text-secondary)]">{t.alifba.voiceQuiz}</p>
        <LetterAudioButton letterId={q.letter.id} size="lg" />
        <p className="text-xs text-[var(--color-text-secondary)] opacity-60">{q.letter.name}</p>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isRight = choice.id === q.letter.id;
          let cls = "flex items-center justify-center py-5 rounded-2xl border text-3xl transition-colors ";
          if (!selected) {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer active:scale-95";
          } else if (isRight) {
            cls += "bg-green-500/15 border-green-500/60 text-green-600";
          } else if (isSelected) {
            cls += "bg-red-500/15 border-red-500/60 text-red-500";
          } else {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] opacity-40";
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className={cls}
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {choice.arabic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
