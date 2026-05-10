/**
 * Sezon servisi — aylık sezonlar, lazy snapshot, kupa/kokart kayıtları.
 * Her ay tek bir `seasons` kaydı; ilk istek üzerine kapanmamış sezonları kapatır.
 *
 * Kurallar:
 *   - Sezonluk skor = MAX(score) (oyun başına ve global)
 *   - Tie-breaker = aynı MAX skora ilk ulaşan kullanıcı (en eski createdAt)
 *   - Top-3 = madalya (`seasonChampions`), top-10 = kokart (`seasonParticipants`, sadece global)
 *   - Lig = kullanıcının O ANDAKİ lig durumu (sezon kapanış anındaki lifetime SUM'a göre)
 */

import { db, gameScores, seasons, seasonChampions, seasonParticipants, userSettings } from "~/db";
import { and, eq, gte, lt, sql, inArray } from "drizzle-orm";
import {
  asLeague,
  computeLeague,
  demoteLeague,
  formatSeasonName,
  LEAGUE_ORDER,
  movementCount,
  promoteLeague,
  seasonKeyFor,
  seasonRange,
  type League,
} from "./league";

interface MaxScoreRow {
  userId: string;
  maxScore: number;
  achievedAt: number;
}

interface ChampionRow extends MaxScoreRow {
  rank: number;
  league: League;
}

/** O ANDAKİ aktif sezonu döndürür; yoksa oluşturur. */
export async function getOrCreateCurrentSeason(now: number = Date.now()) {
  const key = seasonKeyFor(new Date(now));
  const existing = await db.select().from(seasons).where(eq(seasons.key, key)).limit(1);
  if (existing.length > 0) return existing[0];

  const range = seasonRange(key);
  const name = formatSeasonName(key);
  await db
    .insert(seasons)
    .values({ key, name, startedAt: range.startedAt, endedAt: range.endedAt, closedAt: null })
    .onConflictDoNothing();
  const [row] = await db.select().from(seasons).where(eq(seasons.key, key)).limit(1);
  return row;
}

/**
 * Geçmişte kalmış (endedAt <= now) ve kapanmamış (closedAt IS NULL) sezonları snapshotlayıp kapatır.
 * Her liderlik tablosu okunduğunda çağrılır — fazla işten kaçınmak için kapanmamış kayıt yoksa hızlı çıkar.
 */
export async function ensureSeasonsClosed(now: number = Date.now()): Promise<void> {
  const stale = await db
    .select()
    .from(seasons)
    .where(and(lt(seasons.endedAt, now + 1), sql`${seasons.closedAt} IS NULL`));

  for (const season of stale) {
    await closeSeason(season.key, season.startedAt, season.endedAt);
  }
}

async function closeSeason(seasonKey: string, startedAt: number, endedAt: number): Promise<void> {
  // Idempotent — eğer zaten şampiyon kaydı varsa atla
  const exists = await db
    .select({ id: seasonChampions.id })
    .from(seasonChampions)
    .where(eq(seasonChampions.seasonKey, seasonKey))
    .limit(1);
  if (exists.length > 0) {
    await db.update(seasons).set({ closedAt: Date.now() }).where(eq(seasons.key, seasonKey));
    return;
  }

  // Per-game top-3: sezonda skor üretmiş her oyun için MAX skor + tie-breaker
  const playedGames = await db
    .selectDistinct({ gameId: gameScores.gameId })
    .from(gameScores)
    .where(and(gte(gameScores.createdAt, startedAt), lt(gameScores.createdAt, endedAt)));
  for (const { gameId } of playedGames) {
    const champions = await fetchTopByMax(gameId, startedAt, endedAt, 3);
    await insertChampions(seasonKey, gameId, champions);
  }

  // Global top-10: kullanıcının sezon içindeki MAX skoru (oyun ayrımı yok)
  const globalTop = await fetchTopByMax(null, startedAt, endedAt, 10);
  // İlk 3'ü şampiyon, 1-10 arası kokart (1-3 hem şampiyon hem kokart yerine sadece şampiyon)
  await insertChampions(seasonKey, "global", globalTop.slice(0, 3));
  await insertParticipants(seasonKey, globalTop.slice(3));

  // Lig hareketleri: her lig içinde en yüksek puanlılar terfi, en düşük puanlılar tenzil
  await applySeasonMovements(startedAt, endedAt);

  await db.update(seasons).set({ closedAt: Date.now() }).where(eq(seasons.key, seasonKey));
}

/**
 * Sezonda aktif olan oyuncuları kendi liglerine göre kümeler, MAX skorla sıralar
 * ve `movementCount` politikasına göre terfi/tenzil uygular.
 * Bronz tabanı altına düşmez, Hafız tavanı üstüne çıkmaz.
 */
