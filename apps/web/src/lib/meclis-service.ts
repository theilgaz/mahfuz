/**
 * Meclis (party mode) — gerçek zamanlı çok-cihaz oyun servisi.
 *
 * Akış:
 *   lobby (ready bekle) → voting (oy ver) → playing[0] (1.el) → interim (5sn) →
 *   playing[1] → interim → playing[2] → final
 *
 * Client'lar getMeclisState'i 1-3sn'de bir poller; bu fonksiyon her çağrıda
 * gerekirse durumu ileri taşır (server-side advancement).
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db, meclisSessions, meclisPlayers, meclisResults, user } from "~/db";
import { auth } from "~/lib/auth";
import { eq, and, sql, desc } from "drizzle-orm";
import { STARTING_TIME_MS, type Difficulty } from "~/lib/game-scoring";

const MECLIS_GAMES = ["fill-blank", "surah-guess", "word-meaning", "word-match", "peygamber-kim", "kari-tahmini"] as const;
export type MeclisGameId = (typeof MECLIS_GAMES)[number];

const MECLIS_SCOPES = ["all", "namaz", "duha-nas", "tebareke", "amme", "yasin", "bakara"] as const;
export type MeclisScope = (typeof MECLIS_SCOPES)[number];

/** Bir scope için sure id'leri (boş → tüm Kuran). */
export function surahIdsForScope(scope: string): number[] {
  switch (scope) {
    case "namaz":
      return [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
    case "duha-nas": {
      const ids: number[] = [];
      for (let i = 93; i <= 114; i++) ids.push(i);
      return ids;
    }
    case "tebareke": {
      const ids: number[] = [];
      for (let i = 67; i <= 77; i++) ids.push(i);
      return ids;
    }
    case "amme": {
      const ids: number[] = [];
      for (let i = 78; i <= 114; i++) ids.push(i);
      return ids;
    }
    case "yasin":
      return [36];
    case "bakara":
      return [2];
    default:
      return [];
  }
}

const MAX_PLAYERS = 8;
const VOTING_TIMEOUT_MS = 30_000;
const INTERIM_MS = 5_000;
const POOL_SIZE = 3;

async function requireUser() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session?.user?.id) throw new Error("Auth required");
  return { id: session.user.id, name: session.user.name ?? "Misafir" };
}

function generateMeclisCode(): string {
  // Kafa karıştırmayan karakterler — I/O/0/1 yok.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateMeclisCode();
    const exists = await db
      .select({ id: meclisSessions.id })
      .from(meclisSessions)
      .where(eq(meclisSessions.code, code))
      .limit(1);
    if (exists.length === 0) return code;
  }
  throw new Error("Davet kodu üretilemedi, tekrar dene");
}

// ── Faz geçiş yardımcıları ───────────────────────────────

async function advanceVotingIfReady(meclisId: string) {
  const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.id, meclisId)).limit(1);
  if (!s || s.status !== "voting") return;
  const players = await db.select().from(meclisPlayers).where(eq(meclisPlayers.meclisId, meclisId));
  const allVoted = players.every((p) => {
    try {
      return Array.isArray(JSON.parse(p.votes)) && JSON.parse(p.votes).length > 0 && p.scopeVote != null;
    } catch {
      return false;
    }
  });
  const startedAt = s.roundStartedAt ?? s.updatedAt;
  const timedOut = Date.now() - startedAt > VOTING_TIMEOUT_MS;
  if (!allVoted && !timedOut) return;

  // Oyun oyları
  const tally = new Map<string, number>();
  for (const game of MECLIS_GAMES) tally.set(game, 0);
  for (const p of players) {
    try {
      const votes = JSON.parse(p.votes) as string[];
      for (const g of votes) {
        if (tally.has(g)) tally.set(g, (tally.get(g) ?? 0) + 1);
      }
    } catch {
      /* skip */
    }
  }
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const pool = sorted.slice(0, POOL_SIZE).map(([g]) => g);
  while (pool.length < POOL_SIZE) {
    const next = MECLIS_GAMES.find((g) => !pool.includes(g));
    if (!next) break;
    pool.push(next);
  }

  // Scope oyları
  const scopeTally = new Map<string, number>();
  for (const sc of MECLIS_SCOPES) scopeTally.set(sc, 0);
  for (const p of players) {
    const v = p.scopeVote;
    if (v && scopeTally.has(v)) scopeTally.set(v, (scopeTally.get(v) ?? 0) + 1);
  }
  const scopeSorted = [...scopeTally.entries()].sort((a, b) => b[1] - a[1]);
  const winningScope = scopeSorted[0]?.[1] && scopeSorted[0][1] > 0 ? scopeSorted[0][0] : "all";

  const now = Date.now();
  await db
    .update(meclisSessions)
    .set({
      status: "playing",
      gamePool: JSON.stringify(pool),
      surahScope: winningScope,
      currentGameIndex: 0,
      roundStartedAt: now,
      updatedAt: now,
    })
    .where(eq(meclisSessions.id, meclisId));
  // El başında: tüm oyuncuların currentScore + finishedAt sıfırla
  await db
    .update(meclisPlayers)
    .set({ currentScore: 0, finishedAt: null })
    .where(eq(meclisPlayers.meclisId, meclisId));
}

