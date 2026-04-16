/**
 * Ayet Zinciri -- Ayetin devamini bul.
 * Dinamik soru uretimi (DB'den), gercek zincir mekanigi:
 * dogru cevaplarsan ayni surede sonraki ayetle devam eder.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { getVerseChainRounds, type ChainRound, type ChainVerse } from "~/lib/quran-service";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  formatDelta,
  OPTION_COUNT,
  type Difficulty,
} from "~/lib/game-scoring";

export const Route = createFileRoute("/games/verse-chain")({
  component: VerseChainPage,
});

const THEME = GAME_THEMES["verse-chain"];
const P = THEME.primary;

type GameState = "loading" | "playing" | "correct" | "wrong" | "gameover";
type Screen = "setup" | "game";

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get first N words of Arabic text */
function firstWords(text: string, n = 4): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text.trim();
  return words.slice(0, n).join(" ") + "...";
}

/** Get last word of Arabic text */
function lastWord(text: string): string {
  const words = text.trim().split(/\s+/);
  return words[words.length - 1] ?? "";
}

/** Build shuffled options from a round */
function buildOptions(round: ChainRound, optionCount: number) {
  const distractors = shuffle([...round.distractors]).slice(0, optionCount - 1);
  const options = shuffle([
    { ...round.correct, isCorrect: true },
    ...distractors.map((d) => ({ ...d, isCorrect: false })),
  ]);
  return options;
}

