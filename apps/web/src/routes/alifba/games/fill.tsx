/**
 * Harf Bul — /alifba/games/fill
 * Büyük bir harf gösterilir, 4 Kuran kelimesinden hangisinde o harf geçiyor?
 * Doğru cevapta hedef harf highlight edilir.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { playLetterAudio, type LetterAudioHandle } from "~/lib/letter-audio";
import { ARABIC_LETTERS, LETTER_EXAMPLES, shuffle } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/games/fill")({
  head: () => staticHead("alifba-games-fill"),
  component: FillGamePage,
});


interface SpotChoice {
  arabic: string;
  transliteration: string;
  isCorrect: boolean;
}

interface SpotQuestion {
  letter: (typeof ARABIC_LETTERS)[number];
  choices: SpotChoice[];
}

function buildQuestions(): SpotQuestion[] {
  const questions: SpotQuestion[] = [];

  for (const letter of shuffle(ARABIC_LETTERS)) {
    const examples = LETTER_EXAMPLES[letter.id] ?? [];
    if (examples.length === 0) continue;

    const correctEx = examples[Math.floor(Math.random() * examples.length)];

    const distractors = shuffle(
      ARABIC_LETTERS
        .filter((l) => l.id !== letter.id)
        .flatMap((l) => (LETTER_EXAMPLES[l.id] ?? []).map((ex) => ({ ...ex })))
        .filter((ex) => ![...ex.arabic].some((ch) => ch === letter.arabic)),
    ).slice(0, 3);

    if (distractors.length < 3) continue;

    questions.push({
      letter,
      choices: shuffle([
        { arabic: correctEx.arabic, transliteration: correctEx.transliteration, isCorrect: true },
        ...distractors.map((d) => ({ arabic: d.arabic, transliteration: d.transliteration, isCorrect: false })),
      ]),
    });

    if (questions.length >= 20) break;
  }

  return questions;
}

/** Correct answer: highlight the target letter in the word */
function HighlightWord({ word, target }: { word: string; target: string }) {
  return (
    <span className="text-3xl leading-tight" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
      {[...word].map((ch, i) =>
        ch === target
          ? <span key={i} className="text-[var(--color-accent)] font-bold underline decoration-dotted underline-offset-4">{ch}</span>
          : <span key={i}>{ch}</span>
      )}
    </span>
  );
}

function FillGamePage() {
  const { t } = useTranslation();
  const updateGameHighScore = useAlifbaStore((s) => s.updateGameHighScore);

  const [questions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const audioHandleRef = useRef<LetterAudioHandle | null>(null);

  const q = questions[index];

  useEffect(() => {
    if (done || !q) return;
    audioHandleRef.current = playLetterAudio(q.letter.arabic, q.letter.id, () => {});
    return () => { audioHandleRef.current?.stop(); };
  }, [index, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback(
    (i: number) => {
      if (selected !== null || !q) return;
      setSelected(i);
      const isCorrect = q.choices[i].isCorrect;
      if (isCorrect) { setCorrect((c) => c + 1); playCorrect(); } else { playWrong(); }

      setTimeout(() => {
        if (index + 1 >= questions.length) {
          updateGameHighScore("fill", correct + (isCorrect ? 1 : 0));
          setDone(true);
        } else {
          setIndex((idx) => idx + 1);
          setSelected(null);
        }
      }, isCorrect ? 3000 : 900);
    },
    [selected, q, index, correct, questions, updateGameHighScore],
  );

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center text-[var(--color-text-secondary)]">
        <Link to="/alifba/games" className="text-[var(--color-accent)]">{t.nav.back}</Link>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-5 mt-10">
        <div className="w-16 h-16 rounded bg-[var(--color-accent)]/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M15 5l4 4"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">{t.alifba.quizComplete}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{correct}/{questions.length} · {pct}%</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Link to="/alifba/games" className="px-5 py-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium">
            {t.nav.back}
          </Link>
          <button
            onClick={() => { setIndex(0); setSelected(null); setCorrect(0); setDone(false); }}
            className="px-5 py-2.5 rounded bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] text-sm font-medium"
          >
            {t.alifba.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  const progressPct = (index / questions.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-3">
        <Link to="/alifba/games" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Harf kartı */}
      <div className="flex flex-col items-center mb-7">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] mb-4">
          {t.alifba.spotGameInstructions}
        </p>
        <div className="w-40 h-40 rounded bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20 flex items-center justify-center">
          <span
            className="block text-[6rem] select-none text-center"
            dir="rtl"
            style={{ fontFamily: "var(--font-arabic)", lineHeight: "1.4" }}
          >
            {q.letter.arabic}
          </span>
        </div>

        {/* Skor */}
        <div className="flex items-center gap-1.5 mt-4 text-xs text-[var(--color-text-secondary)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{correct} {t.alifba.correct?.toLowerCase?.() ?? "doğru"}</span>
        </div>
      </div>

      {/* Kelime seçenekleri */}
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isRight = choice.isCorrect;

          let cls = "relative flex flex-col items-center justify-center min-h-[6rem] px-3 py-4 rounded border-2 transition-all duration-200 ";
          if (selected === null) {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/5 cursor-pointer active:scale-[0.97]";
          } else if (isRight) {
            cls += "bg-green-500/10 border-green-500/70 scale-[1.02]";
          } else if (isSelected) {
            cls += "bg-red-500/10 border-red-500/60";
          } else {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] opacity-35";
          }

          return (
            <button key={i} onClick={() => handleChoice(i)} className={cls}>
              {/* feedback icon */}
              {selected !== null && isRight && (
                <span className="absolute top-2 right-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(34 197 94)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
              {selected !== null && isSelected && !isRight && (
                <span className="absolute top-2 right-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(239 68 68)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
              )}

              {selected !== null && isRight
                ? <HighlightWord word={choice.arabic} target={q.letter.arabic} />
                : <span className="text-3xl leading-tight" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>{choice.arabic}</span>
              }
            </button>
          );
        })}
      </div>
    </div>
  );
}
