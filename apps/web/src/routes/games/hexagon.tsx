/**
 * Kelime Oluşturma -- ayetteki eksik kelimeyi karıştırılan harflerden sıraya
 * tıklayarak tamamla. Sunucu tabanlı, sonsuz tekrar, zorluk + timer.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWordConstructionQuestion, type VerseFilter } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import type { League } from "~/lib/league";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { GameVerseLabel } from "~/components/GameVerseLabel";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

export const Route = createFileRoute("/games/hexagon")({
  component: WordConstructionPage,
});

const THEME = GAME_THEMES["hexagon"];
const P = THEME.primary;

type Screen = "setup" | "game" | "gameover";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function GameScreen({
  surahIds,
  verseFilter,
  difficulty,
  onSetup,
}: {
  surahIds: number[];
  verseFilter?: VerseFilter;
  difficulty: Difficulty;
  onSetup: () => void;
}) {
  const { t } = useTranslation();
  const timer = useGameTimer(difficulty);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [leagueUp, setLeagueUp] = useState<{ from: League; to: League } | null>(null);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const submittedRef = useRef(false);
  const [screen, setScreen] = useState<"game" | "gameover">("game");
  const usedAyahIdsRef = useRef<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Per-round state
  const [selected, setSelected] = useState<number[]>([]);
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong" | "loading">("loading");
  const [shaking, setShaking] = useState(false);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const {
    data: question,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["word-construction", refreshKey, surahIds, verseFilter, difficulty],
    queryFn: () =>
      getWordConstructionQuestion({
        data: {
          surahIds,
          verseFilter,
          excludeAyahIds: usedAyahIdsRef.current,
          difficulty,
        },
      }),
    staleTime: Infinity,
    retry: 1,
  });

  // Initialize round when question loads
  useEffect(() => {
    if (!isLoading && question) {
      usedAyahIdsRef.current.push(question.ayahId);
      setShuffledLetters(shuffle(question.letters));
      setSelected([]);
      setStatus("playing");
      questionStart.current = Date.now();
    }
  }, [isLoading, question]);

  // Start timer on first load
  useEffect(() => {
    if (!isLoading && question && round === 1 && !timer.isExpired) {
      timer.start();
    }
  }, [isLoading, question]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer expired
  useEffect(() => {
    if (timer.isExpired && screen === "game") {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "correct") nextBtnRef.current?.focus();
  }, [status]);

  const autoCheck = useCallback(
    (nextSelected: number[]) => {
      if (!question || nextSelected.length !== question.letters.length) return;
      const word = nextSelected.map((i) => shuffledLetters[i]).join("");
      timer.pause();

      if (word === question.targetWord) {
        const answerTime = Date.now() - questionStart.current;
        const newStreak = streak + 1;
        const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
        const timeBonus = calcTimeBonusMs(answerTime);
        if (timeBonus > 0) timer.addTime(timeBonus);
        setScore((s) => s + pts);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setLastDelta(pts);
        setStatus("correct");
      } else {
        const penalty = calcWrongPenalty(difficulty);
        timer.penalizeTime(WRONG_TIME_PENALTY_MS);
        setScore((s) => Math.max(0, s - penalty));
        setStreak(0);
        setWrongCount((c) => c + 1);
        setLastDelta(-penalty);
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setSelected([]);
          setLastDelta(null);
          if (!timer.isExpired) timer.start();
        }, 600);
      }
    },
    [question, shuffledLetters, streak, difficulty, timer],
  );

  function handleLetterClick(idx: number) {
    if (status !== "playing" || timer.isExpired) return;
    if (selected.includes(idx)) {
      setSelected((prev) => prev.filter((i) => i !== idx));
    } else {
      const next = [...selected, idx];
      setSelected(next);
      autoCheck(next);
    }
  }

  function handleSlotClick(pos: number) {
    if (status !== "playing") return;
    setSelected((prev) => prev.filter((_, i) => i !== pos));
  }

  const endGame = useCallback(() => {
    timer.pause();
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({
        data: {
          gameId: "hexagon",
          score,
          durationMs: Date.now() - sessionStart.current,
          difficulty,
          correctCount,
          wrongCount,
          bestStreak,
        },
      })
        .then((r) => {
          if (r?.isNewHighScore) setIsNewHighScore(true);
          if (r?.newAchievements?.length) setNewAchievements(r.newAchievements);
          if (r?.leagueUp) setLeagueUp(r.leagueUp);
        })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, timer]);

  const nextRound = useCallback(() => {
    if (timer.isExpired) {
      endGame();
      return;
    }
    timer.start();
    setRound((r) => r + 1);
    setSelected([]);
    setLastDelta(null);
    setStatus("loading");
    setRefreshKey((k) => k + 1);
  }, [timer, endGame]);

  const AUTO_ADVANCE_MS = 1000;
  useEffect(() => {
    if (status !== "correct") return;
    const id = setTimeout(() => nextRound(), AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [status, nextRound]);

  useEffect(() => {
    if (status !== "correct") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); nextRound(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, nextRound]);

  const handleRestart = () => {
    setScore(0);
    setRound(1);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLastDelta(null);
    setIsNewHighScore(false);
    setNewAchievements([]);
    setLeagueUp(null);
    submittedRef.current = false;
    usedAyahIdsRef.current = [];
    sessionStart.current = Date.now();
    setSelected([]);
    setStatus("loading");
    setRefreshKey((k) => k + 1);
    setScreen("game");
    timer.reset();
  };

  if (screen === "gameover") {
    return (
      <GameOverCard
        theme={THEME}
        score={score}
        correctCount={correctCount}
        wrongCount={wrongCount}
        bestStreak={bestStreak}
        isNewHighScore={isNewHighScore}
        t={t}
        newAchievements={newAchievements}
        leagueUp={leagueUp}
        onRestart={handleRestart}
        onSetup={onSetup}
      />
    );
  }

  if (isError || (!isLoading && !question)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          {t.hexagonGame.noWord}
        </p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: P }}
        >
          {t.hexagonGame.next}
        </button>
      </div>
    );
  }

  if (isLoading || !question) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div
          className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: `${P}30`, borderTopColor: P }}
        />
        <p className="text-[var(--color-text-secondary)] text-sm">
          {t.fillBlankGame.loadingVerse}
        </p>
      </div>
    );
  }

  const isAnswered = status === "correct";
  const letterCount = question.letters.length;

  return (
    <div
      className={`max-w-lg mx-auto pb-32 game-bg${shaking ? " game-shake" : ""}`}
      style={gameBgStyle(THEME, "hexagon")}
    >
      <div className="px-4 pt-2">
        <GameScoreBar
          theme={THEME}
          timerDisplay={timer.display}
          timerProgress={timer.progress}
          score={score}
          streak={streak}
          lastDelta={lastDelta}
          round={round}
          onFinish={endGame}
        />

        {/* Verse label */}
        <GameVerseLabel surahId={question.surahId} ayahNumber={question.verseNum} primary={P} fallbackName={question.surahName} />

        {/* Verse card -- mushaf style */}
        <div
          className="relative rounded-sm mb-5 overflow-hidden game-slide-up"
          style={{
            backgroundColor: "var(--mushaf-bg, #f8f4ec)",
            boxShadow: `
              0 1px 3px var(--mushaf-shadow, rgba(0,0,0,0.06)),
              0 6px 16px var(--mushaf-shadow, rgba(0,0,0,0.06))
            `,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none rounded-sm"
            style={{ border: "1.5px solid var(--mushaf-border, rgba(0,0,0,0.1))" }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "6px",
              border: "0.5px solid var(--mushaf-border, rgba(0,0,0,0.1))",
              opacity: 0.6,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 30px var(--mushaf-inner-shadow, rgba(0,0,0,0.03)),
                inset 0 0 60px var(--mushaf-inner-shadow, rgba(0,0,0,0.03))
              `,
            }}
          />
          <div
            className="relative px-5 py-7 sm:px-8 sm:py-9 text-right leading-[2.8] text-[1.75rem] sm:text-[2.2rem]"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)", color: "var(--color-text-primary)" }}
          >
            {question.words.map((w, i) => {
              if (i === question.blankIndex) {
                return (
                  <span
                    key={i}
                    className="inline-flex flex-row-reverse gap-1 items-center align-middle mx-1"
                  >
                    {question.letters.map((_, li) => (
                      <span
                        key={li}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${!isAnswered ? "game-pulse-glow" : ""}`}
                        style={{
                          backgroundColor: isAnswered ? P : `${P}50`,
                          ["--glow-color" as string]: THEME.glow,
                        }}
                      />
                    ))}
                  </span>
                );
              }
              return (
                <span key={i} className="mx-0.5">
                  {w}
                </span>
              );
            })}
          </div>
        </div>

        {/* Answer slots */}
        <div className="flex flex-row-reverse gap-1.5 sm:gap-2 mb-4 flex-wrap justify-center">
          {question.letters.map((_, i) => {
            const cellIdx = selected[i];
            const letter = cellIdx !== undefined ? shuffledLetters[cellIdx] : null;
            return (
              <button
                key={i}
                onClick={() => letter && handleSlotClick(i)}
                disabled={!letter || isAnswered}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-medium transition-all duration-200"
                dir="rtl"
                lang="ar"
                style={{
                  fontFamily: "var(--font-arabic)",
                  ...(letter
                    ? isAnswered
                      ? {
                          borderColor: P,
                          backgroundColor: `${P}18`,
                          color: P,
                          border: `2px solid ${P}`,
                          boxShadow: `0 0 12px ${THEME.glow}`,
                        }
                      : {
                          border: "2px solid var(--color-accent)",
                          backgroundColor: "var(--color-surface)",
                        }
                    : { border: "2px dashed var(--color-border)" }),
                }}
              >
                {letter ?? ""}
              </button>
            );
          })}
        </div>

        {/* Letter count hint */}
        <p
          className="text-center text-[0.65rem] mb-3"
          style={{ color: `${P}80` }}
        >
          {letterCount} {t.hexagonGame.letterUnit}
        </p>

        {/* Shuffled letter tiles */}
        {!isAnswered && (
          <div className="flex flex-row-reverse gap-2 sm:gap-2.5 flex-wrap justify-center mb-4">
            {shuffledLetters.map((letter, idx) => {
              const isSel = selected.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleLetterClick(idx)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-medium transition-all duration-150 active:scale-90"
                  dir="rtl"
                  lang="ar"
                  style={{
                    fontFamily: "var(--font-arabic)",
                    ...(isSel
                      ? {
                          backgroundColor: P,
                          color: "white",
                          border: `2px solid ${P}`,
                          opacity: 0.3,
                          boxShadow: `0 0 8px ${THEME.glow}`,
                        }
                      : {
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-primary)",
                          border: `2px solid ${P}30`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }),
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear button */}
        {!isAnswered && selected.length > 0 && (
          <div className="text-center mb-4">
            <button
              onClick={() => setSelected([])}
              className="px-5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95"
              style={{
                borderColor: `${P}30`,
                color: "var(--color-text-secondary)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              {t.hexagonGame.clear}
            </button>
          </div>
        )}

        {/* Feedback + Next */}
        {isAnswered && (
          <div
            className="rounded-xl border px-4 py-3.5 flex items-center justify-between gap-3 game-slide-up"
            style={{
              backgroundColor: `${P}08`,
              borderColor: `${P}25`,
              boxShadow: `0 2px 12px ${THEME.glow}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold game-star-spin"
                style={{ backgroundColor: `${P}18`, color: P }}
              >
                {"\u2713"}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: P }}>
                  {t.hexagonGame.correct}{" "}
                  {lastDelta !== null && (
                    <span className="font-semibold">{formatDelta(lastDelta)}</span>
                  )}
                </p>
                {streak >= 2 && (
                  <p
                    className="text-xs mt-0.5 flex items-center gap-1"
                    style={{ color: P }}
                  >
                    {t.fillBlankGame.streak.replace("{count}", String(streak))}
                  </p>
                )}
              </div>
            </div>
            <button
              ref={nextBtnRef}
              onClick={nextRound}
              className="relative overflow-hidden shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`,
                boxShadow: `0 2px 10px ${THEME.glow}`,
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left"
                style={{ background: "rgba(255,255,255,0.22)", animation: `game-advance-fill ${AUTO_ADVANCE_MS}ms linear forwards` }}
              />
              <span className="relative">{t.hexagonGame.next}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WordConstructionPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [verseFilter, setVerseFilter] = useState<VerseFilter | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId="hexagon"
        onStart={(ids, vf, diff) => {
          setSurahIds(ids);
          setVerseFilter(vf);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }

  return (
    <GameScreen
      surahIds={surahIds}
      verseFilter={verseFilter}
      difficulty={difficulty}
      onSetup={() => setScreen("setup")}
    />
  );
}