async function advancePlayingIfDone(meclisId: string) {
  const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.id, meclisId)).limit(1);
  if (!s || s.status !== "playing" || s.roundStartedAt == null) return;
  const roundDuration = STARTING_TIME_MS[s.difficulty as Difficulty] ?? STARTING_TIME_MS.easy;
  const players = await db.select().from(meclisPlayers).where(eq(meclisPlayers.meclisId, meclisId));
  const allDone = players.length > 0 && players.every((p) => p.finishedAt != null);
  const timedOut = Date.now() - s.roundStartedAt > roundDuration;
  if (!allDone && !timedOut) return;

  // currentScore'u totalScore'a topla, finishedAt set olmayanlar süreyi kullanmış sayılır
  const now = Date.now();
  for (const p of players) {
    const finalCurrent = p.currentScore;
    await db
      .update(meclisPlayers)
      .set({
        totalScore: p.totalScore + finalCurrent,
        finishedAt: p.finishedAt ?? now,
      })
      .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, p.userId)));
  }

  await db
    .update(meclisSessions)
    .set({ status: "interim", roundStartedAt: now, updatedAt: now })
    .where(eq(meclisSessions.id, meclisId));
}

async function advanceInterimIfElapsed(meclisId: string) {
  const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.id, meclisId)).limit(1);
  if (!s || s.status !== "interim" || s.roundStartedAt == null) return;
  if (Date.now() - s.roundStartedAt < INTERIM_MS) return;

  const nextIndex = s.currentGameIndex + 1;
  const pool: string[] = JSON.parse(s.gamePool || "[]");
  const now = Date.now();
  if (nextIndex >= pool.length) {
    await db
      .update(meclisSessions)
      .set({ status: "final", updatedAt: now })
      .where(eq(meclisSessions.id, meclisId));
    return;
  }
  await db
    .update(meclisSessions)
    .set({
      status: "playing",
      currentGameIndex: nextIndex,
      roundStartedAt: now,
      updatedAt: now,
    })
    .where(eq(meclisSessions.id, meclisId));
  await db
    .update(meclisPlayers)
    .set({ currentScore: 0, finishedAt: null })
    .where(eq(meclisPlayers.meclisId, meclisId));
}

async function maybeAdvance(meclisId: string) {
  await advanceVotingIfReady(meclisId);
  await advancePlayingIfDone(meclisId);
  await advanceInterimIfElapsed(meclisId);
}

// ── Server fonksiyonları ─────────────────────────────────

export const createMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: { difficulty?: Difficulty }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const code = await generateUniqueCode();
    const meclisId = crypto.randomUUID();
    const now = Date.now();
    await db.insert(meclisSessions).values({
      id: meclisId,
      code,
      hostUserId: me.id,
      status: "lobby",
      difficulty: data.difficulty ?? "easy",
      gamePool: "[]",
      currentGameIndex: 0,
      roundStartedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(meclisPlayers).values({
      meclisId,
      userId: me.id,
      name: me.name,
      ready: false,
      votes: "[]",
      totalScore: 0,
      currentScore: 0,
      finishedAt: null,
      joinedAt: now,
    });
    return { code, meclisId };
  });

