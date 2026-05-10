/**
 * Unified game scoring & timer system.
 *
 * Scoring:
 * - Base points per correct answer: 10
 * - Time bonus: up to +5 (decays linearly over 10 seconds)
 * - Streak bonus: +2 per consecutive correct (max +10 at 5+ streak)
 * - Difficulty multiplier: Easy 1x, Medium 1.75x, Hard 3x, Hafiz 5x
 * - Wrong answer penalty: -5 (also scaled by difficulty)
 *
 * Timer:
 * - Real-time countdown (1:1, no speed tricks)
 * - Starting time varies by difficulty
 * - Fast correct answers earn bonus seconds
 * - Wrong answers cost seconds
 * - Max cap of 1:00 prevents infinite play
 *
 * Question difficulty: option count scales with difficulty.
 * Easy 3, Medium 4, Hard 5, Hafiz 6.
 */

export const TOTAL_ROUNDS = 10;

export type Difficulty = "easy" | "medium" | "hard" | "hafiz";

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.75,
  hard: 3,
  hafiz: 5,
};

/** Starting time per difficulty (ms). */
export const STARTING_TIME_MS: Record<Difficulty, number> = {
  easy: 60_000,   // 1:00
  medium: 50_000, // 0:50
  hard: 40_000,   // 0:40
  hafiz: 30_000,  // 0:30
};

/** Absolute max time cap (ms) -- prevents infinite accumulation. */
export const MAX_TIME_MS = 60_000; // 1:00

/** Time penalty for wrong answer (ms). */
export const WRONG_TIME_PENALTY_MS = 5_000; // -5s

/** Number of answer options per difficulty. */
export const OPTION_COUNT: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
  hafiz: 6,
};

// ── Point scoring ───────────────────────────────────────

const BASE_POINTS = 10;
const MAX_TIME_BONUS = 5;
const TIME_BONUS_WINDOW_MS = 10_000;
const WRONG_PENALTY = 5;
const STREAK_BONUS_PER = 2;
const MAX_STREAK_BONUS = 10;

/** Points earned for a correct answer. */
export function calcCorrectPoints(
  difficulty: Difficulty,
  answerTimeMs: number,
  streak: number,
): number {
  const timeFraction = Math.min(answerTimeMs, TIME_BONUS_WINDOW_MS) / TIME_BONUS_WINDOW_MS;
  const timeBonus = Math.max(0, Math.round(MAX_TIME_BONUS * (1 - timeFraction)));
  const streakBonus = Math.min(Math.max(0, streak - 1) * STREAK_BONUS_PER, MAX_STREAK_BONUS);
  return Math.round((BASE_POINTS + timeBonus + streakBonus) * DIFFICULTY_MULTIPLIER[difficulty]);
}

/** Points deducted for a wrong answer (always positive, caller should subtract). */
export function calcWrongPenalty(difficulty: Difficulty): number {
  return Math.round(WRONG_PENALTY * DIFFICULTY_MULTIPLIER[difficulty]);
}

// ── Time bonus ──────────────────────────────────────────

/**
 * Bonus seconds (in ms) earned for a fast correct answer.
 *   <= 3s  → +4s
 *   <= 5s  → +2s
 *   <= 8s  → +1s
 *   > 8s   → +0s
 */
export function calcTimeBonusMs(answerTimeMs: number): number {
  if (answerTimeMs <= 3_000) return 4_000;
  if (answerTimeMs <= 5_000) return 2_000;
  if (answerTimeMs <= 8_000) return 1_000;
  return 0;
}

/** Format points change for display, e.g. "+150" or "-50". */
export function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : String(delta);
}

/** Format time bonus for display, e.g. "+4s". */
export function formatTimeDelta(ms: number): string {
  const s = Math.round(ms / 1000);
  return s >= 0 ? `+${s}s` : `${s}s`;
}

/** Difficulty display labels (Turkish). */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
  hafiz: "Hafiz",
};