function VerseChainGame({
  surahIds,
  difficulty,
  onSetup,
}: {
  surahIds: number[];
  difficulty: Difficulty;
  onSetup: () => void;
}) {
  const { t } = useTranslation();
  const optCount = OPTION_COUNT[difficulty];

  const [rounds, setRounds] = useState<ChainRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [state, setState] = useState<GameState>("loading");
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
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // Current options (shuffled)
  const [options, setOptions] = useState<(ChainVerse & { isCorrect: boolean })[]>([]);

  // Load rounds from server
  const loadRounds = useCallback(async () => {
    setState("loading");
    try {
      const data = await getVerseChainRounds({
        data: { surahIds: surahIds.length > 0 ? surahIds : undefined, count: 20 },
      });
      if (data.length > 0) {
        setRounds(data);
        setOptions(buildOptions(data[0], optCount));
        setState("playing");
        questionStart.current = Date.now();
      }
    } catch {
      // Fallback: retry once
      setTimeout(() => loadRounds(), 1000);
    }
  }, [surahIds, optCount]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const round = rounds[roundIndex];

  const advanceToNext = useCallback(
    (nextIdx: number) => {
      if (nextIdx >= rounds.length) {
        // Load more rounds
        loadRounds().then(() => {
          setRoundIndex(0);
        });
        return;
      }
      setRoundIndex(nextIdx);
      setOptions(buildOptions(rounds[nextIdx], optCount));
      setState("playing");
      setSelected(null);
      setLastDelta(null);
      questionStart.current = Date.now();
    },
    [rounds, optCount, loadRounds],
  );

  const handleAnswer = (idx: number) => {
    if (state !== "playing" || !round) return;
    setSelected(idx);
    const isCorrect = options[idx].isCorrect;
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
      setTimeout(() => advanceToNext(roundIndex + 1), 1200);
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
        setTimeout(() => advanceToNext(roundIndex + 1), 1500);
      }
    }
  };

  const handleRestart = () => {
    setRoundIndex(0);
    setState("loading");
    setSelected(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLastDelta(null);
    setLives(3);
    setChainLength(0);
    setIsNewHighScore(false);
    setNewAchievements([]);
    submittedRef.current = false;
    sessionStart.current = Date.now();
    loadRounds();
  };

  // Submit score on game over
  useEffect(() => {
    if (state === "gameover" && score > 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({
        data: {
          gameId: "verse-chain",
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
        })
        .catch(() => {});
    }
  }, [state, score, difficulty]);

  if (state === "gameover") {
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
        onRestart={handleRestart}
        onSetup={onSetup}
      />
    );
  }

  if (state === "loading" || !round) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center game-bg"
        style={gameBgStyle(THEME, "verse-chain")}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: `${P} transparent ${P} ${P}` }}
          />
          <p className="text-sm" style={{ color: `${P}90` }}>
            {t.verseChainGame.loading}
          </p>
        </div>
      </div>
    );
  }

  const currentText = round.current.textUthmani;

  return (
    <div
      className="max-w-lg mx-auto pb-24 game-bg"
      style={gameBgStyle(THEME, "verse-chain")}
    >
      <div className="px-4 pt-2">
        {/* Score and lives */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="game-score-badge"
            style={{ backgroundColor: `${P}25`, color: P }}
          >
            {score}
          </span>
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: 3 }, (_, i) => (
              <span
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < lives ? "game-heart-beat" : "opacity-20"}`}
                style={
                  i < lives
                    ? { backgroundColor: `${P}20`, color: P, animationDelay: `${i * 0.15}s` }
                    : { backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }
                }
              >
                {i < lives ? "\u2713" : "\u2717"}
              </span>
            ))}
          </div>
        </div>

        {/* Chain counter */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(chainLength, 8) }, (_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full game-chain-link"
                style={{
                  backgroundColor: P,
                  animationDelay: `${i * 0.05}s`,
                  boxShadow: `0 0 6px ${THEME.glow}`,
                }}
              />
            ))}
            {chainLength > 8 && (
              <span className="text-xs font-bold" style={{ color: P }}>
                +{chainLength - 8}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            {chainLength === 0
              ? t.verseChainGame.startChain
              : t.verseChainGame.chainCount.replace("{count}", String(chainLength))}
          </span>
          {streak >= 2 && (
            <span
              className="game-streak-fire ml-auto"
              style={{
                color: P,
                backgroundColor: `${P}20`,
                ["--glow-color" as string]: THEME.glow,
              }}
            >
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
            {round.current.surahName} &middot; {round.current.ayahNumber}. Ayet
          </p>
          <p
            className="text-[2.5rem] text-right leading-[2.6] text-[var(--color-text-primary)] mb-3"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {currentText.trim().split(/\s+/).slice(0, -1).join(" ")}{" "}
            <span
              className="font-medium px-2 py-0.5 rounded-lg game-pulse-glow"
              style={{
                color: P,
                backgroundColor: `${P}18`,
                ["--glow-color" as string]: THEME.glow,
              }}
            >
              {lastWord(currentText)}
            </span>
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-secondary)]">
              {t.verseChainGame.lastWord}
            </span>
            <span
              className="text-xl font-medium"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "var(--font-arabic)", color: P }}
            >
              {lastWord(currentText)}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
              {t.verseChainGame.whichVerseContinues}
            </span>
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
                bgColor = "rgba(220,38,38,0.12)";
                borderColor = "rgba(239,68,68,0.5)";
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
                  <span
                    className="text-xs font-medium text-[var(--color-text-secondary)]"
                    style={opt.isCorrect && state !== "playing" ? { color: P } : {}}
                  >
                    {state !== "playing" ? opt.surahName : `${opt.surahId}:${opt.ayahNumber}`}
                  </span>
                  {selected === idx && state === "correct" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: P }}>
                      {"\u2713"} {lastDelta !== null && formatDelta(lastDelta)}
                    </span>
                  )}
                  {selected === idx && state === "wrong" && !opt.isCorrect && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#f87171" }}>
                      {"\u2717"} {lastDelta !== null && formatDelta(lastDelta)}
                    </span>
                  )}
                  {state !== "playing" && opt.isCorrect && selected !== idx && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: P }}>
                      &#10003; {t.verseChainGame.correctAnswer}
                    </span>
                  )}
                </div>
                <p
                  className="text-[2.5rem] text-right leading-[2.6] text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {firstWords(opt.textUthmani)}
                </p>
              </button>
            );
          })}
        </div>

        {state === "playing" && (
          <p className="text-center text-xs text-[var(--color-text-secondary)]">
            {t.verseChainGame.hintQuestion}
          </p>
        )}
      </div>
    </div>
  );
}

function VerseChainPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        onStart={(ids, _vf, diff) => {
          setSurahIds(ids);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }
  return (
    <VerseChainGame
      surahIds={surahIds}
      difficulty={difficulty}
      onSetup={() => setScreen("setup")}
    />
  );
}