export const joinMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; name?: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const code = data.code.trim().toUpperCase();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status === "final" || s.status === "cancelled") throw new Error("Bu meclis kapanmış");

    const existing = await db
      .select()
      .from(meclisPlayers)
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)))
      .limit(1);
    if (existing.length > 0) return { meclisId: s.id, code: s.code };

    if (s.status !== "lobby") throw new Error("Meclis başladı, geç kaldın");

    const playerCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(meclisPlayers)
      .where(eq(meclisPlayers.meclisId, s.id));
    if ((playerCount[0]?.c ?? 0) >= MAX_PLAYERS) throw new Error("Meclis dolu");

    const now = Date.now();
    await db.insert(meclisPlayers).values({
      meclisId: s.id,
      userId: me.id,
      name: data.name?.trim() || me.name,
      ready: false,
      votes: "[]",
      totalScore: 0,
      currentScore: 0,
      finishedAt: null,
      joinedAt: now,
    });
    await db.update(meclisSessions).set({ updatedAt: now }).where(eq(meclisSessions.id, s.id));
    return { meclisId: s.id, code: s.code };
  });

export const toggleMeclisReady = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; ready: boolean }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "lobby") return { ok: false };
    await db
      .update(meclisPlayers)
      .set({ ready: data.ready })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)));
    await db.update(meclisSessions).set({ updatedAt: Date.now() }).where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

export const setMeclisDifficulty = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; difficulty: Difficulty }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar değiştirebilir");
    if (s.status !== "lobby") throw new Error("Lobby'de değil");
    await db
      .update(meclisSessions)
      .set({ difficulty: data.difficulty, updatedAt: Date.now() })
      .where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

export const startMeclisVoting = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar başlatabilir");
    if (s.status !== "lobby") throw new Error("Zaten başlamış");

    const players = await db.select().from(meclisPlayers).where(eq(meclisPlayers.meclisId, s.id));
    if (players.length < 2) throw new Error("En az 2 katılımcı gerekli");
    const allReady = players.every((p) => p.ready);
    if (!allReady) throw new Error("Tüm katılımcılar 'Hazır' demeli");

    const now = Date.now();
    await db
      .update(meclisSessions)
      .set({ status: "voting", roundStartedAt: now, updatedAt: now })
      .where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

export const submitMeclisVotes = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; votes: string[]; scope: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "voting") throw new Error("Oylama fazında değil");

    const cleanVotes = data.votes
      .filter((v) => MECLIS_GAMES.includes(v as MeclisGameId))
      .slice(0, POOL_SIZE);
    const cleanScope = MECLIS_SCOPES.includes(data.scope as MeclisScope) ? data.scope : "all";

    await db
      .update(meclisPlayers)
      .set({ votes: JSON.stringify(cleanVotes), scopeVote: cleanScope })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)));

    await maybeAdvance(s.id);
    return { ok: true };
  });

export const updateMeclisCurrentScore = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; score: number; correct: number; wrong: number }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "playing") return { ok: false };
    await db
      .update(meclisPlayers)
      .set({ currentScore: data.score })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)));
    return { ok: true };
  });

export const finishMeclisRound = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; score: number; correct: number; wrong: number; durationMs: number }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "playing") return { ok: false };

    const pool: string[] = JSON.parse(s.gamePool || "[]");
    const gameId = pool[s.currentGameIndex] ?? "fill-blank";
    const now = Date.now();

    await db
      .update(meclisPlayers)
      .set({ currentScore: data.score, finishedAt: now })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)));

    await db.insert(meclisResults).values({
      id: crypto.randomUUID(),
      meclisId: s.id,
      gameIndex: s.currentGameIndex,
      gameId,
      userId: me.id,
      score: data.score,
      correctCount: data.correct,
      wrongCount: data.wrong,
      durationMs: data.durationMs,
      createdAt: now,
    });

    await maybeAdvance(s.id);
    return { ok: true };
  });

export interface MeclisStatePayload {
  session: {
    id: string;
    code: string;
    status: string;
    difficulty: Difficulty;
    gamePool: string[];
    surahScope: string;
    surahIds: number[];
    currentGameIndex: number;
    roundStartedAt: number | null;
    roundDurationMs: number;
    interimMs: number;
    hostUserId: string;
  };
  players: {
    userId: string;
    name: string;
    ready: boolean;
    votes: string[];
    scopeVote: string | null;
    totalScore: number;
    currentScore: number;
    finishedAt: number | null;
    isHost: boolean;
  }[];
  meId: string | null;
  isHost: boolean;
}

