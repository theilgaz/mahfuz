/**
 * Kelime Bul — /alifba/games/word
 * Bir Kuran kelimesinin sesi çalınır, 4 seçenekten hangisinin okunduğunu seç.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { ARABIC_LETTERS, LETTER_EXAMPLES, type LetterExample } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";

export const Route = createFileRoute("/alifba/games/word")({
  component: WordGamePage,
});

const QUESTION_COUNT = 15;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface WordQuestion {
  correct: LetterExample;
  choices: LetterExample[];
}

/** Tüm kelime havuzu */
function getAllWords(): LetterExample[] {
  return ARABIC_LETTERS.flatMap((l) => LETTER_EXAMPLES[l.id] ?? []);
}

function buildQuestions(): WordQuestion[] {
  const all = getAllWords();
  const picked = shuffle(all).slice(0, QUESTION_COUNT);
  return picked.map((correct) => {
    const distractors = shuffle(all.filter((w) => w.arabic !== correct.arabic)).slice(0, 3);
    return { correct, choices: shuffle([correct, ...distractors]) };
  });
}

/** Web Speech API ile Arapça kelime oku */
let arabicVoice: SpeechSynthesisVoice | null | undefined = undefined;
function getArabicVoice(): SpeechSynthesisVoice | null {
  if (arabicVoice !== undefined) return arabicVoice;
  if (!("speechSynthesis" in window)) return (arabicVoice = null);
  const voices = speechSynthesis.getVoices();
  arabicVoice =
    voices.find((v) => v.lang === "ar-SA") ??
    voices.find((v) => v.lang.startsWith("ar")) ??
    null;
  return arabicVoice;
}

function playWordAudio(arabic: string): () => void {
  if (!("speechSynthesis" in window)) return () => {};
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(arabic);
  utter.lang = "ar-SA";
  utter.rate = 0.7;
  utter.pitch = 1.0;
  const voice = getArabicVoice();
  if (voice) utter.voice = voice;
  speechSynthesis.speak(utter);
  return () => speechSynthesis.cancel();
}

// prefetch voices
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.addEventListener("voiceschanged", () => { arabicVoice = undefined; });
}

function WordGamePage() {
  const { t } = useTranslation();
  const updateGameHighScore = useAlifbaStore((s) => s.updateGameHighScore);

  const [questions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const q = questions[index];

  const playAudio = useCallback(() => {
    if (!q) return;
    stopRef.current?.();
    setPlaying(true);
    const stop = playWordAudio(q.correct.arabic);
    stopRef.current = stop;
    // reset playing state after ~2s
    const t = setTimeout(() => setPlaying(false), 2000);
    return () => { clearTimeout(t); stop(); };
  }, [q]);

  // auto-play on new question
  useEffect(() => {
    if (done || !q) return;
    const cleanup = playAudio();
    return () => { cleanup?.(); stopRef.current?.(); };
  }, [index, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback(
    (i: number) => {
      if (selected !== null || !q) return;
      setSelected(i);
      const isCorrect = q.choices[i].arabic === q.correct.arabic;
      if (isCorrect) { setCorrect((c) => c + 1); playCorrect(); } else { playWrong(); }

      setTimeout(() => {
        if (index + 1 >= questions.length) {
          updateGameHighScore("word", correct + (isCorrect ? 1 : 0));
          setDone(true);
        } else {
          setIndex((idx) => idx + 1);
          setSelected(null);
        }
      }, isCorrect ? 2500 : 900);
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
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">{t.alifba.quizComplete}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{correct}/{questions.length} · {pct}%</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Link to="/alifba/games" className="px-5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium">
            {t.nav.back}
          </Link>
          <button
            onClick={() => { setIndex(0); setSelected(null); setCorrect(0); setDone(false); }}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium"
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
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {/* Ses butonu */}
      <div className="flex flex-col items-center mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)] mb-5">
          {t.alifba.wordGameInstructions}
        </p>
        <button
          onClick={playAudio}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm border ${
            playing
              ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white scale-105"
              : "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/25 text-[var(--color-accent)]"
          }`}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </button>
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
          const isRight = choice.arabic === q.correct.arabic;

          let cls = "relative flex flex-col items-center justify-center min-h-[6rem] px-3 py-4 rounded-2xl border-2 transition-all duration-200 ";
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
              <span
                className="text-3xl leading-tight"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)", lineHeight: "1.4" }}
              >
                {choice.arabic}
              </span>
              {selected !== null && isRight && (
                <span className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                  {choice.meaning}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
