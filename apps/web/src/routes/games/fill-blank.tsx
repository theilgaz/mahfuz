/**
 * Kelime Doldurma -- ayetteki eksik kelimeyi bul.
 * 2 dakika sayac (zorluk carpanina gore erime hizi degisir).
 * Sik sayisi zorluga gore: Kolay 3, Orta 4, Zor 5, Hafiz 6.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomVerseForGame, type VerseFilter } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { GameVerseLabel } from "~/components/GameVerseLabel";
import {
  OPTION_COUNT,
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  formatTimeDelta,
  type Difficulty,
} from "~/lib/game-scoring";

export const Route = createFileRoute("/games/fill-blank")({
  component: FillBlankGame,
});

const THEME = GAME_THEMES["fill-blank"];
const P = THEME.primary;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

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
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const submittedRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [screen, setScreen] = useState<"game" | "gameover">("game");
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const usedAyahIdsRef = useRef<number[]>([]);
  const optionCount = OPTION_COUNT[difficulty];

  const {
    data: verse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["fill-blank-verse", refreshKey, surahIds, verseFilter],
    queryFn: () =>
      getRandomVerseForGame({
        data: {
          surahIds,
          verseFilter,
          excludeAyahIds: usedAyahIdsRef.current,
          optionCount,
        },
      }),
    staleTime: Infinity,
    retry: 1,
  });

  // Start timer when first question loads
  useEffect(() => {
    if (!isLoading && verse && round === 1 && !timer.isExpired) {
      timer.start();
    }
  }, [isLoading, verse]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && verse) {
      usedAyahIdsRef.current.push(verse.ayahId);
      setGameState("playing");
      questionStart.current = Date.now();
    }
  }, [isLoading, verse]);

  // Timer expired -> end game
  useEffect(() => {
    if (timer.isExpired && screen === "game") {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState !== "playing") nextBtnRef.current?.focus();
  }, [gameState]);

  const handleSelect = useCallback(
    (option: string) => {
      if (gameState !== "playing" || !verse || timer.isExpired) return;
      setSelectedOption(option);
      const answerTime = Date.now() - questionStart.current;

      timer.pause();
      if (option === verse.correctWord) {
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
    [gameState, verse, streak, difficulty, timer.isExpired],
  );

  const endGame = useCallback(() => {
    timer.pause();
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "fill-blank", score, durationMs: Date.now() - sessionStart.current, difficulty, correctCount, wrongCount, bestStreak } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); if (r?.newAchievements?.length) setNewAchievements(r.newAchievements); })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, timer]);

  const nextRound = () => {
    if (timer.isExpired) { endGame(); return; }
    timer.start();
    setRound((r) => r + 1);
    setSelectedOption(null);
    setLastDelta(null);
    setGameState("loading");
    setRefreshKey((k) => k + 1);
  };

  const handleRestart = () => {
    setScore(0); setRound(1); setStreak(0); setBestStreak(0);
    setCorrectCount(0); setWrongCount(0); setLastDelta(null);
    setIsNewHighScore(false); setNewAchievements([]); submittedRef.current = false;
    usedAyahIdsRef.current = [];
    sessionStart.current = Date.now(); setSelectedOption(null);
    setGameState("loading"); setRefreshKey((k) => k + 1); setScreen("game");
    timer.reset();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!verse) return;
      const key = e.key.toLowerCase();
      if (gameState === "playing") {
        const idx = ["a", "b", "c", "d", "e", "f"].indexOf(key);
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
        newAchievements={newAchievements}
        onRestart={handleRestart} onSetup={onSetup}
      />
    );
  }

  if (isError || (!isLoading && !verse)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">Ayet bulunamadi</p>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: P }}>
          {t.fillBlankGame.next}
        </button>
      </div>
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
    <div className="max-w-lg mx-auto pb-32 game-bg" style={gameBgStyle(THEME, "fill-blank")}>
      <div className="px-4 pt-2">
        <GameScoreBar
          theme={THEME}
          timerDisplay={timer.display}
          timerProgress={timer.progress}
          score={score}
          streak={streak}
          lastDelta={lastDelta}
          round={round}
        />

        {/* Verse label */}
        <GameVerseLabel surahId={verse.surahId} ayahNumber={verse.verseNum} primary={P} fallbackName={verse.surahName} />

        {/* Verse card -- mushaf style */}
        <div
          className="relative rounded-sm mb-6 overflow-hidden game-slide-up"
          style={{
            backgroundColor: "var(--mushaf-bg, #f8f4ec)",
            boxShadow: `
              0 1px 3px var(--mushaf-shadow, rgba(0,0,0,0.06)),
              0 6px 16px var(--mushaf-shadow, rgba(0,0,0,0.06)),
              0 20px 40px var(--mushaf-shadow, rgba(0,0,0,0.06))
            `,
          }}
        >
          {/* Outer border */}
          <div
            className="absolute inset-0 pointer-events-none rounded-sm"
            style={{ border: "1.5px solid var(--mushaf-border, rgba(0,0,0,0.1))" }}
          />
          {/* Inner border */}
          <div
            className="absolute pointer-events-none"
            style={{ inset: "6px", border: "0.5px solid var(--mushaf-border, rgba(0,0,0,0.1))", opacity: 0.6 }}
          />
          {/* Top accent line */}
          <div
            className="absolute top-[6px] left-[16px] right-[16px] h-[0.5px] pointer-events-none"
            style={{ background: `${P}30` }}
          />
          {/* Bottom accent line */}
          <div
            className="absolute bottom-[6px] left-[16px] right-[16px] h-[0.5px] pointer-events-none"
            style={{ background: `${P}30` }}
          />
          {/* Inner shadow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 30px var(--mushaf-inner-shadow, rgba(0,0,0,0.03)),
                inset 0 0 60px var(--mushaf-inner-shadow, rgba(0,0,0,0.03))
              `,
            }}
          />
          <div className="relative px-5 py-7 sm:px-8 sm:py-9 text-right leading-[2.8] text-[1.75rem] sm:text-[2.2rem]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-text-primary)" }}>
            {verse.words.map((w, i) => {
              if (i === verse.blankIndex) {
                const blankStyle =
                  gameState === "correct"
                    ? { borderColor: `${P}90`, backgroundColor: `${P}15`, color: P }
                    : gameState === "wrong"
                      ? { borderColor: "rgba(239,68,68,0.5)", backgroundColor: "rgba(220,38,38,0.12)", color: "#f87171" }
                      : { borderColor: `${P}50`, backgroundColor: "var(--mushaf-bg, #f8f4ec)" };
                return (
                  <span
                    key={i}
                    className={`inline-block mx-1 px-4 py-1 rounded-lg min-w-[72px] text-center align-middle font-semibold transition-all ${isAnswered ? "game-pop" : "game-pulse-glow"}`}
                    style={{
                      ...blankStyle,
                      border: isAnswered ? `2px solid ${blankStyle.borderColor}` : `2px dashed ${blankStyle.borderColor}`,
                      color: isAnswered ? blankStyle.color : "transparent",
                      ["--glow-color" as string]: THEME.glow,
                    }}
                  >
                    {isAnswered ? verse.correctWord : "\u200C"}
                  </span>
                );
              }
              return <span key={i} className="mx-0.5">{w}</span>;
            })}
          </div>
        </div>

        {/* Options -- 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {verse.options.map((opt, idx) => {
            let bgColor = "var(--color-surface)";
            let borderColor = "var(--color-border)";
            let textColor = "var(--color-text-primary)";
            let labelBg = `${P}15`;
            let labelColor = P;
            let shadow = "0 1px 3px rgba(0,0,0,0.04)";
            let icon: React.ReactNode = null;
            let extraClass = "";

            if (isAnswered) {
              if (opt === verse.correctWord) {
                bgColor = `${P}10`;
                borderColor = `${P}50`;
                textColor = P;
                labelBg = `${P}25`;
                labelColor = P;
                shadow = `0 2px 8px ${THEME.glow}`;
                extraClass = "game-bounce-in";
                icon = <span className="text-sm font-bold">&#10003;</span>;
              } else if (opt === selectedOption) {
                bgColor = "rgba(220,38,38,0.12)";
                borderColor = "rgba(239,68,68,0.5)";
                textColor = "#f87171";
                labelBg = "rgba(220,38,38,0.2)";
                labelColor = "#f87171";
                shadow = "none";
                extraClass = "game-shake";
                icon = <span className="text-sm font-bold">&#10007;</span>;
              } else {
                bgColor = "transparent";
                borderColor = "transparent";
                textColor = "var(--color-text-secondary)";
                shadow = "none";
                extraClass = "opacity-30";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                className={`game-option-card flex flex-col items-center justify-center py-3 ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor, color: textColor, boxShadow: shadow }}
              >
                <span
                  className="text-[0.6rem] font-bold w-5 h-5 rounded flex items-center justify-center self-start"
                  style={{ backgroundColor: labelBg, color: labelColor }}
                >
                  {OPTION_LABELS[idx]}
                </span>
                <span
                  className="text-[1.6rem] sm:text-[1.85rem] leading-snug mt-1"
                  dir="rtl" lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {opt}
                </span>
                {icon && <span className="absolute top-2 right-2.5">{icon}</span>}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {isAnswered && (
          <div
            className="rounded-xl border px-4 py-3.5 flex items-center justify-between gap-3 game-slide-up"
            style={
              gameState === "correct"
                ? { backgroundColor: `${P}08`, borderColor: `${P}25`, boxShadow: `0 2px 12px ${THEME.glow}` }
                : { backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(239,68,68,0.3)" }
            }
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${gameState === "correct" ? "game-star-spin" : ""}`}
                style={gameState === "correct" ? { backgroundColor: `${P}18`, color: P } : { backgroundColor: "rgba(220,38,38,0.2)", color: "#f87171" }}
              >
                {gameState === "correct" ? "\u2713" : "\u2717"}
              </span>
              <div>
                <p className="text-sm font-bold" style={gameState === "correct" ? { color: P } : { color: "#f87171" }}>
                  {gameState === "correct" ? t.fillBlankGame.correct : t.fillBlankGame.wrong}{" "}
                  {lastDelta !== null && <span className="font-semibold">{formatDelta(lastDelta)}</span>}
                </p>
                {gameState === "wrong" && (
                  <p className="text-xs mt-0.5" style={{ color: "#f87171" }}>
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
              {t.fillBlankGame.next}
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
        gameImg={THEME.img}
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
