/**
 * Achievement service -- check & grant achievements.
 * Server-only module. Do NOT import from client code.
 */

import { db, gameScores, userAchievements } from "~/db";
import { eq, sql, and, gte } from "drizzle-orm";
import {
  checkNewAchievements,
  type AchievementContext,
  type AchievementDef,
} from "./game-achievements";

// ── Check & grant achievements (called from submitScore) ──

export interface CheckAchievementsInput {
  currentGameId: string;
  currentScore: number;
  currentCorrect: number;
  currentWrong: number;
  currentBestStreak: number;
  currentDurationMs: number;
  isNewHighScore: boolean;
}

export async function checkAndGrantAchievements(
  userId: string,
  input: CheckAchievementsInput,
): Promise<string[]> {
  // 1. Load already-unlocked achievement IDs
  const existing = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const alreadyUnlocked = new Set(existing.map((r) => r.achievementId));

  // 2. Aggregate stats from game_scores
  const statsRows = await db
    .select({
      gameId: gameScores.gameId,
      bestScore: sql<number>`MAX(${gameScores.score})`.as("best_score"),
      totalPlays: sql<number>`COUNT(*)`.as("total_plays"),
    })
    .from(gameScores)
    .where(eq(gameScores.userId, userId))
    .groupBy(gameScores.gameId);

  const gamePlayCounts: Record<string, number> = {};
  const gameBestScores: Record<string, number> = {};
  let totalBestScore = 0;
  let totalPlayCount = 0;

  for (const row of statsRows) {
    gamePlayCounts[row.gameId] = row.totalPlays;
    gameBestScores[row.gameId] = row.bestScore;
    totalBestScore += row.bestScore;
    totalPlayCount += row.totalPlays;
  }

  // Flawless games: check metadata for any game with 0 wrong and 5+ correct
  // Since metadata isn't stored yet, derive from current session + already-unlocked
  const flawlessGameIds = new Set<string>();
  // Check already-unlocked flawless achievements
  for (const a of existing) {
    const match = a.achievementId.match(/^(.+)-flawless$/);
    if (match) flawlessGameIds.add(match[1]);
  }
  // Check current session
  if (input.currentWrong === 0 && input.currentCorrect >= 5) {
    flawlessGameIds.add(input.currentGameId);
  }

  // 3. Games played today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRows = await db
    .select({ gameId: gameScores.gameId })
    .from(gameScores)
    .where(
      and(
        eq(gameScores.userId, userId),
        gte(gameScores.createdAt, todayStart.getTime()),
      ),
    )
    .groupBy(gameScores.gameId);
  const gamesPlayedToday = todayRows.map((r) => r.gameId);

  // 4. Build context
  const ctx: AchievementContext = {
    currentGameId: input.currentGameId,
    currentScore: input.currentScore,
    currentCorrect: input.currentCorrect,
    currentWrong: input.currentWrong,
    currentBestStreak: input.currentBestStreak,
    currentDurationMs: input.currentDurationMs,
    isNewHighScore: input.isNewHighScore,
    gamePlayCounts,
    gameBestScores,
    totalBestScore,
    distinctGamesPlayed: statsRows.length,
    gamesPlayedToday,
    flawlessGameIds,
    totalPlayCount,
  };

  // 5. Check which achievements are newly earned
  const newlyEarned: AchievementDef[] = checkNewAchievements(ctx, alreadyUnlocked);
  if (newlyEarned.length === 0) return [];

  // 6. Insert new user_achievements rows
  const now = Date.now();
  await db.insert(userAchievements).values(
    newlyEarned.map((def) => ({
      id: crypto.randomUUID(),
      userId,
      achievementId: def.id,
      unlockedAt: now,
      context: JSON.stringify({
        gameId: input.currentGameId,
        score: input.currentScore,
      }),
    })),
  );

  return newlyEarned.map((d) => d.id);
}
