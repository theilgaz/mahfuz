/**
 * Kelime Doldurma — ayetteki eksik kelimeyi bul (4 seçenek).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomVerseForGame } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";

// ── Route ────────────────────────────────────────────────

export const Route = createFileRoute("/games/fill-blank")({
  component: FillBlankGame,
});

type GameState = "playing" | "correct" | "wrong" | "loading";
type Screen = "setup" | "game";

// ── Oyun Ekranı ──────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

function GameScreen({ surahIds, onSetup }: { surahIds: number[]; onSetup: () => void }) {
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

  if (isLoading || !verse) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)] text-sm">Ayet yükleniyor…</p>
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
          title="Sure seçimini değiştir"
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
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              🔥 {streak}
            </span>
          )}
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{score}</span>
        </div>
      </div>

      {/* ── Sure etiketi ── */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 rounded-full">
          {verse.surahName} · {verse.verseNum}. Ayet
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
            <span className={`text-2xl ${gameState === "correct" ? "" : ""}`}>
              {gameState === "correct" ? "✓" : "✗"}
            </span>
            <div>
              <p className={`text-sm font-bold ${gameState === "correct" ? "text-emerald-700" : "text-red-600"}`}>
                {gameState === "correct" ? "Doğru!" : "Yanlış"}
              </p>
              {gameState === "wrong" && (
                <p className="text-xs text-red-500 mt-0.5">
                  Doğru cevap:{" "}
                  <span style={{ fontFamily: "var(--font-arabic)" }}>{verse.correctWord}</span>
                </p>
              )}
              {gameState === "correct" && streak >= 2 && (
                <p className="text-xs text-emerald-600 mt-0.5">{streak} doğru üst üste 🔥</p>
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
            Devam →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Ana Bileşen ──────────────────────────────────────────

function FillBlankGame() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);

  const handleStart = (ids: number[]) => {
    setSurahIds(ids);
    setScreen("game");
  };

  if (screen === "setup") {
    return <SurahPickerScreen gameTitle="Kelime Doldurma" onStart={handleStart} />;
  }

  return <GameScreen surahIds={surahIds} onSetup={() => setScreen("setup")} />;
}
