/**
 * Meclis oyun çalıştırıcısı — gameId'e göre sub-component render eder,
 * server'dan gelen roundStartedAt ile timer'ı senkronize eder, skor
 * güncellemelerini periyodik olarak push'lar, süre dolunca / Bitir
 * butonuyla finishMeclisRound çağırır.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  finishMeclisRound,
  updateMeclisCurrentScore,
} from "~/lib/meclis-service";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  type Difficulty,
} from "~/lib/game-scoring";
import { MeclisFillBlank } from "./MeclisFillBlank";
import { MeclisSurahGuess } from "./MeclisSurahGuess";
import { MeclisWordMeaning } from "./MeclisWordMeaning";
import { MeclisWordMatch } from "./MeclisWordMatch";
import { MeclisPeygamberKim } from "./MeclisPeygamberKim";
import { MeclisKariTahmini } from "./MeclisKariTahmini";
import { MeclisArapcaSecim } from "./MeclisArapcaSecim";

interface Props {
  code: string;
  gameId: string;
  difficulty: Difficulty;
  roundStartedAt: number;
  roundDurationMs: number;
  surahIds: number[];
}

export interface MeclisGameState {
  difficulty: Difficulty;
  /** answerTimeMs ne kadar düşükse time bonus o kadar yüksek. multiplier
   *  alt-oyunun ek puan ölçeği (1.0 default — peygamber gibi ipucu sayısına göre düşer). */
  scoreCorrect: (answerTimeMs: number, multiplier?: number) => void;
  scoreWrong: () => void;
  finished: boolean;
  surahIds: number[];
}

export function MeclisGamePlay({ code, gameId, difficulty, roundStartedAt, roundDurationMs, surahIds }: Props) {
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(roundStartedAt);
  const finishedRef = useRef(false);

  // Reset on round change
  useEffect(() => {
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setStreak(0);
    setFinished(false);
    finishedRef.current = false;
    startedAtRef.current = roundStartedAt;
  }, [roundStartedAt, gameId]);

  // Synced timer
  const [remainingMs, setRemainingMs] = useState(roundDurationMs);
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAtRef.current;
      const rem = Math.max(0, roundDurationMs - elapsed);
      setRemainingMs(rem);
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [roundDurationMs, roundStartedAt]);

  const finishMutation = useMutation({
    mutationFn: (payload: { score: number; correct: number; wrong: number; durationMs: number }) =>
      finishMeclisRound({ data: { code, ...payload } }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { score: number; correct: number; wrong: number }) =>
      updateMeclisCurrentScore({ data: { code, ...payload } }),
  });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    const durationMs = Date.now() - startedAtRef.current;
    finishMutation.mutate({ score, correct, wrong, durationMs });
  }, [score, correct, wrong, finishMutation]);

  // Auto-finish when timer expires
  useEffect(() => {
    if (remainingMs <= 0 && !finishedRef.current) finish();
  }, [remainingMs, finish]);

  // Push live score every 3s
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      updateMutation.mutate({ score, correct, wrong });
    }, 3000);
    return () => clearInterval(id);
  }, [score, correct, wrong, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreCorrect = useCallback(
    (answerTimeMs: number, multiplier: number = 1) => {
      if (finishedRef.current) return;
      const newStreak = streak + 1;
      const basePts = calcCorrectPoints(difficulty, answerTimeMs, newStreak);
      const pts = Math.max(1, Math.round(basePts * multiplier));
      setScore((s) => s + pts);
      setStreak(newStreak);
      setCorrect((c) => c + 1);
    },
    [difficulty, streak],
  );

  const scoreWrong = useCallback(() => {
    if (finishedRef.current) return;
    const penalty = calcWrongPenalty(difficulty);
    setScore((s) => Math.max(0, s - penalty));
    setStreak(0);
    setWrong((w) => w + 1);
  }, [difficulty]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  const urgent = remainingMs < roundDurationMs * 0.25;

  if (finished) {
    return (
      <div className="px-5 py-12 rounded-2xl border bg-[var(--color-surface)] text-center">
        <div className="text-3xl font-bold mb-2 text-[var(--mu-accent)] tabular-nums">{score}</div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Senin elin tamam</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Diğerleri bitirince devam ediyoruz.</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-3">
          {correct} doğru · {wrong} yanlış
        </p>
      </div>
    );
  }

  const gameProps = { difficulty, scoreCorrect, scoreWrong, finished, surahIds };

  return (
    <div>
      {/* Synced bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-bold tabular-nums ${urgent ? "text-red-500" : "text-[var(--mu-accent)]"}`}>
          {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${Math.max(0, (remainingMs / roundDurationMs) * 100)}%`,
              backgroundColor: urgent ? "#ef4444" : "var(--mu-accent)",
            }}
          />
        </div>
        <span className="text-xs font-bold tabular-nums">{score}</span>
        <button
          onClick={() => {
            if (confirm("Eli burada bitirmek istiyor musun?")) finish();
          }}
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--mu-accent)]/15 text-[var(--mu-accent)]"
        >
          Bitir
        </button>
      </div>

      {gameId === "fill-blank" && <MeclisFillBlank {...gameProps} />}
      {gameId === "surah-guess" && <MeclisSurahGuess {...gameProps} />}
      {gameId === "word-meaning" && <MeclisWordMeaning {...gameProps} />}
      {gameId === "word-match" && <MeclisWordMatch {...gameProps} />}
      {gameId === "peygamber-kim" && <MeclisPeygamberKim {...gameProps} />}
      {gameId === "kari-tahmini" && <MeclisKariTahmini {...gameProps} />}
      {gameId === "arapca-secim" && <MeclisArapcaSecim {...gameProps} />}
    </div>
  );
}
