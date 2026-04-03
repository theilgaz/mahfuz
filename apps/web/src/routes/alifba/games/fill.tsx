/**
 * Boşluk Doldur — /alifba/games/fill
 * Bir kelimede eksik harf gösterilir, doğru harfi seç.
 * Kuran'dan kelime örneklerini kullanır.
 */

import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS, LETTER_EXAMPLES } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";

export const Route = createFileRoute("/alifba/games/fill")({
  component: FillGamePage,
});

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface FillQuestion {
  word: string;         // full Arabic word
  masked: string;       // word with one char replaced by □
  targetChar: string;   // the character to find
  letterId: string;
  letterName: string;
  choices: { id: string; arabic: string; name: string }[];
}

function buildQuestions(): FillQuestion[] {
  const questions: FillQuestion[] = [];
  for (const letter of shuffle(ARABIC_LETTERS)) {
    const examples = LETTER_EXAMPLES[letter.id] ?? [];
    if (examples.length === 0) continue;
    const ex = examples[Math.floor(Math.random() * examples.length)];
    const word = ex.arabic;
    // Find a position of the letter's arabic char in the word
    const idx = [...word].findIndex((ch) => ch === letter.arabic);
    if (idx === -1) continue;
    const chars = [...word];
    chars[idx] = "□";
    const masked = chars.join("");
    const distractors = shuffle(ARABIC_LETTERS.filter((l) => l.id !== letter.id)).slice(0, 3);
    questions.push({
      word,
      masked,
      targetChar: letter.arabic,
      letterId: letter.id,
      letterName: letter.name,
      choices: shuffle([
        { id: letter.id, arabic: letter.arabic, name: letter.name },
        ...distractors.map((d) => ({ id: d.id, arabic: d.arabic, name: d.name })),
      ]),
    });
    if (questions.length >= 20) break;
  }
  return questions;
}

function FillGamePage() {
  const { t } = useTranslation();
  const updateGameHighScore = useAlifbaStore((s) => s.updateGameHighScore);

  const [questions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (selected || !q) return;
      setSelected(choiceId);
      const isCorrect = choiceId === q.letterId;
      if (isCorrect) setCorrect((c) => c + 1);

      setTimeout(() => {
        if (index + 1 >= questions.length) {
          const score = correct + (isCorrect ? 1 : 0);
          updateGameHighScore("fill", score);
          setDone(true);
        } else {
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 800);
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
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <span className="text-5xl">✏️</span>
        <h2 className="text-lg font-semibold">{t.alifba.quizComplete}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">{correct}/{questions.length} · {pct}%</p>
        <div className="flex gap-3">
          <Link to="/alifba/games" className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <Link to="/alifba/games" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {index + 1} {t.alifba.of} {questions.length}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      {/* Kelime gösterimi */}
      <div className="flex flex-col items-center gap-3 py-8 mb-6">
        <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.fillGame}</p>
        <span className="text-5xl tracking-widest" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
          {q.masked}
        </span>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isRight = choice.id === q.letterId;
          let cls = "flex flex-col items-center justify-center gap-1 py-4 rounded-2xl border transition-colors ";
          if (!selected) {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer active:scale-95";
          } else if (isRight) {
            cls += "bg-green-500/15 border-green-500/60";
          } else if (isSelected) {
            cls += "bg-red-500/15 border-red-500/60";
          } else {
            cls += "bg-[var(--color-surface)] border-[var(--color-border)] opacity-40";
          }

          return (
            <button key={choice.id} onClick={() => handleChoice(choice.id)} className={cls}>
              <span className="text-3xl" style={{ fontFamily: "var(--font-arabic)" }}>{choice.arabic}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">{choice.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
