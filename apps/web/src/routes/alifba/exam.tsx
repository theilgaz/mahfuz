/**
 * Karışık Sınav — /alifba/exam
 * 28 soruluk kapsamlı sınav: ses tanıma + form tanıma karışık.
 */

import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS, getLetterForms, getSimilarDistractors, NON_CONNECTORS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";

export const Route = createFileRoute("/alifba/exam")({
  component: ExamPage,
});

type QType = "voice" | "form";
type FormType = "isolated" | "initial" | "medial" | "final";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions() {
  return shuffle(ARABIC_LETTERS).map((letter, i) => {
    const qtype: QType = i % 2 === 0 ? "voice" : "form";
    const nc = NON_CONNECTORS.has(letter.arabic);
    const availableForms: FormType[] = nc ? ["isolated", "final"] : ["initial", "medial", "final"];
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(letter.arabic);
    const distractors = getSimilarDistractors(letter.id, 3);
    return {
      letter,
      qtype,
      formType,
      displayForm: forms[formType],
      choices: shuffle([letter, ...distractors]),
    };
  });
}

function buildLastChanceQuestions(wrongLetterIds: string[]) {
  return wrongLetterIds.map((id, i) => {
    const letter = ARABIC_LETTERS.find((l) => l.id === id)!;
    const qtype: QType = i % 2 === 0 ? "voice" : "form";
    const nc = NON_CONNECTORS.has(letter.arabic);
    const availableForms: FormType[] = nc ? ["isolated", "final"] : ["initial", "medial", "final"];
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(letter.arabic);
    const distractors = getSimilarDistractors(letter.id, 3);
    return {
      letter,
      qtype,
      formType,
      displayForm: forms[formType],
      choices: shuffle([letter, ...distractors]),
    };
  });
}

type Phase = "main" | "lastChance" | "done";

function ExamPage() {
  const { t } = useTranslation();
  const addExamResult = useAlifbaStore((s) => s.addExamResult);
  const [started, setStarted] = useState(false);
  const [questions] = useState(buildQuestions);
  const [phase, setPhase] = useState<Phase>("main");
  const [lcQuestions, setLcQuestions] = useState<ReturnType<typeof buildQuestions>>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [lcCorrectIds, setLcCorrectIds] = useState<string[]>([]);

  const currentQuestions = phase === "lastChance" ? lcQuestions : questions;
  const q = currentQuestions[index];

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (selected) return;
      setSelected(choiceId);
      const isCorrect = choiceId === q.letter.id;
      if (isCorrect) { setCorrect((c) => c + 1); playCorrect(); } else { playWrong(); }

      const newWrongIds = phase === "main" && !isCorrect ? [...wrongIds, q.letter.id] : wrongIds;
      const newLcCorrectIds = phase === "lastChance" && isCorrect ? [...lcCorrectIds, q.letter.id] : lcCorrectIds;

      setTimeout(() => {
        if (index + 1 >= currentQuestions.length) {
          if (phase === "main") {
            if (newWrongIds.length > 0) {
              setWrongIds(newWrongIds);
              setLcQuestions(buildLastChanceQuestions(newWrongIds));
              setIndex(0);
              setSelected(null);
              setCorrect(0);
              setPhase("lastChance");
            } else {
              addExamResult({ score: questions.length, total: questions.length });
              setPhase("done");
            }
          } else {
            const finalCorrect = (questions.length - newWrongIds.length) + newLcCorrectIds.length;
            addExamResult({ score: finalCorrect, total: questions.length });
            setLcCorrectIds(newLcCorrectIds);
            setPhase("done");
          }
        } else {
          if (phase === "main") setWrongIds(newWrongIds);
          if (phase === "lastChance") setLcCorrectIds(newLcCorrectIds);
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 700);
    },
    [selected, q, index, correct, currentQuestions, phase, wrongIds, lcCorrectIds, questions, addExamResult],
  );

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-6">
        <Link to="/alifba/" className="self-start text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <div className="text-center mt-8">
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">{t.alifba.mixedExam}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{t.alifba.mixedExamDesc}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">28 {t.alifba.question}</p>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 rounded-2xl bg-[var(--color-accent)] text-white font-medium"
        >
          {t.alifba.examStart}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const finalCorrect = questions.length - wrongIds.length + lcCorrectIds.length;
    const pct = Math.round((finalCorrect / questions.length) * 100);
    const grade = pct >= 90 ? "🌟" : pct >= 70 ? "✅" : pct >= 50 ? "👍" : "📚";
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <div className="w-28 h-28 rounded-full bg-[var(--color-accent)]/15 flex flex-col items-center justify-center">
          <span className="text-2xl">{grade}</span>
          <span className="text-2xl font-bold text-[var(--color-accent)]">{finalCorrect}/28</span>
        </div>
        <h2 className="text-lg font-semibold">{t.alifba.examResult}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">{pct}%</p>
        <div className="flex gap-3 mt-2">
          <Link to="/alifba/" className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
          <button
            onClick={() => {
              setIndex(0); setSelected(null); setCorrect(0);
              setWrongIds([]); setLcCorrectIds([]); setLcQuestions([]);
              setPhase("main"); setStarted(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm"
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {phase === "lastChance" ? t.alifba.lastChance : t.alifba.mixedExam}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {index + 1} {t.alifba.of} {currentQuestions.length}
        </span>
      </div>

      {/* Son Şans banner */}
      {phase === "lastChance" && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-base">⚡</span>
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t.alifba.lastChance}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.lastChanceDesc}</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all ${phase === "lastChance" ? "bg-amber-500" : "bg-[var(--color-accent)]"}`}
          style={{ width: `${(index / currentQuestions.length) * 100}%` }}
        />
      </div>

      {/* Soru */}
      <div className="flex flex-col items-center gap-4 py-8 mb-6">
        {q.qtype === "voice" ? (
          <>
            <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.voiceQuiz}</p>
            <LetterAudioButton letterId={q.letter.id} size="lg" />
          </>
        ) : (
          <>
            <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.formsQuiz}</p>
            <span className="text-7xl leading-tight" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
              {q.displayForm}
            </span>
          </>
        )}
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
              {q.qtype === "form" && <span className="text-xs text-[var(--color-text-secondary)]">{choice.name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
