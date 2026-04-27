/**
 * Oyun skor servisi — kaydet, sorgula, liderlik tablosu.
 * Sadece oturum açık kullanıcıların skorları kaydedilir.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db, gameScores, userAchievements, seasonChampions, seasonParticipants, seasons } from "~/db";
import { user } from "~/db";
import { auth } from "~/lib/auth";
import { eq, sql, desc, and, gte, lt } from "drizzle-orm";
import { checkAndGrantAchievements } from "./achievement-service";
import { computeLeague, seasonKeyFor, seasonRange, type League } from "./league";
import { ensureSeasonsClosed } from "./season-service";

// ── Oyun isimleri (UI için) ────────────────────────────────

export const GAME_TITLES: Record<string, string> = {
  "fill-blank": "Ayet Tamamla",
  "surah-guess": "Sûre Bul",
  "word-meaning": "Kelime Hazinesi",
  "verse-chain": "Ayet Zinciri",
  "hexagon": "Hexagon Harf",
  "kelime-tahmini": "Kelime Tahmini",
  "ayet-2048": "Quranic 2048",
  "emoji-match": "Emoji Eşleştirme",
};

const GAME_TITLES_EN: Record<string, string> = {
  "fill-blank": "Complete the Verse",
  "surah-guess": "Find the Surah",
  "word-meaning": "Word Treasury",
  "verse-chain": "Verse Chain",
  "hexagon": "Hexagon Letters",
  "kelime-tahmini": "Word Guess",
  "ayet-2048": "Quranic 2048",
  "emoji-match": "Emoji Match",
};

/** Returns game title for the given locale. Falls back to Turkish. */
export function getGameTitle(gameId: string, locale: string = "tr"): string {
  if (locale === "tr") return GAME_TITLES[gameId] ?? gameId;
  return GAME_TITLES_EN[gameId] ?? GAME_TITLES[gameId] ?? gameId;
}

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
    const empty = {
      saved: false,
      isNewHighScore: false,
      newAchievements: [] as string[],
      leagueUp: null as null | { from: League; to: League },
    };
    if (data.score <= 0) return empty;

    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return empty;

    const userId = session.user.id;

    // Mevcut kisisel rekoru kontrol et
    const [existing] = await db
      .select({ best: sql<number>`MAX(${gameScores.score})` })
      .from(gameScores)
      .where(and(eq(gameScores.userId, userId), eq(gameScores.gameId, data.gameId)));

    const currentBest = existing?.best ?? 0;
    const isNewHighScore = data.score > currentBest;

    // Lig atlama tespiti — insert'ten ÖNCE ve SONRAKİ lifetime SUM'ı karşılaştır
    const [beforeRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(${gameScores.score}), 0)` })
      .from(gameScores)
      .where(eq(gameScores.userId, userId));
    const beforeTotal = beforeRow?.total ?? 0;
    const beforeLeague = computeLeague(beforeTotal);
    const afterLeague = computeLeague(beforeTotal + data.score);
    const leagueUp = beforeLeague !== afterLeague ? { from: beforeLeague, to: afterLeague } : null;

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

    return { saved: true, isNewHighScore, newAchievements, leagueUp };
  });

// ── Zaman Dilimleri ───────────────────────────────────────

/**
 * "all"     → tüm zamanlar (toplam emek, SUM)
 * "season"  → bu sezon (içinde bulunulan ay, MAX)
 * "week"    → son 7 gün (MAX)
 */
export type LeaderboardPeriod = "week" | "season" | "all";

export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = ["week", "season", "all"];

interface PeriodWindow {
  startedAt: number | null;
  endedAt: number | null;
  /** "all" sezonluk dışı tüm zamanlar = SUM, diğerleri = MAX */
  agg: "sum" | "max";
}

function periodWindow(period: LeaderboardPeriod, now: number = Date.now()): PeriodWindow {
  if (period === "all") return { startedAt: null, endedAt: null, agg: "sum" };
  if (period === "week") return { startedAt: now - 7 * 24 * 60 * 60 * 1000, endedAt: null, agg: "max" };
  // season — içinde bulunulan ay
  const range = seasonRange(seasonKeyFor(new Date(now)));
  return { startedAt: range.startedAt, endedAt: range.endedAt, agg: "max" };
}

// ── Oyun Liderlik Tablosu ──────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  /** Periyoda göre asıl sıralama puanı — all=SUM, week/season=MAX */
  bestScore: number;
  /** Periyot penceresindeki MAX skor (per-game tablolarda paralel kolon) */
  windowMax?: number;
  /** Periyot penceresindeki SUM skor (per-game tablolarda paralel kolon) */
  windowSum?: number;
  league: League;
}

export const getGameLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { gameId: string; period?: LeaderboardPeriod }) => input)
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    await ensureSeasonsClosed();
    const period = data.period ?? "all";
    const win = periodWindow(period);
    const conditions = [eq(gameScores.gameId, data.gameId)];
    if (win.startedAt != null) conditions.push(gte(gameScores.createdAt, win.startedAt));
    if (win.endedAt != null) conditions.push(lt(gameScores.createdAt, win.endedAt));

    // Hem MAX hem SUM'ı her zaman hesapla; sıralama agg'a göre seçilir
    const rows = await db
      .select({
        userId: gameScores.userId,
        windowMax: sql<number>`MAX(${gameScores.score})`.as("window_max"),
        windowSum: sql<number>`SUM(${gameScores.score})`.as("window_sum"),
        achievedAt: sql<number>`MIN(${gameScores.createdAt})`.as("achieved_at"),
        userName: user.name,
        userImage: user.image,
      })
      .from(gameScores)
      .innerJoin(user, eq(gameScores.userId, user.id))
      .where(and(...conditions))
      .groupBy(gameScores.userId)
      .orderBy(win.agg === "sum"
        ? sql`window_sum DESC, achieved_at ASC`
        : sql`window_max DESC, achieved_at ASC`)
      .limit(50);

    // Lig hesabı için kullanıcının lifetime SUM'ı (oyun ayrımı yok)
    const userIds = rows.map((r) => r.userId);
    const lifetime = userIds.length > 0
      ? await db
        .select({
          userId: gameScores.userId,
          total: sql<number>`SUM(${gameScores.score})`.as("total"),
        })
        .from(gameScores)
        .where(sql`${gameScores.userId} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`)
        .groupBy(gameScores.userId)
      : [];
    const lifetimeMap = new Map(lifetime.map((l) => [l.userId, l.total ?? 0]));

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      userName: r.userName,
      userImage: r.userImage ?? null,
      bestScore: win.agg === "sum" ? r.windowSum : r.windowMax,
      windowMax: r.windowMax,
      windowSum: r.windowSum,
      league: computeLeague(lifetimeMap.get(r.userId) ?? 0),
    }));
  });

// ── Global Liderlik ────────────────────────────────────────

export const getGlobalLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { period?: LeaderboardPeriod }) => input)
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    await ensureSeasonsClosed();
    const period = data.period ?? "all";
    const win = periodWindow(period);
    const conditions = [];
    if (win.startedAt != null) conditions.push(gte(gameScores.createdAt, win.startedAt));
    if (win.endedAt != null) conditions.push(lt(gameScores.createdAt, win.endedAt));

    if (win.agg === "sum") {
      // Tüm zamanlar — kullanıcının tüm oyunlardaki SUM'ı
      const rows = await db
        .select({
          userId: gameScores.userId,
          score: sql<number>`SUM(${gameScores.score})`.as("agg_score"),
          achievedAt: sql<number>`MIN(${gameScores.createdAt})`.as("achieved_at"),
          userName: user.name,
          userImage: user.image,
        })
        .from(gameScores)
        .innerJoin(user, eq(gameScores.userId, user.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(gameScores.userId)
        .orderBy(sql`agg_score DESC, achieved_at ASC`)
        .limit(50);

      return rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        userName: r.userName,
        userImage: r.userImage ?? null,
        bestScore: r.score,
        league: computeLeague(r.score),
      }));
    }

    // week/season — kullanıcının pencere içindeki MAX skoru (oyun ayrımı yok)
    const rows = await db
      .select({
        userId: gameScores.userId,
        score: sql<number>`MAX(${gameScores.score})`.as("agg_score"),
        achievedAt: sql<number>`MIN(${gameScores.createdAt})`.as("achieved_at"),
        userName: user.name,
        userImage: user.image,
      })
      .from(gameScores)
      .innerJoin(user, eq(gameScores.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(gameScores.userId)
      .orderBy(sql`agg_score DESC, achieved_at ASC`)
      .limit(50);

    // Lig hesabı: lifetime SUM'a göre (sezon liderinin kendi ligini de doğru göstermek için)
    const userIds = rows.map((r) => r.userId);
    const lifetime = userIds.length > 0
      ? await db
        .select({
          userId: gameScores.userId,
          total: sql<number>`SUM(${gameScores.score})`.as("total"),
        })
        .from(gameScores)
        .where(sql`${gameScores.userId} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`)
        .groupBy(gameScores.userId)
      : [];
    const lifetimeMap = new Map(lifetime.map((l) => [l.userId, l.total ?? 0]));

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      userName: r.userName,
      userImage: r.userImage ?? null,
      bestScore: r.score,
      league: computeLeague(lifetimeMap.get(r.userId) ?? 0),
    }));
  });

// ── Kişisel İstatistikler ──────────────────────────────────

export interface MyGameStat {
  gameId: string;
  bestScore: number;
  totalScore: number;
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
        totalScore: sql<number>`SUM(${gameScores.score})`.as("total_score"),
        totalPlays: sql<number>`COUNT(*)`.as("total_plays"),
      })
      .from(gameScores)
      .where(eq(gameScores.userId, session.user.id))
      .groupBy(gameScores.gameId)
      .orderBy(desc(sql`SUM(${gameScores.score})`));

    return rows;
  });

// ── Lig Durumu ─────────────────────────────────────────────

export interface MyLeagueStatus {
  totalScore: number;
  league: League;
}

export const getMyLeagueStatus = createServerFn({ method: "GET" })
  .handler(async (): Promise<MyLeagueStatus | null> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return null;

    const [row] = await db
      .select({ total: sql<number>`COALESCE(SUM(${gameScores.score}), 0)` })
      .from(gameScores)
      .where(eq(gameScores.userId, session.user.id));

    const totalScore = row?.total ?? 0;
    return { totalScore, league: computeLeague(totalScore) };
  });

// ── Kupa & Kokart ──────────────────────────────────────────

export interface ChampionTrophy {
  seasonKey: string;
  seasonName: string;
  scope: string;
  rank: number;
  league: League;
  score: number;
}

export interface ParticipationRosette {
  seasonKey: string;
  seasonName: string;
  rank: number;
  league: League;
  score: number;
}

export interface MyTrophies {
  champions: ChampionTrophy[];
  rosettes: ParticipationRosette[];
}

export const getMyTrophies = createServerFn({ method: "GET" })
  .handler(async (): Promise<MyTrophies> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return { champions: [], rosettes: [] };
    return getTrophiesForUser(session.user.id);
  });

export const getTrophiesByUserId = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data }): Promise<MyTrophies> => getTrophiesForUser(data.userId));

async function getTrophiesForUser(userId: string): Promise<MyTrophies> {
  await ensureSeasonsClosed();
  const champions = await db
    .select({
      seasonKey: seasonChampions.seasonKey,
      seasonName: seasons.name,
      scope: seasonChampions.scope,
      rank: seasonChampions.rank,
      league: seasonChampions.league,
      score: seasonChampions.score,
    })
    .from(seasonChampions)
    .innerJoin(seasons, eq(seasonChampions.seasonKey, seasons.key))
    .where(eq(seasonChampions.userId, userId))
    .orderBy(desc(seasons.startedAt));

  const rosettes = await db
    .select({
      seasonKey: seasonParticipants.seasonKey,
      seasonName: seasons.name,
      rank: seasonParticipants.rank,
      league: seasonParticipants.league,
      score: seasonParticipants.score,
    })
    .from(seasonParticipants)
    .innerJoin(seasons, eq(seasonParticipants.seasonKey, seasons.key))
    .where(eq(seasonParticipants.userId, userId))
    .orderBy(desc(seasons.startedAt));

  return {
    champions: champions.map((c) => ({ ...c, league: c.league as League })),
    rosettes: rosettes.map((r) => ({ ...r, league: r.league as League })),
  };
}

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
