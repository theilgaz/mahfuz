import { useState, useEffect, useRef, useCallback } from "react";
import { STARTING_TIME_MS, MAX_TIME_MS } from "~/lib/game-scoring";
import type { Difficulty } from "~/lib/game-scoring";

interface GameTimerReturn {
  /** Remaining time in ms. */
  remainingMs: number;
  /** True when timer has reached zero. */
  isExpired: boolean;
  /** Formatted as "M:SS". */
  display: string;
  /** Progress from 1 (full) to 0 (expired), relative to starting time. */
  progress: number;
  /** Start / resume the countdown. */
  start: () => void;
  /** Pause the countdown. */
  pause: () => void;
  /** Reset to initial state (paused, full time). */
  reset: () => void;
  /** Add bonus time (capped at MAX_TIME_MS). */
  addTime: (ms: number) => void;
  /** Subtract penalty time. */
  penalizeTime: (ms: number) => void;
}

/**
 * Real-time game countdown timer.
 *
 * Starting time varies by difficulty:
 * - Easy:   1:30  (90s)
 * - Medium: 1:15  (75s)
 * - Hard:   1:00  (60s)
 * - Hafiz:  0:45  (45s)
 *
 * Fast correct answers earn bonus seconds via addTime().
 * Wrong answers cost seconds via penalizeTime().
 * Max cap at 2:00 prevents infinite accumulation.
 */
export function useGameTimer(difficulty: Difficulty): GameTimerReturn {
  const startingMs = STARTING_TIME_MS[difficulty];
  const [remainingMs, setRemainingMs] = useState(startingMs);
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef(0);
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastTickRef.current;
    lastTickRef.current = now;

    setRemainingMs((prev) => {
      const next = prev - elapsed;
      return next <= 0 ? 0 : next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running && remainingMs > 0) {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [running, remainingMs > 0, tick]);

  const isExpired = remainingMs <= 0;

  useEffect(() => {
    if (isExpired && running) {
      setRunning(false);
    }
  }, [isExpired, running]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${minutes}:${String(seconds).padStart(2, "0")}`;
  const progress = Math.min(1, remainingMs / startingMs);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemainingMs(startingMs);
  }, [startingMs]);

  const addTime = useCallback((ms: number) => {
    setRemainingMs((prev) => Math.min(prev + ms, MAX_TIME_MS));
  }, []);

  const penalizeTime = useCallback((ms: number) => {
    setRemainingMs((prev) => Math.max(prev - ms, 0));
  }, []);

  return { remainingMs, isExpired, display, progress, start, pause, reset, addTime, penalizeTime };
}
