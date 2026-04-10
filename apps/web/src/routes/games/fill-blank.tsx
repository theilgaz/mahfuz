/**
 * Kelime Doldurma — ayetteki eksik kelimeyi bul (4 seçenek).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomVerseForGame } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { useTranslation } from "~/hooks/useTranslation";

// ── Route ────────────────────────────────────────────────

export const Route = createFileRoute("/games/fill-blank")({
  component: FillBlankGame,
});

type GameState = "playing" | "correct" | "wrong" | "loading";
type Screen = "setup" | "game";

// ── Oyun Ekranı ──────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

function GameScreen({ surahIds, onSetup }: { surahIds: number[]; onSetup: () => void }) {
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
    queryKey: ["fill-blank-verse", refreshKey, surahIds],
    queryFn: () => getRandomVerseForGame({ data: { surahIds } }),
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && verse) setGameState("playing");
  }, [isLoading, verse]);

  // Auto-focus next button after answering for keyboard navigation
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

  // Keyboard: A/B/C/D → select option, Enter/Space → next round
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

  if (isLoading || !verse) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)] text-sm">{t.fillBlankGame.loadingVerse}</p>
      </div>
    );
  }

  const isAnswered = gameState !== "playing";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-32">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => {
            if (score > submittedScore.current) {
              submittedScore.current = score;
              submitScore({ data: { gameId: "fill-blank", score, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
            }
            onSetup();
          }}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-secondary)]"
          title={t.fillBlankGame.changeSurah}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Progress pills */}
        <div className="flex-1 flex gap-1">
          {Array.from({ length: Math.min(round + 1, 10) }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full bg-[var(--color-accent)]"
            />
          ))}
          {Array.from({ length: Math.max(0, 10 - round - 1) }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-[var(--color-border)]" />
          ))}
        </div>

        {/* Score + streak */}
        <div className="flex items-center gap-2 shrink-0">
          {streak >= 2 && (
            <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C10 5.5 6.5 7 6.5 12a5.5 5.5 0 0011 0C17.5 7 14 5.5 12 2zm0 14a3 3 0 01-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5a3 3 0 01-3 3z"/>
              </svg>
              {streak}
            </span>
          )}
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{score}</span>
        </div>
      </div>

      {/* ── Sure etiketi ── */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 rounded-full">
          {t.fillBlankGame.verseLabel.replace("{surahName}", verse.surahName).replace("{verseNum}", String(verse.verseNum))}
        </span>
      </div>

      {/* ── Ayet kartı ── */}
      <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]/30" />
        <div
          className="px-6 py-6 text-right leading-[2.2] text-[1.35rem]"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {verse.words.map((w, i) => {
            if (i === verse.blankIndex) {
              return (
                <span
                  key={i}
                  className={`inline-block mx-1 px-3 py-0.5 rounded-lg border-2 min-w-[72px] text-center align-middle font-semibold transition-all ${
                    gameState === "correct"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : gameState === "wrong"
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-dashed border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 text-transparent"
                  }`}
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
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {verse.options.map((opt, idx) => {
          let stateClass = "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 active:scale-[0.98]";
          let icon: React.ReactNode = null;

          if (isAnswered) {
            if (opt === verse.correctWord) {
              stateClass = "border-emerald-400 bg-emerald-50";
              icon = (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              );
            } else if (opt === selectedOption) {
              stateClass = "border-red-400 bg-red-50";
              icon = (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              );
            } else {
              stateClass = "border-[var(--color-border)]/40 bg-[var(--color-surface)]/60 opacity-40";
            }
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              className={`relative flex flex-col items-center gap-1.5 px-3 py-4 rounded-2xl border-2 transition-all duration-150 ${stateClass}`}
            >
              {icon}
              <span className={`text-[10px] font-bold tracking-wider ${
                isAnswered && opt === verse.correctWord ? "text-emerald-600"
                : isAnswered && opt === selectedOption ? "text-red-500"
                : "text-[var(--color-text-secondary)]"
              }`}>
                {OPTION_LABELS[idx]}
              </span>
              <span
                className={`text-xl leading-snug ${
                  isAnswered && opt === verse.correctWord ? "text-emerald-700"
                  : isAnswered && opt === selectedOption ? "text-red-600"
                  : isAnswered ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-text-primary)]"
                }`}
                style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Feedback + Sonraki ── */}
      {isAnswered && (
        <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
          gameState === "correct"
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${gameState === "correct" ? "bg-emerald-500" : "bg-red-400"}`}>
              {gameState === "correct" ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
            <div>
              <p className={`text-sm font-bold ${gameState === "correct" ? "text-emerald-700" : "text-red-600"}`}>
                {gameState === "correct" ? t.fillBlankGame.correct : t.fillBlankGame.wrong}
              </p>
              {gameState === "wrong" && (
                <p className="text-xs text-red-500 mt-0.5">
                  {t.fillBlankGame.correctAnswer}{" "}
                  <span style={{ fontFamily: "var(--font-arabic)" }}>{verse.correctWord}</span>
                </p>
              )}
              {gameState === "correct" && streak >= 2 && (
                <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                  {t.fillBlankGame.streak.replace("{count}", String(streak))}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500" aria-hidden="true">
                    <path d="M12 2C10 5.5 6.5 7 6.5 12a5.5 5.5 0 0011 0C17.5 7 14 5.5 12 2zm0 14a3 3 0 01-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5a3 3 0 01-3 3z"/>
                  </svg>
                </p>
              )}
            </div>
          </div>
          <button
            ref={nextBtnRef}
            onClick={nextRound}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 ${
              gameState === "correct" ? "bg-emerald-500" : "bg-[var(--color-accent)]"
            }`}
          >
            {t.fillBlankGame.next}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Ana Bileşen ──────────────────────────────────────────

function FillBlankGame() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);

  const handleStart = (ids: number[]) => {
    setSurahIds(ids);
    setScreen("game");
  };

  if (screen === "setup") {
    return <SurahPickerScreen gameTitle={t.gamesHub.fillBlankTitle} onStart={handleStart} />;
  }

  return <GameScreen surahIds={surahIds} onSetup={() => setScreen("setup")} />;
}