async function applySeasonMovements(startedAt: number, endedAt: number): Promise<void> {
  // Sezon penceresinde skor üreten her kullanıcının MAX'ı
  const rows = await db
    .select({
      userId: gameScores.userId,
      maxScore: sql<number>`MAX(${gameScores.score})`.as("max_score"),
      achievedAt: sql<number>`MIN(${gameScores.createdAt})`.as("achieved_at"),
    })
    .from(gameScores)
    .where(and(gte(gameScores.createdAt, startedAt), lt(gameScores.createdAt, endedAt)))
    .groupBy(gameScores.userId);

  if (rows.length === 0) return;

  const activeIds = rows.map((r) => r.userId);

  // Mevcut lig durumlarını oku (yoksa lifetime SUM ile fallback)
  const settingsRows = await db
    .select({ userId: userSettings.userId, currentLeague: userSettings.currentLeague })
    .from(userSettings)
    .where(inArray(userSettings.userId, activeIds));
  const leagueByUser = new Map<string, League>(
    settingsRows.map((s) => [s.userId, asLeague(s.currentLeague, "bronz")]),
  );

  const lifetimeSums = await db
    .select({
      userId: gameScores.userId,
      total: sql<number>`SUM(${gameScores.score})`.as("total"),
    })
    .from(gameScores)
    .where(inArray(gameScores.userId, activeIds))
    .groupBy(gameScores.userId);
  const lifetimeMap = new Map(lifetimeSums.map((r) => [r.userId, r.total ?? 0]));

  // Lige göre kümele
  const buckets = new Map<League, Array<{ userId: string; maxScore: number; achievedAt: number }>>();
  for (const r of rows) {
    const league = leagueByUser.get(r.userId) ?? computeLeague(lifetimeMap.get(r.userId) ?? 0);
    const bucket = buckets.get(league) ?? [];
    bucket.push({ userId: r.userId, maxScore: r.maxScore, achievedAt: r.achievedAt });
    buckets.set(league, bucket);
  }

  const movements: Array<{ userId: string; nextLeague: League }> = [];
  for (const league of LEAGUE_ORDER) {
    const bucket = buckets.get(league);
    if (!bucket || bucket.length === 0) continue;

    // MAX desc, achievedAt asc (önce ulaşan kazanır)
    bucket.sort((a, b) => b.maxScore - a.maxScore || a.achievedAt - b.achievedAt);

    const policy = movementCount(bucket.length);
    const promoteTarget = promoteLeague(league);
    const demoteTarget = demoteLeague(league);

    if (policy.promote > 0 && promoteTarget) {
      for (let i = 0; i < policy.promote && i < bucket.length; i++) {
        movements.push({ userId: bucket[i]!.userId, nextLeague: promoteTarget });
      }
    }
    if (policy.demote > 0 && demoteTarget) {
      // Tail'den, terfi alanlarla çakışmayacak şekilde
      const start = Math.max(policy.promote, bucket.length - policy.demote);
      for (let i = start; i < bucket.length; i++) {
        movements.push({ userId: bucket[i]!.userId, nextLeague: demoteTarget });
      }
    }
  }

  if (movements.length === 0) return;

  const now = new Date();
  for (const m of movements) {
    // Upsert: önce update, etkilenen yoksa insert
    const updated = await db
      .update(userSettings)
      .set({ currentLeague: m.nextLeague, updatedAt: now })
      .where(eq(userSettings.userId, m.userId))
      .returning({ userId: userSettings.userId });

    if (updated.length === 0) {
      await db
        .insert(userSettings)
        .values({ userId: m.userId, currentLeague: m.nextLeague, updatedAt: now })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { currentLeague: m.nextLeague, updatedAt: now },
        });
    }
  }
}

/**
 * Sezon penceresi içinde, [gameId verilirse o oyun, yoksa tüm oyunlar] için
 * her kullanıcının MAX skorunu + bu skora ilk ulaştığı zamanı döner.
 * Sıralama: skor desc, achievedAt asc (tie-breaker).
 */
async function fetchTopByMax(
  gameId: string | null,
  startedAt: number,
  endedAt: number,
  limit: number,
): Promise<ChampionRow[]> {
  const conditions = [gte(gameScores.createdAt, startedAt), lt(gameScores.createdAt, endedAt)];
  if (gameId) conditions.push(eq(gameScores.gameId, gameId));

  const rows = await db
    .select({
      userId: gameScores.userId,
      maxScore: sql<number>`MAX(${gameScores.score})`.as("max_score"),
      achievedAt: sql<number>`MIN(CASE WHEN ${gameScores.score} = (
        SELECT MAX(g2.score) FROM game_scores g2
        WHERE g2.user_id = ${gameScores.userId}
          ${gameId ? sql`AND g2.game_id = ${gameId}` : sql``}
          AND g2.created_at >= ${startedAt}
          AND g2.created_at < ${endedAt}
      ) THEN ${gameScores.createdAt} END)`.as("achieved_at"),
    })
    .from(gameScores)
    .where(and(...conditions))
    .groupBy(gameScores.userId)
    .orderBy(sql`max_score DESC, achieved_at ASC`)
    .limit(limit);

  // Sezon kapanışı için kullanıcı liglerini hesapla — lifetime SUM kullanıyoruz
  const lifetimeSums = await db
    .select({
      userId: gameScores.userId,
      total: sql<number>`SUM(${gameScores.score})`.as("total"),
    })
    .from(gameScores)
    .groupBy(gameScores.userId);
  const lifetimeMap = new Map(lifetimeSums.map((r) => [r.userId, r.total ?? 0]));

  return rows.map((r, i) => ({
    userId: r.userId,
    maxScore: r.maxScore,
    achievedAt: r.achievedAt ?? endedAt,
    rank: i + 1,
    league: computeLeague(lifetimeMap.get(r.userId) ?? 0),
  }));
}

async function insertChampions(seasonKey: string, scope: string, rows: ChampionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const now = Date.now();
  await db.insert(seasonChampions).values(
    rows.map((r) => ({
      id: crypto.randomUUID(),
      seasonKey,
      scope,
      rank: r.rank,
      userId: r.userId,
      league: r.league,
      score: r.maxScore,
      createdAt: now,
    })),
  );
}

async function insertParticipants(seasonKey: string, rows: ChampionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const now = Date.now();
  await db.insert(seasonParticipants).values(
    rows.map((r) => ({
      id: crypto.randomUUID(),
      seasonKey,
      rank: r.rank,
      userId: r.userId,
      league: r.league,
      score: r.maxScore,
      createdAt: now,
    })),
  );
}
