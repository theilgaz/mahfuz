/**
 * Sure Tanıma -- ayet metni görünce sureyi tahmin et.
 * 2 dakika sayaç (zorluk çarpanına göre erime hızı değişir).
 * Şık sayısı zorluğa göre: Kolay 3, Orta 4, Zor 5, Hafız 6.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVerseGuessQuestion } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import type { League } from "~/lib/league";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";
import {
  OPTION_COUNT,
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

const THEME = GAME_THEMES["surah-guess"];
const P = THEME.primary;

export const Route = createFileRoute("/games/surah-guess")({
  component: SurahGuessGame,
});

type GameState = "playing" | "correct" | "wrong";
type Screen = "setup" | "game";

function GameScreen({ surahIds, difficulty, onSetup }: { surahIds: number[]; difficulty: Difficulty; onSetup: () => void }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
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
  const [showGameOver, setShowGameOver] = useState(false);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const usedAyahIdsRef = useRef<number[]>([]);
  const optionCount = OPTION_COUNT[difficulty];

  const {
    data: question,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["surah-guess", refreshKey, surahIds],
    queryFn: () =>
      getVerseGuessQuestion({
        data: { surahIds, excludeAyahIds: usedAyahIdsRef.current, optionCount },
      }),
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });

  // Start timer when first question loads
  useEffect(() => {
    if (!isLoading && question && round === 1 && !timer.isExpired) {
      timer.start();
    }
  }, [isLoading, question]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && question) {
      usedAyahIdsRef.current.push(question.ayahId);
      questionStart.current = Date.now();
    }
  }, [isLoading, question]);

  // Timer expired -> end game
  useEffect(() => {
    if (timer.isExpired && !showGameOver) {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (surahId: number) => {
      if (gameState !== "playing" || !question || timer.isExpired) return;
      timer.pause();
      setSelectedId(surahId);
      const answerTime = Date.now() - questionStart.current;

      if (surahId === question.correctSurahId) {
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
      submitScore({ data: { gameId: "surah-guess", score, durationMs: Date.now() - sessionStart.current, difficulty, correctCount, wrongCount, bestStreak } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); if (r?.newAchievements?.length) setNewAchievements(r.newAchievements); if (r?.leagueUp) setLeagueUp(r.leagueUp); })
        .catch(() => {});
    }
    setShowGameOver(true);
  }, [score, difficulty, timer]);

  const nextRound = () => {
    if (timer.isExpired) { endGame(); return; }
    timer.start();
    setGameState("playing");
    setSelectedId(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    setRefreshKey((k) => k + 1);
  };

  const handleRestart = () => {
    setScore(0); setRound(1); setStreak(0); setBestStreak(0);
    setCorrectCount(0); setWrongCount(0); setLastDelta(null);
    setIsNewHighScore(false); setNewAchievements([]); setLeagueUp(null); submittedRef.current = false;
    usedAyahIdsRef.current = [];
    sessionStart.current = Date.now(); setGameState("playing");
    setSelectedId(null); setRefreshKey((k) => k + 1); setShowGameOver(false);
    timer.reset();
  };

  if (showGameOver) {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        newAchievements={newAchievements} leagueUp={leagueUp}
        onRestart={handleRestart} onSetup={onSetup}
      />
    );
  }

  if (isError || (!isLoading && !question)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">Ayet bulunamadi</p>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: P }}>
          {t.fillBlankGame.next}
        </button>
      </div>
    );
  }

  if (isLoading || !question) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${P}30`, borderTopColor: P }} />
        <p className="text-[var(--color-text-secondary)] text-sm">Ayet yukleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24 game-bg" style={gameBgStyle(THEME, "surah-guess")}>
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

        {/* Verse card */}
        <div
          className="px-5 py-5 rounded-2xl border bg-[var(--color-surface)] mb-5 game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-3 text-center">{t.surahGuessGame.questionPrompt}</p>
          <p className="text-[2.5rem] text-right leading-[2.6] text-[var(--color-text-primary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
            {question.verseText}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {question.options.map((opt) => {
            const isCorrect = opt.id === question.correctSurahId;
            const isSelected = opt.id === selectedId;
            let bgColor = "var(--color-surface)";
            let borderColor = `${P}20`;
            let textColor = "var(--color-text-primary)";
            let extraClass = "";

            if (gameState !== "playing") {
              if (isCorrect) {
                bgColor = `${P}12`;
                borderColor = `${P}60`;
                textColor = P;
                extraClass = "game-bounce-in";
              } else if (isSelected) {
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
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={gameState !== "playing"}
                className={`game-option-card text-left ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <p className="text-sm font-medium">{getSurahName(opt.id, locale) || opt.name}</p>
                <p className="text-xl mt-0.5" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{opt.arabic}</p>
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
              {t.fillBlankGame.next}
            </button>
          </>
        )}

        {gameState === "wrong" && (
          <>
            <div className="px-4 py-3 rounded-xl text-center border mb-3 game-slide-up" style={{ backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(239,68,68,0.3)" }}>
              <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "#f87171" }}>
                <span>{"\u2717"}</span>
                {t.fillBlankGame.wrong} {lastDelta !== null && formatDelta(lastDelta)} &middot; {getSurahName(question.correctSurahId, locale) || question.correctSurahName}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {t.fillBlankGame.next}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SurahGuessGame() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId="surah-guess"
        onStart={(ids, _vf, diff) => {
          setSurahIds(ids);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }
  return <GameScreen surahIds={surahIds} difficulty={difficulty} onSetup={() => setScreen("setup")} />;
}
