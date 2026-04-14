/**
 * Kelime Doldurma -- ayetteki eksik kelimeyi bul (4 secenek).
 * 10 round, zorluk secimi, zaman bonusu, yanlis cezasi.
 * Themed: warm golden/parchment, puzzle-piece motif.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomVerseForGame, type VerseFilter } from "~/lib/game-service";
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

export const Route = createFileRoute("/games/fill-blank")({
  component: FillBlankGame,
});

const THEME = GAME_THEMES["fill-blank"];
const P = THEME.primary;

const OPTION_LABELS = ["A", "B", "C", "D"];

type GameState = "playing" | "correct" | "wrong" | "loading";
type Screen = "setup" | "game" | "gameover";

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
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const submittedRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [screen, setScreen] = useState<"game" | "gameover">("game");
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const { data: verse, isLoading } = useQuery({
    queryKey: ["fill-blank-verse", refreshKey, surahIds, verseFilter],
    queryFn: () => getRandomVerseForGame({ data: { surahIds, verseFilter } }),
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && verse) {
      setGameState("playing");
      questionStart.current = Date.now();
    }
  }, [isLoading, verse]);

  useEffect(() => {
    if (gameState !== "playing") nextBtnRef.current?.focus();
  }, [gameState]);

  const handleSelect = useCallback(
    (option: string) => {
      if (gameState !== "playing" || !verse) return;
      setSelectedOption(option);
      const answerTime = Date.now() - questionStart.current;

      if (option === verse.correctWord) {
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
    [gameState, verse, streak, difficulty],
  );

  const endGame = useCallback(() => {
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "fill-blank", score, durationMs: Date.now() - sessionStart.current, difficulty } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty]);

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) { endGame(); return; }
    setRound((r) => r + 1);
    setSelectedOption(null);
    setLastDelta(null);
    setGameState("loading");
    setRefreshKey((k) => k + 1);
  };

  const handleRestart = () => {
    setScore(0); setRound(1); setStreak(0); setBestStreak(0);
    setCorrectCount(0); setWrongCount(0); setLastDelta(null);
    setIsNewHighScore(false); submittedRef.current = false;
    sessionStart.current = Date.now(); setSelectedOption(null);
    setGameState("loading"); setRefreshKey((k) => k + 1); setScreen("game");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!verse) return;
      const key = e.key.toLowerCase();
      if (gameState === "playing") {
        const idx = ["a", "b", "c", "d"].indexOf(key);
        if (idx !== -1 && verse.options[idx] !== undefined) { e.preventDefault(); handleSelect(verse.options[idx]); }
      } else if (key === "enter" || key === " ") { e.preventDefault(); nextRound(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, verse, handleSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  if (screen === "gameover") {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        onRestart={handleRestart} onSetup={onSetup}
      />
    );
  }

  if (isLoading || !verse) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${P}30`, borderTopColor: P }} />
        <p className="text-[var(--color-text-secondary)] text-sm">{t.fillBlankGame.loadingVerse}</p>
      </div>
    );
  }

  const isAnswered = gameState !== "playing";

  return (
    <div className="max-w-lg mx-auto pb-32 game-bg" style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}>
      <GameHeader
        img={THEME.img} bg={THEME.bg} isDark={THEME.isDark}
        title={t.gamesHub.fillBlankTitle}
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

        <p className="text-xs font-medium text-[var(--color-text-secondary)] text-center mb-3">
          {t.fillBlankGame.verseLabel.replace("{surahName}", verse.surahName).replace("{verseNum}", String(verse.verseNum))}
        </p>

        {/* Verse card */}
        <div
          className="rounded-2xl border bg-[var(--color-surface)] mb-5 overflow-hidden game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <div className="px-6 py-6 text-right leading-[2.4] text-[1.35rem]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
            {verse.words.map((w, i) => {
              if (i === verse.blankIndex) {
                const blankStyle =
                  gameState === "correct"
                    ? { borderColor: `${P}80`, backgroundColor: `${P}18`, color: P }
                    : gameState === "wrong"
                      ? { borderColor: "#ef444480", backgroundColor: "#fef2f2", color: "#dc2626" }
                      : { borderColor: `${P}40`, backgroundColor: `${P}0a`, color: "transparent" };
                return (
                  <span
                    key={i}
                    className={`inline-block mx-1 px-3 py-0.5 rounded-xl border-2 min-w-[72px] text-center align-middle font-semibold transition-all ${isAnswered ? "game-pop" : "game-pulse-glow"}`}
                    style={{ ...blankStyle, ["--glow-color" as string]: THEME.glow }}
                  >
                    {isAnswered ? verse.correctWord : "\u200C"}
                  </span>
                );
              }
              return <span key={i} className="mx-0.5">{w}</span>;
            })}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5 mb-4">
          {verse.options.map((opt, idx) => {
            let bgColor = "var(--color-surface)";
            let borderColor = `${P}20`;
            let textColor = "var(--color-text-primary)";
            let labelBg = `${P}12`;
            let labelColor = `${P}cc`;
            let icon: React.ReactNode = null;
            let extraClass = "";

            if (isAnswered) {
              if (opt === verse.correctWord) {
                bgColor = `${P}12`;
                borderColor = `${P}60`;
                textColor = P;
                labelBg = `${P}30`;
                labelColor = P;
                extraClass = "game-bounce-in";
                icon = <span className="text-base">&#10003;</span>;
              } else if (opt === selectedOption) {
                bgColor = "#fef2f2";
                borderColor = "#fca5a5";
                textColor = "#dc2626";
                labelBg = "#fee2e2";
                labelColor = "#ef4444";
                extraClass = "game-shake";
                icon = <span className="text-base">&#10007;</span>;
              } else {
                bgColor = "transparent";
                borderColor = `${P}10`;
                textColor = "var(--color-text-secondary)";
                extraClass = "opacity-35";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                className={`game-option-card flex items-center gap-3 ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <span
                  className="text-[11px] font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: labelBg, color: labelColor }}
                >
                  {OPTION_LABELS[idx]}
                </span>
                <span
                  className="flex-1 text-right text-lg leading-snug"
                  style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
                >
                  {opt}
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {isAnswered && (
          <div
            className="rounded-xl border px-5 py-4 flex items-center justify-between gap-4 game-slide-up"
            style={
              gameState === "correct"
                ? { backgroundColor: `${P}10`, borderColor: `${P}30`, boxShadow: `0 2px 12px ${THEME.glow}` }
                : { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
            }
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-lg ${gameState === "correct" ? "game-star-spin" : ""}`}
              >
                {gameState === "correct" ? "\u{2B50}" : "\u{1F614}"}
              </span>
              <div>
                <p className="text-sm font-bold" style={gameState === "correct" ? { color: P } : { color: "#dc2626" }}>
                  {gameState === "correct" ? t.fillBlankGame.correct : t.fillBlankGame.wrong}{" "}
                  {lastDelta !== null && <span className="font-semibold">{formatDelta(lastDelta)}</span>}
                </p>
                {gameState === "wrong" && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {t.fillBlankGame.correctAnswer} <span style={{ fontFamily: "var(--font-arabic)" }}>{verse.correctWord}</span>
                  </p>
                )}
                {gameState === "correct" && streak >= 2 && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: P }}>
                    {t.fillBlankGame.streak.replace("{count}", String(streak))}
                  </p>
                )}
              </div>
            </div>
            <button
              ref={nextBtnRef}
              onClick={nextRound}
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {round >= TOTAL_ROUNDS ? t.gameScoring.gameOver : t.fillBlankGame.next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FillBlankGame() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [verseFilter, setVerseFilter] = useState<VerseFilter | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameTitle={t.gamesHub.fillBlankTitle}
        onStart={(ids, vf, diff) => {
          setSurahIds(ids);
          setVerseFilter(vf);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }
  return <GameScreen surahIds={surahIds} verseFilter={verseFilter} difficulty={difficulty} onSetup={() => setScreen("setup")} />;
}
