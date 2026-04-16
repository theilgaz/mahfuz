/**
 * Game achievement definitions.
 * All achievements are defined in code; only user unlocks are stored in DB.
 */

import { GAME_IDS } from "./score-service";

// ── Types ─────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  category: "game-score" | "game-plays" | "cross-game" | "streak" | "special" | "flawless";
  gameId?: string;
  /** 1=bronze, 2=silver, 3=gold */
  tier?: number;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  // Current session
  currentGameId: string;
  currentScore: number;
  currentCorrect: number;
  currentWrong: number;
  currentBestStreak: number;
  currentDurationMs: number;
  isNewHighScore: boolean;
  // Historical (aggregated from DB)
  gamePlayCounts: Record<string, number>;
  gameBestScores: Record<string, number>;
  totalBestScore: number;
  distinctGamesPlayed: number;
  gamesPlayedToday: string[];
  /** Game IDs where user has at least one flawless (0 wrong, 5+ correct) completion */
  flawlessGameIds: Set<string>;
  /** Total play count across all games */
  totalPlayCount: number;
}

// ── Tier thresholds ───────────────────────────────────────

const SCORE_TIERS = [
  { tier: 1, threshold: 100 },
  { tier: 2, threshold: 500 },
  { tier: 3, threshold: 1000 },
];

const PLAY_TIERS = [
  { tier: 1, threshold: 1 },
  { tier: 2, threshold: 10 },
  { tier: 3, threshold: 50 },
];

// ── Build definitions ─────────────────────────────────────

function buildDefinitions(): AchievementDef[] {
  const defs: AchievementDef[] = [];

  // A. Per-game score milestones (7 games x 3 tiers = 21)
  for (const gameId of GAME_IDS) {
    for (const { tier, threshold } of SCORE_TIERS) {
      defs.push({
        id: `${gameId}-score-${tier}`,
        category: "game-score",
        gameId,
        tier,
        check: (ctx) => ctx.gameBestScores[gameId] >= threshold,
      });
    }
  }

  // B. Per-game play count (7 games x 3 tiers = 21)
  for (const gameId of GAME_IDS) {
    for (const { tier, threshold } of PLAY_TIERS) {
      defs.push({
        id: `${gameId}-plays-${tier}`,
        category: "game-plays",
        gameId,
        tier,
        check: (ctx) => (ctx.gamePlayCounts[gameId] ?? 0) >= threshold,
      });
    }
  }

  // C. Cross-game achievements
  defs.push(
    {
      id: "explorer-3",
      category: "cross-game",
      check: (ctx) => ctx.distinctGamesPlayed >= 3,
    },
    {
      id: "explorer-all",
      category: "cross-game",
      check: (ctx) => ctx.distinctGamesPlayed >= GAME_IDS.length,
    },
    {
      id: "total-1000",
      category: "cross-game",
      tier: 1,
      check: (ctx) => ctx.totalBestScore >= 1000,
    },
    {
      id: "total-5000",
      category: "cross-game",
      tier: 2,
      check: (ctx) => ctx.totalBestScore >= 5000,
    },
    {
      id: "total-10000",
      category: "cross-game",
      tier: 3,
      check: (ctx) => ctx.totalBestScore >= 10000,
    },
    {
      id: "daily-3",
      category: "cross-game",
      check: (ctx) => ctx.gamesPlayedToday.length >= 3,
    },
  );

  // D. Streak / performance achievements
  defs.push(
    {
      id: "streak-5",
      category: "streak",
      tier: 1,
      check: (ctx) => ctx.currentBestStreak >= 5,
    },
    {
      id: "streak-10",
      category: "streak",
      tier: 2,
      check: (ctx) => ctx.currentBestStreak >= 10,
    },
    {
      id: "streak-20",
      category: "streak",
      tier: 3,
      check: (ctx) => ctx.currentBestStreak >= 20,
    },
    {
      id: "perfect-round",
      category: "streak",
      check: (ctx) =>
        ctx.currentWrong === 0 &&
        ctx.currentCorrect >= 5,
    },
    {
      id: "comeback",
      category: "streak",
      check: (ctx) => ctx.isNewHighScore && (ctx.gamePlayCounts[ctx.currentGameId] ?? 0) >= 3,
    },
  );

  // E. Per-game flawless (7 games)
  for (const gameId of GAME_IDS) {
    defs.push({
      id: `${gameId}-flawless`,
      category: "flawless",
      gameId,
      check: (ctx) => ctx.flawlessGameIds.has(gameId),
    });
  }

  // F. Cross-game flawless
  defs.push({
    id: "flawless-all",
    category: "cross-game",
    tier: 3,
    check: (ctx) => GAME_IDS.every((id) => ctx.flawlessGameIds.has(id)),
  });

  // G. Special / fun achievements
  defs.push(
    {
      id: "night-owl",
      category: "special",
      check: () => {
        const hour = new Date().getHours();
        return hour >= 0 && hour < 5;
      },
    },
    {
      id: "speed-demon",
      category: "special",
      check: (ctx) =>
        ctx.currentDurationMs > 0 &&
        ctx.currentDurationMs < 60_000 &&
        ctx.currentCorrect >= 5 &&
        ctx.currentWrong === 0,
    },
    {
      id: "centenarian",
      category: "special",
      check: (ctx) => ctx.totalPlayCount >= 100,
    },
    {
      id: "high-scorer",
      category: "special",
      check: (ctx) => ctx.currentScore >= 500 && ctx.currentWrong === 0,
    },
  );

  return defs;
}

export const ACHIEVEMENT_DEFS = buildDefinitions();

/** Map for quick lookup by ID */
export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENT_DEFS.map((d) => [d.id, d]));

/** Check which achievements are newly earned */
export function checkNewAchievements(
  ctx: AchievementContext,
  alreadyUnlocked: Set<string>,
): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter((def) => !alreadyUnlocked.has(def.id) && def.check(ctx));
}
