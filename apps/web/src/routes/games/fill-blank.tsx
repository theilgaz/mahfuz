/**
 * Kelime Doldurma — ayetteki eksik kelimeyi bul (4 seçenek).
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomVerseForGame, type VerseFilter } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";
import { GameHeader } from "~/components/GameHeader";
import { GAME_THEMES } from "~/lib/game-themes";

export const Route = createFileRoute("/games/fill-blank")({
  component: FillBlankGame,
});

const THEME = GAME_THEMES["fill-blank"];
const P = THEME.primary; // e.g. "#8B6914"

type GameState = "playing" | "correct" | "wrong" | "loading";
type Screen = "setup" | "game";

const OPTION_LABELS = ["A", "B", "C", "D"];

function GameScreen({ surahIds, verseFilter, onSetup }: { surahIds: number[]; verseFilter?: VerseFilter; onSetup: () => void }) {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const submittedScore = useRef(0);
  const sessionStart = useRef(Date.now());
  const [gameState, setGameState] = useState<GameState>("loading");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const { data: verse, isLoading } = useQuery({
    queryKey: ["fill-blank-verse", refreshKey, surahIds, verseFilter],
    queryFn: () => getRandomVerseForGame({ data: { surahIds, verseFilter } }),
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && verse) setGameState("playing");
  }, [isLoading, verse]);

  useEffect(() => {
    if (gameState !== "playing") nextBtnRef.current?.focus();
  }, [gameState]);

  const handleSelect = useCallback((option: string) => {
    if (gameState !== "playing" || !verse) return;
    setSelectedOption(option);
    if (option === verse.correctWord) {
      setScore((s) => s + 10);
      setStreak((s) => s + 1);
      setGameState("correct");
    } else {
      setStreak(0);
      setGameState("wrong");
    }
  }, [gameState, verse]);

  const nextRound = () => {
    setRound((r) => r + 1);
    setSelectedOption(null);
    setGameState("loading");
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!verse) return;
      const key = e.key.toLowerCase();
      if (gameState === "playing") {
        const idx = ["a", "b", "c", "d"].indexOf(key);
        if (idx !== -1 && verse.options[idx] !== undefined) {
          e.preventDefault();
          handleSelect(verse.options[idx]);
        }
      } else if (key === "enter" || key === " ") {
        e.preventDefault();
        nextRound();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, verse, handleSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  const onBack = () => {
    if (score > submittedScore.current) {
      submittedScore.current = score;
      submitScore({ data: { gameId: "fill-blank", score, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
    }
    onSetup();
  };

  if (isLoading || !verse) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${P}80`, borderTopColor: "transparent" }} />
        <p className="text-[var(--color-text-secondary)] text-sm">{t.fillBlankGame.loadingVerse}</p>
      </div>
    );
  }

  const isAnswered = gameState !== "playing";

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* ── Colored header ── */}
      <GameHeader
        img={THEME.img}
        bg={THEME.bg}
        isDark={THEME.isDark}
        title={t.gamesHub.fillBlankTitle}
        onBack={onBack}
        right={
          <div className="flex items-center gap-1.5">
            {streak >= 2 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: P }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C10 5.5 6.5 7 6.5 12a5.5 5.5 0 0011 0C17.5 7 14 5.5 12 2zm0 14a3 3 0 01-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5a3 3 0 01-3 3z"/>
                </svg>
                {streak}
              </span>
            )}
            <span className="text-sm font-bold tabular-nums">{score}</span>
          </div>
        }
      />

      <div className="px-4 pt-2">
        {/* Sure etiketi */}
        <p className="text-xs font-medium text-[var(--color-text-secondary)] text-center mb-4">
          {t.fillBlankGame.verseLabel.replace("{surahName}", verse.surahName).replace("{verseNum}", String(verse.verseNum))}
        </p>

        {/* ── Ayet kartı ── */}
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] mb-4 overflow-hidden">
          <div
            className="px-6 py-6 text-right leading-[2.4] text-[1.35rem]"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
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
                    className="inline-block mx-1 px-3 py-0.5 rounded-lg border min-w-[72px] text-center align-middle font-semibold transition-all"
                    style={blankStyle}
                  >
                    {isAnswered ? verse.correctWord : "‌"}
                  </span>
                );
              }
              return <span key={i} className="mx-0.5">{w}</span>;
            })}
          </div>
        </div>

        {/* ── Seçenekler ── */}
        <div className="flex flex-col gap-2 mb-4">
          {verse.options.map((opt, idx) => {
            let containerStyle: React.CSSProperties = {};
            let containerClass = "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/5 active:scale-[0.99]";
            let labelClass = "text-[var(--color-text-secondary)] bg-[var(--color-border)]/60";
            let wordClass = "text-[var(--color-text-primary)]";
            let icon: React.ReactNode = null;

            if (isAnswered) {
              if (opt === verse.correctWord) {
                containerClass = "border-2";
                containerStyle = { borderColor: `${P}80`, backgroundColor: `${P}12`, color: P };
                labelClass = "";
                wordClass = "";
                icon = (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: P }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                );
              } else if (opt === selectedOption) {
                containerClass = "border-red-300 bg-red-50";
                labelClass = "text-red-500 bg-red-100";
                wordClass = "text-red-600";
                icon = (
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                );
              } else {
                containerClass = "border-[var(--color-border)]/40 bg-transparent opacity-35";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                style={containerStyle}
                className={`flex items-center gap-3 px-4 py-3 rounded border transition-all duration-150 ${containerClass}`}
              >
                {isAnswered && opt === verse.correctWord ? (
                  <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${P}25`, color: P }}>
                    {OPTION_LABELS[idx]}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${labelClass}`}>
                    {OPTION_LABELS[idx]}
                  </span>
                )}
                <span
                  className={`flex-1 text-right text-lg leading-snug ${wordClass}`}
                  style={{ fontFamily: "var(--font-arabic)", direction: "rtl", color: isAnswered && opt === verse.correctWord ? P : undefined }}
                >
                  {opt}
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* ── Feedback + Sonraki ── */}
        {isAnswered && (
          <div
            className="rounded border px-5 py-4 flex items-center justify-between gap-4"
            style={
              gameState === "correct"
                ? { backgroundColor: `${P}12`, borderColor: `${P}40` }
                : { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
            }
          >
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={gameState === "correct" ? { backgroundColor: P } : { backgroundColor: "#f87171" }}
              >
                {gameState === "correct" ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-sm font-bold" style={gameState === "correct" ? { color: P } : { color: "#dc2626" }}>
                  {gameState === "correct" ? t.fillBlankGame.correct : t.fillBlankGame.wrong}
                </p>
                {gameState === "wrong" && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {t.fillBlankGame.correctAnswer}{" "}
                    <span style={{ fontFamily: "var(--font-arabic)" }}>{verse.correctWord}</span>
                  </p>
                )}
                {gameState === "correct" && streak >= 2 && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: P }}>
                    {t.fillBlankGame.streak.replace("{count}", String(streak))}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C10 5.5 6.5 7 6.5 12a5.5 5.5 0 0011 0C17.5 7 14 5.5 12 2zm0 14a3 3 0 01-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5a3 3 0 01-3 3z"/>
                    </svg>
                  </p>
                )}
              </div>
            </div>
            <button
              ref={nextBtnRef}
              onClick={nextRound}
              className="shrink-0 px-5 py-2.5 rounded text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: gameState === "correct" ? P : "var(--color-accent)" }}
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

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameTitle={t.gamesHub.fillBlankTitle}
        onStart={(ids, vf) => { setSurahIds(ids); setVerseFilter(vf); setScreen("game"); }}
      />
    );
  }
  return <GameScreen surahIds={surahIds} verseFilter={verseFilter} onSetup={() => setScreen("setup")} />;
}
