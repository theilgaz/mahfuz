/**
 * Form Quizi — /alifba/quiz/forms
 * Verilen formu (başta/ortada/sonda/bağımsız) hangi harfe ait olduğunu bul.
 */

import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS, getLetterForms, NON_CONNECTORS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";

export const Route = createFileRoute("/alifba/quiz/forms")({
  component: FormsQuizPage,
});

type FormType = "isolated" | "initial" | "medial" | "final";
const FORM_TYPES: FormType[] = ["isolated", "initial", "medial", "final"];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions() {
  return shuffle(ARABIC_LETTERS).map((letter) => {
    const nc = NON_CONNECTORS.has(letter.arabic);
    const availableForms = nc
      ? (["isolated", "final"] as FormType[])
      : FORM_TYPES;
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(letter.arabic);
    const displayForm = forms[formType];
    const distractors = shuffle(ARABIC_LETTERS.filter((l) => l.id !== letter.id)).slice(0, 3);
    return { letter, formType, displayForm, choices: shuffle([letter, ...distractors]) };
  });
}

function FormsQuizPage() {
  const { t } = useTranslation();
  const setFormScore = useAlifbaStore((s) => s.setFormScore);

  const [questions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const formLabel: Record<FormType, string> = {
    isolated: t.alifba.isolated,
    initial: t.alifba.initial,
    medial: t.alifba.medial,
    final: t.alifba.final,
  };

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (selected) return;
      setSelected(choiceId);
      const isCorrect = choiceId === q.letter.id;
      if (isCorrect) { setCorrect((c) => c + 1); playCorrect(); } else { playWrong(); }

      setTimeout(() => {
        if (index + 1 >= questions.length) {
          const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
          questions.forEach((qu) => setFormScore(qu.letter.id, score));
          setDone(true);
        } else {
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, q, index, correct, questions, setFormScore],
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
            onClick={() => { setIndex(0); setSelected(null); setCorrect(0); setDone(false); }}
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

      {/* Progress */}
      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {/* Soru */}
      <div className="flex flex-col items-center gap-3 py-8 mb-6">
        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          {formLabel[q.formType]}
        </span>
        <span
          className="text-7xl leading-tight"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {q.displayForm}
        </span>
        <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.formsQuiz}</p>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isRight = choice.id === q.letter.id;
          let cls = "flex flex-col items-center justify-center gap-2 h-[5.5rem] overflow-hidden rounded-2xl border transition-colors ";
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
