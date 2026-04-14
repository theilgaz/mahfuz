/**
 * Unified game scoring system.
 *
 * All games use the same formula so scores are comparable:
 * - Base points per correct answer: 100
 * - Time bonus: up to +50 (decays linearly over 10 seconds)
 * - Streak bonus: +10 per consecutive correct (max +50 at 5+ streak)
 * - Difficulty multiplier: Easy 1x, Medium 1.5x, Hard 2x
 * - Wrong answer penalty: -50 (also scaled by difficulty)
 */

export const TOTAL_ROUNDS = 10;

export type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

const BASE_POINTS = 100;
const MAX_TIME_BONUS = 50;
const TIME_BONUS_WINDOW_MS = 10_000;
const WRONG_PENALTY = 50;
const STREAK_BONUS_PER = 10;
const MAX_STREAK_BONUS = 50;

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

/** Format points change for display, e.g. "+150" or "-50". */
export function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : String(delta);
}

/** Difficulty display labels (Turkish). */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};
