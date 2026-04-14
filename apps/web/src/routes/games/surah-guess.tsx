/**
 * Sure Tanima -- ayet metni gorunce sureyi tahmin et.
 * 10 round, zorluk secimi, zaman bonusu, yanlis cezasi.
 * Themed: sage green, ear/sound waves motif.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVerseGuessQuestion } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { GameHeader } from "~/components/GameHeader";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES } from "~/lib/game-themes";
import {
  TOTAL_ROUNDS,
  calcCorrectPoints,
  calcWrongPenalty,
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
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: question, isLoading } = useQuery({
    queryKey: ["surah-guess", refreshKey, surahIds],
    queryFn: () => getVerseGuessQuestion({ data: { surahIds } }),
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && question) questionStart.current = Date.now();
  }, [isLoading, question]);

  const handleSelect = useCallback(
    (surahId: number) => {
      if (gameState !== "playing" || !question) return;
      setSelectedId(surahId);
      const answerTime = Date.now() - questionStart.current;

      if (surahId === question.correctSurahId) {
        const newStreak = streak + 1;
        const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
        setScore((s) => s + pts);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setLastDelta(pts);
        setGameState("correct");
      } else {
        const penalty = calcWrongPenalty(difficulty);
        setScore((s) => Math.max(0, s - penalty));
        setStreak(0);
        setWrongCount((c) => c + 1);
        setLastDelta(-penalty);
        setGameState("wrong");
      }
    },
    [gameState, question, streak, difficulty],
  );

  const endGame = useCallback(() => {
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "surah-guess", score, durationMs: Date.now() - sessionStart.current, difficulty } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); })
        .catch(() => {});
    }
    setShowGameOver(true);
  }, [score, difficulty]);

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) { endGame(); return; }
    setGameState("playing");
    setSelectedId(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    setRefreshKey((k) => k + 1);
  };

  const handleRestart = () => {
    setScore(0); setRound(1); setStreak(0); setBestStreak(0);
    setCorrectCount(0); setWrongCount(0); setLastDelta(null);
    setIsNewHighScore(false); submittedRef.current = false;
    sessionStart.current = Date.now(); setGameState("playing");
    setSelectedId(null); setRefreshKey((k) => k + 1); setShowGameOver(false);
  };

  // Auto-advance on correct after 2s
  useEffect(() => {
    if (gameState !== "correct") return;
    const timer = setTimeout(nextRound, 2000);
    return () => clearTimeout(timer);
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  if (showGameOver) {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        onRestart={handleRestart} onSetup={onSetup}
      />
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
    <div className="max-w-lg mx-auto pb-24 game-bg" style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}>
      <GameHeader
        img={THEME.img} bg={THEME.bg} isDark={THEME.isDark}
        title={t.gamesHub.surahGuessTitle}
        onBack={() => endGame()}
        right={
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="game-streak-fire" style={{ color: P, backgroundColor: `${P}20`, ["--glow-color" as string]: THEME.glow }}>
                {streak}x
              </span>
            )}
          </div>
        }
      />
      <div className="px-4 pt-2">
        <GameScoreBar theme={THEME} round={round} score={score} streak={streak} lastDelta={lastDelta} />

        {/* Verse card */}
        <div
          className="px-5 py-5 rounded-2xl border bg-[var(--color-surface)] mb-5 game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-3 text-center">Bu ayet hangi sureye ait?</p>
          <p className="text-xl text-right leading-loose text-[var(--color-text-primary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
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
                bgColor = "#fef2f2";
                borderColor = "#fca5a5";
                textColor = "#dc2626";
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
                <p className="text-sm font-medium">{opt.name}</p>
                <p className="text-base mt-0.5" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{opt.arabic}</p>
              </button>
            );
          })}
        </div>

        {gameState === "correct" && (
          <div
            className="px-4 py-3 rounded-xl text-center border game-slide-up"
            style={{ backgroundColor: `${P}10`, borderColor: `${P}30`, boxShadow: `0 2px 12px ${THEME.glow}` }}
          >
            <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: P }}>
              <span className="game-star-spin">{"\u{2B50}"}</span>
              {t.fillBlankGame.correct} {lastDelta !== null && formatDelta(lastDelta)}
            </p>
          </div>
        )}

        {gameState === "wrong" && (
          <>
            <div className="px-4 py-3 rounded-xl text-center bg-red-50 border border-red-100 mb-3 game-slide-up">
              <p className="text-sm font-semibold text-red-600 flex items-center justify-center gap-2">
                <span>{"\u{1F614}"}</span>
                {t.fillBlankGame.wrong} {lastDelta !== null && formatDelta(lastDelta)} &middot; {question.correctSurahName}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {round >= TOTAL_ROUNDS ? t.gameScoring.gameOver : t.fillBlankGame.next}
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
        gameTitle={t.gamesHub.surahGuessTitle}
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