export const getMeclisState = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }): Promise<MeclisStatePayload | null> => {
    const code = data.code.trim().toUpperCase();
    const [s0] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, code)).limit(1);
    if (!s0) return null;

    // Yan etki: faz geçişlerini tetikle
    await maybeAdvance(s0.id);

    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.id, s0.id)).limit(1);
    if (!s) return null;

    const players = await db
      .select()
      .from(meclisPlayers)
      .where(eq(meclisPlayers.meclisId, s.id))
      .orderBy(meclisPlayers.joinedAt);

    let meId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: getRequestHeaders() });
      meId = session?.user?.id ?? null;
    } catch {
      meId = null;
    }

    const pool: string[] = JSON.parse(s.gamePool || "[]");
    const difficulty = s.difficulty as Difficulty;
    return {
      session: {
        id: s.id,
        code: s.code,
        status: s.status,
        difficulty,
        gamePool: pool,
        surahScope: s.surahScope ?? "all",
        surahIds: surahIdsForScope(s.surahScope ?? "all"),
        currentGameIndex: s.currentGameIndex,
        roundStartedAt: s.roundStartedAt,
        roundDurationMs: STARTING_TIME_MS[difficulty] ?? STARTING_TIME_MS.easy,
        interimMs: INTERIM_MS,
        hostUserId: s.hostUserId,
      },
      players: players.map((p) => ({
        userId: p.userId,
        name: p.name,
        ready: p.ready,
        votes: (() => {
          try {
            return JSON.parse(p.votes) as string[];
          } catch {
            return [];
          }
        })(),
        scopeVote: p.scopeVote,
        totalScore: p.totalScore,
        currentScore: p.currentScore,
        finishedAt: p.finishedAt,
        isHost: p.userId === s.hostUserId,
      })),
      meId,
      isHost: meId != null && meId === s.hostUserId,
    };
  });

/**
 * Final ekranındaki "Yeniden Oyna" akışı. Mihmandar başlatır;
 * skorlar, oylar, gamePool, scope sıfırlanır ve oturum yeniden voting
 * fazına girer. Katılımcı listesi korunur — kimse partiyi terk etmez.
 */
export const restartMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar başlatabilir");
    if (s.status !== "final") throw new Error("Sadece final ekranından yeniden başlatılır");

    const now = Date.now();
    await db
      .update(meclisSessions)
      .set({
        status: "voting",
        gamePool: "[]",
        surahScope: "all",
        currentGameIndex: 0,
        roundStartedAt: now,
        updatedAt: now,
      })
      .where(eq(meclisSessions.id, s.id));
    await db
      .update(meclisPlayers)
      .set({
        votes: "[]",
        scopeVote: null,
        totalScore: 0,
        currentScore: 0,
        finishedAt: null,
      })
      .where(eq(meclisPlayers.meclisId, s.id));
    return { ok: true };
  });

export const cancelMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar iptal edebilir");
    await db
      .update(meclisSessions)
      .set({ status: "cancelled", updatedAt: Date.now() })
      .where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

// ── Geçmiş meclisler (scoreboard için) ───────────────────

export interface MeclisSummary {
  id: string;
  code: string;
  hostName: string;
  endedAt: number;
  playerCount: number;
  winnerName: string;
  winnerScore: number;
}

export const getRecentMeclises = createServerFn({ method: "GET" })
  .handler(async (): Promise<MeclisSummary[]> => {
    const sessions = await db
      .select()
      .from(meclisSessions)
      .where(eq(meclisSessions.status, "final"))
      .orderBy(desc(meclisSessions.updatedAt))
      .limit(10);

    const summaries: MeclisSummary[] = [];
    for (const s of sessions) {
      const players = await db
        .select()
        .from(meclisPlayers)
        .where(eq(meclisPlayers.meclisId, s.id))
        .orderBy(desc(meclisPlayers.totalScore));
      if (players.length === 0) continue;
      const winner = players[0];
      const host = players.find((p) => p.userId === s.hostUserId);
      summaries.push({
        id: s.id,
        code: s.code,
        hostName: host?.name ?? "—",
        endedAt: s.updatedAt,
        playerCount: players.length,
        winnerName: winner.name,
        winnerScore: winner.totalScore,
      });
    }
    return summaries;
  });
