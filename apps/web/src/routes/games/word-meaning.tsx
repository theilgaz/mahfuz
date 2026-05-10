/**
 * Kelime Anlamı -- Arapça kelime -> Türkçe anlam.
 * 2 dakika sayaç (zorluk çarpanına göre erime hızı değişir).
 * Şık sayısı zorluğa göre: Kolay 3, Orta 4, Zor 5, Hafız 6.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import type { League } from "~/lib/league";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";

import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { WORD_PAIRS, getLocalizedPair } from "~/lib/word-pairs";
import {
  OPTION_COUNT,
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

const THEME = GAME_THEMES["word-meaning"];
const P = THEME.primary;

export const Route = createFileRoute("/games/word-meaning")({
  component: WordMeaningPage,
});


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomQuestion(usedIndices: Set<number>, optionCount = 4, locale = "tr") {
  const available = WORD_PAIRS.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const pool = available.length > 0 ? available : Array.from({ length: WORD_PAIRS.length }, (_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  const pair = WORD_PAIRS[idx];
  const localized = getLocalizedPair(pair, locale);
  // Base 3 wrong answers + extra distractors from other pairs for harder difficulties
  const wrongs = [...localized.wrong];
  if (optionCount > 4) {
    const extras = WORD_PAIRS
      .filter((_, i) => i !== idx)
      .map((p) => getLocalizedPair(p, locale).meaning)
      .filter((m) => m !== localized.meaning && !wrongs.includes(m));
    const shuffledExtras = shuffle(extras);
    wrongs.push(...shuffledExtras.slice(0, optionCount - 4));
  }
  const options = shuffle([localized.meaning, ...wrongs.slice(0, optionCount - 1)]);
  return { arabic: pair.arabic, meaning: localized.meaning, options, idx };
}

type GameState = "playing" | "correct" | "wrong";

function WordMeaningPage() {
  const { t, locale } = useTranslation();
  const [screen, setScreen] = useState<"setup" | "game" | "gameover">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const timer = useGameTimer(difficulty);
  const optionCount = OPTION_COUNT[difficulty];

  // Game state
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
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
  const [question, setQuestion] = useState(() => getRandomQuestion(new Set(), optionCount, locale));
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const timerStartedRef = useRef(false);

  // Start timer when game screen is shown
  useEffect(() => {
    if (screen === "game" && !timerStartedRef.current && !timer.isExpired) {
      timer.start();
      timerStartedRef.current = true;
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer expired -> end game
  useEffect(() => {
    if (timer.isExpired && screen === "game") {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (opt: string) => {
      if (gameState !== "playing" || timer.isExpired) return;
      timer.pause();
      setSelected(opt);
      const answerTime = Date.now() - questionStart.current;

      if (opt === question.meaning) {
        const newStreak = streak + 1;
        const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
        const timeBonus = calcTimeBonusMs(answerTime);
        if (timeBonus > 0) timer.addTime(timeBonus);
        setScore((s) => s + pts);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setLastDelta(pts);
        setGameState("correct");
        setUsedIndices((prev) => new Set(prev).add(question.idx));
      } else {
        const penalty = calcWrongPenalty(difficulty);
        timer.penalizeTime(WRONG_TIME_PENALTY_MS);
        setScore((s) => Math.max(0, s - penalty));
        setStreak(0);
        setWrongCount((c) => c + 1);
        setLastDelta(-penalty);
        setGameState("wrong");
      }
    },
    [gameState, question, streak, difficulty, timer.isExpired],
  );

  const endGame = useCallback(() => {
    timer.pause();
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "word-meaning", score, durationMs: Date.now() - sessionStart.current, difficulty, correctCount, wrongCount, bestStreak } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); if (r?.newAchievements?.length) setNewAchievements(r.newAchievements); if (r?.leagueUp) setLeagueUp(r.leagueUp); })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, timer]);

  const nextRound = () => {
    if (timer.isExpired) { endGame(); return; }
    timer.start();
    const nextUsed = gameState === "correct" ? new Set([...usedIndices, question.idx]) : usedIndices;
    setQuestion(getRandomQuestion(nextUsed, optionCount, locale));
    setGameState("playing");
    setSelected(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    questionStart.current = Date.now();
  };

  const handleRestart = () => {
    const fresh = new Set<number>();
    setUsedIndices(fresh); setScore(0); setRound(1); setStreak(0);
    setBestStreak(0); setCorrectCount(0); setWrongCount(0);
    setLastDelta(null); setIsNewHighScore(false); setNewAchievements([]); setLeagueUp(null);
    submittedRef.current = false; sessionStart.current = Date.now();
    questionStart.current = Date.now(); timerStartedRef.current = false;
    setQuestion(getRandomQuestion(fresh, optionCount, locale));
    setGameState("playing"); setSelected(null); setScreen("game");
    timer.reset();
  };

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId="word-meaning"
        difficultyOnly
        onStart={(_ids, _vf, diff) => {
          setDifficulty(diff ?? "medium");
          handleRestart();
        }}
      />
    );
  }

  if (screen === "gameover") {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        newAchievements={newAchievements} leagueUp={leagueUp}
        onRestart={handleRestart} onSetup={() => setScreen("setup")}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24 game-bg" style={gameBgStyle(THEME, "word-meaning")}>
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

        {/* Arabic word card */}
        <div
          className="px-5 py-8 rounded-2xl border bg-[var(--color-surface)] mb-5 text-center game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t.wordMeaningGame.questionPrompt}</p>
          <p
            className="text-5xl font-bold text-[var(--color-text-primary)] leading-[1.6] game-bounce-in"
            dir="rtl" lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {question.arabic}
          </p>
        </div>

        {/* Options - 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {question.options.map((opt) => {
            let bgColor = "var(--color-surface)";
            let borderColor = `${P}20`;
            let textColor = "var(--color-text-primary)";
            let extraClass = "";

            if (gameState !== "playing") {
              if (opt === question.meaning) {
                bgColor = `${P}12`;
                borderColor = `${P}60`;
                textColor = P;
                extraClass = "game-bounce-in";
              } else if (opt === selected) {
                bgColor = "rgba(220,38,38,0.12)";
                borderColor = "rgba(239,68,68,0.5)";
                textColor = "#f87171";
                extraClass = "game-shake";
              } else {
                bgColor = "transparent";
                borderColor = `${P}10`;
                extraClass = "opacity-30";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={gameState !== "playing"}
                className={`game-option-card text-center ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}
        </div>

        {gameState === "correct" && (
          <>
            <div
              className="px-4 py-3 rounded-xl text-center border mb-3 game-slide-up"
              style={{ backgroundColor: `${P}10`, borderColor: `${P}30`, boxShadow: `0 2px 12px ${THEME.glow}` }}
            >
              <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: P }}>
                <span className="game-star-spin">{"\u2713"}</span>
                {t.fillBlankGame.correct} {lastDelta !== null && formatDelta(lastDelta)}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {t.wordMeaningGame.nextQuestion}
            </button>
          </>
        )}

        {gameState === "wrong" && (
          <>
            <div className="px-4 py-3 rounded-xl text-center border mb-3 game-slide-up" style={{ backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(239,68,68,0.3)" }}>
              <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "#f87171" }}>
                <span>{"\u2717"}</span>
                {t.wordMeaningGame.wrong.replace("{word}", question.meaning)} {lastDelta !== null && formatDelta(lastDelta)}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {t.wordMeaningGame.nextQuestion}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
