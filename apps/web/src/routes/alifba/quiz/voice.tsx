/**
 * Sesli Quiz — /alifba/quiz/voice
 * Harfin sesini dinle, 4 seçenekten doğru harfi bul.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS, getSimilarDistractors, shuffle } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { playLetterAudio, type LetterAudioHandle } from "~/lib/letter-audio";

export const Route = createFileRoute("/alifba/quiz/voice")({
  component: VoiceQuizPage,
});


function buildQuestions() {
  return shuffle(ARABIC_LETTERS).map((letter) => {
    const distractors = getSimilarDistractors(letter.id, 3);
    return { letter, choices: shuffle([letter, ...distractors]) };
  });
}

function buildLastChanceQuestions(wrongLetterIds: string[]) {
  return wrongLetterIds.map((id) => {
    const letter = ARABIC_LETTERS.find((l) => l.id === id)!;
    const distractors = getSimilarDistractors(letter.id, 3);
    return { letter, choices: shuffle([letter, ...distractors]) };
  });
}

type Phase = "main" | "lastChance" | "done";

function VoiceQuizPage() {
  const { t } = useTranslation();
  const setVoiceScore = useAlifbaStore((s) => s.setVoiceScore);

  const [started, setStarted] = useState(false);
  const [questions] = useState(buildQuestions);
  const [phase, setPhase] = useState<Phase>("main");
  const [lcQuestions, setLcQuestions] = useState<ReturnType<typeof buildQuestions>>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [lcCorrectIds, setLcCorrectIds] = useState<string[]>([]);
  const audioHandleRef = useRef<LetterAudioHandle | null>(null);

  const currentQuestions = phase === "lastChance" ? lcQuestions : questions;
  const q = currentQuestions[index];

  // Auto-play audio on new question (only after user gesture via Başla button)
  useEffect(() => {
    if (!started || phase === "done" || !q) return;
    audioHandleRef.current = playLetterAudio(q.letter.arabic, q.letter.id, () => {});
    return () => {
      audioHandleRef.current?.stop();
    };
  }, [index, phase, started]); // eslint-disable-line react-hooks/exhaustive-deps

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
              questions.forEach((qu) => setVoiceScore(qu.letter.id, 100));
              setPhase("done");
            }
          } else {
            // Save scores: wrong-but-retried-correctly → 70, failed → 0, never wrong → 100
            questions.forEach((qu) => {
              if (!newWrongIds.includes(qu.letter.id)) {
                setVoiceScore(qu.letter.id, 100);
              } else if (newLcCorrectIds.includes(qu.letter.id)) {
                setVoiceScore(qu.letter.id, 70);
              } else {
                setVoiceScore(qu.letter.id, 0);
              }
            });
            setLcCorrectIds(newLcCorrectIds);
            setPhase("done");
          }
        } else {
          if (phase === "main") setWrongIds(newWrongIds);
          if (phase === "lastChance") setLcCorrectIds(newLcCorrectIds);
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, q, index, correct, currentQuestions, phase, wrongIds, lcCorrectIds, questions, setVoiceScore],
  );

  const finalCorrect = questions.length - wrongIds.length + lcCorrectIds.length;

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
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">{t.alifba.voiceQuiz}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{t.alifba.voiceQuizDesc}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{questions.length} {t.alifba.question}</p>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 rounded-2xl bg-[var(--color-accent)] text-white font-medium"
        >
          {t.alifba.start}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((finalCorrect / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
          <span className="text-3xl font-bold text-[var(--color-accent)]">{pct}%</span>
        </div>
        <h2 className="text-lg font-semibold">{t.alifba.quizComplete}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {finalCorrect} / {questions.length} {t.alifba.correct}
        </p>
        <div className="flex gap-3">
          <Link to="/alifba/" className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
          <button
            onClick={() => {
              setIndex(0); setSelected(null); setCorrect(0);
              setWrongIds([]); setLcCorrectIds([]); setLcQuestions([]);
              setPhase("main"); setStarted(true);
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
          {t.alifba.question} {index + 1} {t.alifba.of} {currentQuestions.length}
        </span>
      </div>

      {/* Son Şans banner */}
      {phase === "lastChance" && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500 shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t.alifba.lastChance}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.lastChanceDesc}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--color-surface)] rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all ${phase === "lastChance" ? "bg-amber-500" : "bg-[var(--color-accent)]"}`}
          style={{ width: `${(index / currentQuestions.length) * 100}%` }}
        />
      </div>

      {/* Soru */}
      <div className="flex flex-col items-center gap-4 py-8 mb-6">
        <p className="text-sm text-[var(--color-text-secondary)]">{t.alifba.voiceQuiz}</p>
        <LetterAudioButton letterId={q.letter.id} size="lg" />
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isRight = choice.id === q.letter.id;
          let cls = "flex items-center justify-center h-[5.5rem] overflow-hidden rounded-2xl border text-3xl transition-colors ";
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
