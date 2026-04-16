/**
 * Oyun skor servisi — kaydet, sorgula, liderlik tablosu.
 * Sadece oturum açık kullanıcıların skorları kaydedilir.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db, gameScores, userAchievements } from "~/db";
import { user } from "~/db";
import { auth } from "~/lib/auth";
import { eq, sql, desc, and } from "drizzle-orm";
import { checkAndGrantAchievements } from "./achievement-service";

// ── Oyun isimleri (UI için) ────────────────────────────────

export const GAME_TITLES: Record<string, string> = {
  "fill-blank": "Kelime Doldurma",
  "surah-guess": "Sure Tanıma",
  "word-meaning": "Kelime Anlamı",
  "verse-chain": "Ayet Zinciri",
  "hexagon": "Kelime Dizme",
  "kelime-tahmini": "Kelime Tahmini",
  "ayet-2048": "Ayet 2048",
};

export const GAME_IDS = Object.keys(GAME_TITLES);

// ── Skor Kaydet ────────────────────────────────────────────

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((input: {
    gameId: string;
    score: number;
    durationMs?: number;
    difficulty?: string;
    correctCount?: number;
    wrongCount?: number;
    bestStreak?: number;
  }) => input)
  .handler(async ({ data }) => {
    if (data.score <= 0) return { saved: false, isNewHighScore: false, newAchievements: [] as string[] };

    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return { saved: false, isNewHighScore: false, newAchievements: [] as string[] };

    const userId = session.user.id;

    // Mevcut kisisel rekoru kontrol et
    const [existing] = await db
      .select({ best: sql<number>`MAX(${gameScores.score})` })
      .from(gameScores)
      .where(and(eq(gameScores.userId, userId), eq(gameScores.gameId, data.gameId)));

    const currentBest = existing?.best ?? 0;
    const isNewHighScore = data.score > currentBest;

    await db.insert(gameScores).values({
      id: crypto.randomUUID(),
      userId,
      gameId: data.gameId,
      score: data.score,
      mode: data.difficulty ?? null,
      durationMs: data.durationMs ?? null,
      metadata: "{}",
      createdAt: Date.now(),
    });

    // Check achievements
    let newAchievements: string[] = [];
    try {
      newAchievements = await checkAndGrantAchievements(userId, {
        currentGameId: data.gameId,
        currentScore: data.score,
        currentCorrect: data.correctCount ?? 0,
        currentWrong: data.wrongCount ?? 0,
        currentBestStreak: data.bestStreak ?? 0,
        currentDurationMs: data.durationMs ?? 0,
        isNewHighScore,
      });
    } catch {
      // Don't fail score submission if achievements fail
    }

    return { saved: true, isNewHighScore, newAchievements };
  });

// ── Oyun Liderlik Tablosu ──────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  bestScore: number;
}

export const getGameLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { gameId: string }) => input)
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    const rows = await db
      .select({
        userId: gameScores.userId,
        bestScore: sql<number>`MAX(${gameScores.score})`.as("best_score"),
        userName: user.name,
        userImage: user.image,
      })
      .from(gameScores)
      .innerJoin(user, eq(gameScores.userId, user.id))
      .where(eq(gameScores.gameId, data.gameId))
      .groupBy(gameScores.userId)
      .orderBy(desc(sql`MAX(${gameScores.score})`))
      .limit(10);

    return rows.map((r, i) => ({ ...r, rank: i + 1, userImage: r.userImage ?? null }));
  });

// ── Global Liderlik (toplam skor) ──────────────────────────

export const getGlobalLeaderboard = createServerFn({ method: "GET" })
  .handler(async (): Promise<LeaderboardEntry[]> => {
    // Her kullanıcının her oyundaki en iyisi → toplam
    const rows = await db.all(sql`
      SELECT
        sub.user_id  AS userId,
        u.name       AS userName,
        u.image      AS userImage,
        SUM(sub.best) AS bestScore
      FROM (
        SELECT user_id, game_id, MAX(score) AS best
        FROM game_scores
        GROUP BY user_id, game_id
      ) sub
      JOIN user u ON sub.user_id = u.id
      GROUP BY sub.user_id
      ORDER BY bestScore DESC
      LIMIT 50
    `) as { userId: string; userName: string; userImage: string | null; bestScore: number }[];

    return rows.map((r, i) => ({ ...r, rank: i + 1, userImage: r.userImage ?? null }));
  });

// ── Kişisel İstatistikler ──────────────────────────────────

export interface MyGameStat {
  gameId: string;
  bestScore: number;
  totalPlays: number;
}

export const getMyScoreStats = createServerFn({ method: "GET" })
  .handler(async (): Promise<MyGameStat[]> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return [];

    const rows = await db
      .select({
        gameId: gameScores.gameId,
        bestScore: sql<number>`MAX(${gameScores.score})`.as("best_score"),
        totalPlays: sql<number>`COUNT(*)`.as("total_plays"),
      })
      .from(gameScores)
      .where(eq(gameScores.userId, session.user.id))
      .groupBy(gameScores.gameId)
      .orderBy(desc(sql`MAX(${gameScores.score})`));

    return rows;
  });

// ── Kullanıcı Basarimlari ─────────────────────────────────

export const getUserAchievements = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ achievementId: string; unlockedAt: number }[]> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return [];

    const rows = await db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, session.user.id));

    return rows;
  });
