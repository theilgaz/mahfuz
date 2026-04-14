/**
 * Ayet Zinciri -- son kelimeyi gor, devamini bul.
 * 3 can sistemi, zorluk secimi, zaman bonusu, yanlis cezasi.
 * Themed: dark teal with golden chain links.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { STATIC_QUESTIONS } from "~/lib/verse-chain-data";
import type { ChainQuestion } from "~/lib/verse-chain-data";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { GameHeader } from "~/components/GameHeader";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES } from "~/lib/game-themes";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

export const Route = createFileRoute("/games/verse-chain")({
  component: VerseChainPage,
});

const THEME = GAME_THEMES["verse-chain"];
const P = THEME.primary;

type GameState = "playing" | "correct" | "wrong" | "gameover";
type Screen = "setup" | "game";

function filterQuestions(surahIds: number[]): ChainQuestion[] {
  if (surahIds.length === 0) return STATIC_QUESTIONS;
  const idSet = new Set(surahIds);
  const filtered = STATIC_QUESTIONS.filter((q) => {
    const surahId = parseInt(q.currentVerse.verseKey.split(":")[0], 10);
    return idSet.has(surahId);
  });
  return filtered.length > 0 ? filtered : STATIC_QUESTIONS;
}

function VerseChainGame({ surahIds, difficulty, onSetup }: { surahIds: number[]; difficulty: Difficulty; onSetup: () => void }) {
  const { t } = useTranslation();
  const questions = filterQuestions(surahIds);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<GameState>("playing");
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const [chainLength, setChainLength] = useState(0);
  const [revealedSurahs, setRevealedSurahs] = useState<Set<number>>(new Set());
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const question = questions[questionIndex % questions.length];

  const handleAnswer = (idx: number) => {
    if (state !== "playing") return;
    setSelected(idx);
    const isCorrect = question.options[idx].isCorrect;
    const answerTime = Date.now() - questionStart.current;

    if (isCorrect) {
      setState("correct");
      const newStreak = streak + 1;
      const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
      setScore((s) => s + pts);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      setChainLength((c) => c + 1);
      setLastDelta(pts);
      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
        setState("playing");
        setSelected(null);
        setLastDelta(null);
        setRevealedSurahs(new Set());
        questionStart.current = Date.now();
      }, 1200);
    } else {
      setState("wrong");
      const penalty = calcWrongPenalty(difficulty);
      setScore((s) => Math.max(0, s - penalty));
      setStreak(0);
      setWrongCount((c) => c + 1);
      setChainLength(0);
      setLastDelta(-penalty);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setState("gameover"), 1200);
      } else {
        setTimeout(() => {
          setQuestionIndex((i) => i + 1);
          setState("playing");
          setSelected(null);
          setLastDelta(null);
          setRevealedSurahs(new Set());
          questionStart.current = Date.now();
        }, 1500);
      }
    }
  };

  const handleRestart = () => {
    setQuestionIndex(0); setState("playing"); setSelected(null);
    setScore(0); setStreak(0); setBestStreak(0); setCorrectCount(0);
    setWrongCount(0); setLastDelta(null); setLives(3); setChainLength(0);
    setRevealedSurahs(new Set()); setIsNewHighScore(false);
    submittedRef.current = false; sessionStart.current = Date.now();
    questionStart.current = Date.now();
  };

  useEffect(() => {
    if (state === "gameover" && score > 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "verse-chain", score, durationMs: Date.now() - sessionStart.current, difficulty } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); })
        .catch(() => {});
    }
  }, [state, score, difficulty]);

  if (state === "gameover") {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        onRestart={handleRestart} onSetup={onSetup}
      />
    );
  }

  const { currentVerse, options } = question;
  const verseWords = currentVerse.textUthmani.trim().split(/\s+/);
  const lastWord = verseWords.pop();
  const restWords = verseWords.join(" ");

  return (
    <div className="max-w-lg mx-auto pb-24 game-bg" style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}>
      <GameHeader
        img={THEME.img} bg={THEME.bg} isDark={THEME.isDark}
        title={t.gamesHub.verseChainTitle}
        onBack={onSetup}
        right={
          <div className="flex items-center gap-3">
            <span className="game-score-badge" style={{ backgroundColor: `${P}25`, color: P }}>
              {score}
            </span>
            {/* Lives as hearts */}
            <div className="flex gap-1 items-center">
              {Array.from({ length: 3 }, (_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < lives ? "game-heart-beat" : "opacity-20 grayscale"}`}
                  style={i < lives ? { animationDelay: `${i * 0.15}s` } : {}}
                >
                  {"\u2764\uFE0F"}
                </span>
              ))}
            </div>
          </div>
        }
      />

      <div className="px-4 pt-2">
        {/* Chain counter */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(chainLength, 8) }, (_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full game-chain-link"
                style={{ backgroundColor: P, animationDelay: `${i * 0.05}s`, boxShadow: `0 0 6px ${THEME.glow}` }}
              />
            ))}
            {chainLength > 8 && (
              <span className="text-xs font-bold" style={{ color: P }}>+{chainLength - 8}</span>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            {chainLength === 0 ? "Zinciri baslat" : `${chainLength} halka`}
          </span>
          {streak >= 2 && (
            <span className="game-streak-fire ml-auto" style={{ color: P, backgroundColor: `${P}20`, ["--glow-color" as string]: THEME.glow }}>
              {streak}x
            </span>
          )}
        </div>

        {/* Current verse */}
        <div
          className="px-5 py-4 rounded-2xl border bg-[var(--color-surface)] mb-5 game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            {currentVerse.surahName} &middot; {currentVerse.verseKey.split(":")[1]}. Ayet
          </p>
          <p className="text-xl text-right leading-loose text-[var(--color-text-primary)] mb-3" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
            {restWords}{" "}
            <span
              className="font-medium px-2 py-0.5 rounded-lg game-pulse-glow"
              style={{ color: P, backgroundColor: `${P}18`, ["--glow-color" as string]: THEME.glow }}
            >
              {lastWord}
            </span>
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-secondary)]">Son kelime:</span>
            <span className="text-base font-medium" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", color: P }}>{currentVerse.lastWordArabic}</span>
            <span className="text-xs text-[var(--color-text-secondary)] ml-auto">devam eden ayet hangisi?</span>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5 mb-4">
          {options.map((opt, idx) => {
            let bgColor = "var(--color-surface)";
            let borderColor = `${P}20`;
            let extraClass = "";

            if (selected === idx) {
              if (state === "correct" || opt.isCorrect) {
                bgColor = `${P}12`;
                borderColor = `${P}60`;
                extraClass = "game-bounce-in";
              } else if (state === "wrong") {
                bgColor = "#fef2f2";
                borderColor = "#fca5a5";
                extraClass = "game-shake";
              }
            } else if (state !== "playing" && opt.isCorrect) {
              bgColor = `${P}08`;
              borderColor = `${P}40`;
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={state !== "playing"}
                className={`game-option-card w-full text-left ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {state !== "playing" || revealedSurahs.has(idx) ? (
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]" style={opt.isCorrect && state !== "playing" ? { color: P } : {}}>
                      {opt.surahName}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRevealedSurahs((prev) => new Set(prev).add(idx)); }}
                      className="text-xs px-2 py-0.5 rounded bg-[var(--color-border)] text-transparent select-none hover:opacity-70 transition-opacity"
                      aria-label="Sure adini goster"
                      style={{ filter: "blur(3px)" }}
                    >
                      {opt.surahName}
                    </button>
                  )}
                  {selected === idx && state === "correct" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: P }}>
                      {"\u{2B50}"} {lastDelta !== null && formatDelta(lastDelta)}
                    </span>
                  )}
                  {selected === idx && state === "wrong" && !opt.isCorrect && (
                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">
                      {"\u{1F614}"} {lastDelta !== null && formatDelta(lastDelta)}
                    </span>
                  )}
                  {state !== "playing" && opt.isCorrect && selected !== idx && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: P }}>
                      &#10003; Dogru cevap
                    </span>
                  )}
                </div>
                <p className="text-base text-right leading-loose text-[var(--color-text-primary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
                  {opt.firstWords}
                </p>
              </button>
            );
          })}
        </div>

        {state === "playing" && (
          <p className="text-center text-xs text-[var(--color-text-secondary)]">
            Vurgulanan son kelimeden sonra hangi ayet gelir?
          </p>
        )}
      </div>
    </div>
  );
}

function VerseChainPage() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameTitle={t.gamesHub.verseChainTitle}
        onStart={(ids, _vf, diff) => {
          setSurahIds(ids);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }
  return <VerseChainGame surahIds={surahIds} difficulty={difficulty} onSetup={() => setScreen("setup")} />;
}
