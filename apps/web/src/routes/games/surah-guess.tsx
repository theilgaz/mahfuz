/**
 * Sure Tanıma — ayet metni görünce sureyi tahmin et.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVerseGuessQuestion } from "~/lib/game-service";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";

// ── Route ────────────────────────────────────────────────

export const Route = createFileRoute("/games/surah-guess")({
  component: SurahGuessGame,
});

type GameState = "playing" | "correct" | "wrong";
type Screen = "setup" | "game";

function GameScreen({ surahIds, onSetup }: { surahIds: number[]; onSetup: () => void }) {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const submittedScore = useRef(0);
  const sessionStart = useRef(Date.now());
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: question, isLoading } = useQuery({
    queryKey: ["surah-guess", refreshKey, surahIds],
    queryFn: () => getVerseGuessQuestion({ data: { surahIds } }),
    staleTime: 0,
  });

  const handleSelect = useCallback((surahId: number) => {
    if (gameState !== "playing" || !question) return;
    setSelectedId(surahId);
    if (surahId === question.correctSurahId) {
      setScore((s) => s + 10);
      setGameState("correct");
    } else {
      setGameState("wrong");
    }
  }, [gameState, question]);

  const nextRound = () => {
    setGameState("playing");
    setSelectedId(null);
    setRound((r) => r + 1);
    setRefreshKey((k) => k + 1);
  };

  // Doğru cevapta 3s sonra otomatik ilerle
  useEffect(() => {
    if (gameState !== "correct") return;
    const t = setTimeout(nextRound, 3000);
    return () => clearTimeout(t);
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !question) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)] text-sm">Ayet yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (score > submittedScore.current) {
              submittedScore.current = score;
              submitScore({ data: { gameId: "surah-guess", score, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
            }
            onSetup();
          }}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title="Sure seçimini değiştir"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">Sure Tanıma</p>
          <p className="text-sm font-bold text-[var(--color-accent)]">Soru {round}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-secondary)]">Puan</p>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{score}</p>
        </div>
      </div>

      {/* Soru */}
      <div className="px-5 py-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-6">
        <p className="text-xs text-[var(--color-text-secondary)] mb-3 text-center">
          Bu ayet hangi sureye ait?
        </p>
        <p
          className="text-xl text-right leading-loose text-[var(--color-text-primary)]"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {question.verseText}
        </p>
      </div>

      {/* Seçenekler */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {question.options.map((opt) => {
          let cls = "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]";
          if (gameState !== "playing") {
            if (opt.id === question.correctSurahId) cls = "border-green-500 bg-green-50 text-green-700";
            else if (opt.id === selectedId) cls = "border-red-400 bg-red-50 text-red-600";
            else cls = "border-[var(--color-border)]/50 opacity-40 text-[var(--color-text-secondary)]";
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={gameState !== "playing"}
              className={`px-4 py-3.5 rounded-xl border transition-all text-left ${cls}`}
            >
              <p className="text-sm font-medium">{opt.name}</p>
              <p
                className="text-base"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {opt.arabic}
              </p>
            </button>
          );
        })}
      </div>

      {gameState === "correct" && (
        <div className="px-4 py-3 rounded-xl text-center bg-green-50 border border-green-100">
          <p className="text-sm font-semibold text-green-700">✓ Doğru! +10 puan</p>
          <p className="text-xs text-green-600 mt-1">Sonraki soru geliyor…</p>
        </div>
      )}

      {gameState === "wrong" && (
        <>
          <div className="px-4 py-3 rounded-xl text-center bg-red-50 border border-red-100 mb-3">
            <p className="text-sm font-semibold text-red-600">
              ✗ Yanlış. Bu ayet &ldquo;{question.correctSurahName}&rdquo; suresinden
            </p>
          </div>
          <button
            onClick={nextRound}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm"
          >
            Sonraki Soru →
          </button>
        </>
      )}
    </div>
  );
}

function SurahGuessGame() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);

  const handleStart = (ids: number[]) => {
    setSurahIds(ids);
    setScreen("game");
  };

  if (screen === "setup") {
    return <SurahPickerScreen gameTitle="Sure Tanıma" onStart={handleStart} />;
  }

  return <GameScreen surahIds={surahIds} onSetup={() => setScreen("setup")} />;
}
