import { useState, useEffect, useRef, useCallback } from "react";
import { GAME_DURATION_MS, DIFFICULTY_MULTIPLIER } from "~/lib/game-scoring";
import type { Difficulty } from "~/lib/game-scoring";

interface GameTimerReturn {
  /** Remaining time in ms (visual, always counts from GAME_DURATION_MS). */
  remainingMs: number;
  /** True when timer has reached zero. */
  isExpired: boolean;
  /** Formatted as "M:SS". */
  display: string;
  /** Progress from 1 (full) to 0 (expired). */
  progress: number;
  /** Start the countdown. */
  start: () => void;
  /** Pause the countdown. */
  pause: () => void;
  /** Reset to initial state. */
  reset: () => void;
}

/**
 * Game countdown timer that drains at difficulty-based speed.
 * Visual display always starts at 2:00 but ticks faster for harder difficulties.
 *
 * Effective play time:
 * - Easy (1x):   120s
 * - Medium (1.5x): 80s
 * - Hard (2x):    60s
 * - Hafiz (3x):   40s
 */
export function useGameTimer(difficulty: Difficulty): GameTimerReturn {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty];
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef(0);
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastTickRef.current;
    lastTickRef.current = now;

    setRemainingMs((prev) => {
      const next = prev - elapsed * multiplier;
      return next <= 0 ? 0 : next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [multiplier]);

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
  const progress = remainingMs / GAME_DURATION_MS;

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemainingMs(GAME_DURATION_MS);
  }, []);

  return { remainingMs, isExpired, display, progress, start, pause, reset };
}
