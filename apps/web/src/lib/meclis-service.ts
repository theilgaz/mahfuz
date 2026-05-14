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
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { STARTING_TIME_MS, type Difficulty } from "~/lib/game-scoring";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const MECLIS_GAMES = ["fill-blank", "surah-guess", "word-meaning", "word-match", "peygamber-kim", "kari-tahmini", "arapca-secim"] as const;
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
const DEFAULT_POOL_SIZE = 3;
const DEFAULT_ROUND_DURATION_MS = 60_000;
const PUBLIC_LOBBY_STALE_MS = 30 * 60 * 1000;
const VALID_GAME_COUNTS = new Set([3, 5, 7]);
const VALID_DURATIONS_MS = new Set([30_000, 45_000, 60_000, 90_000, 120_000]);

// Takım modu sabitleri
const TEAMS = ["green", "gold"] as const;
export type MeclisTeam = (typeof TEAMS)[number];
/** Takımın tüm üyeleri pozitif skor yaptıysa her üyeye bu kadar bonus eklenir. */
const COMBO_BONUS = 30;
/** Son elde takımın en yüksek skoru karşı takımı yendiyse her üyeye bu kadar bonus eklenir. */
const DUEL_BONUS = 75;

/** 4-haneli numerik şifre için scrypt hash + salt. */
function hashPassword(plain: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 32).toString("hex");
  return { hash, salt };
}

function verifyPassword(plain: string, hash: string, salt: string): boolean {
  const derived = scryptSync(plain, salt, 32);
  const stored = Buffer.from(hash, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

function isValidNumericPassword(p: string): boolean {
  return /^\d{4}$/.test(p);
}

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
  const allLocked = players.length > 0 && players.every((p) => p.votesLockedAt != null);
  const startedAt = s.roundStartedAt ?? s.updatedAt;
  const timedOut = Date.now() - startedAt > VOTING_TIMEOUT_MS;
  if (!allLocked && !timedOut) return;

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
  const targetCount = s.targetGameCount ?? DEFAULT_POOL_SIZE;
  const pool = sorted.slice(0, targetCount).map(([g]) => g);
  // Önce eksik kaldıysa diğer oyunları ekle, sonra hala azsa baştan döngüye gir (tekrar OK)
  while (pool.length < targetCount) {
    const fresh = MECLIS_GAMES.find((g) => !pool.includes(g));
    if (fresh) pool.push(fresh);
    else pool.push(sorted[pool.length % sorted.length]?.[0] ?? MECLIS_GAMES[0]);
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
  const roundDuration = s.roundDurationMs ?? STARTING_TIME_MS[s.difficulty as Difficulty] ?? STARTING_TIME_MS.easy;
  const players = await db.select().from(meclisPlayers).where(eq(meclisPlayers.meclisId, meclisId));
  const allDone = players.length > 0 && players.every((p) => p.finishedAt != null);
  const timedOut = Date.now() - s.roundStartedAt > roundDuration;
  if (!allDone && !timedOut) return;

  // Bu el için her oyuncunun nihai round skoru (combo/duel bonusundan önce)
  const roundScores = new Map<string, number>();
  for (const p of players) roundScores.set(p.userId, p.currentScore);

  // Takım bonusları: her oyuncu için toplam ek puan (totalScore'a eklenecek)
  const bonusByUser = new Map<string, number>();
  if (s.teamMode) {
    const pool: string[] = JSON.parse(s.gamePool || "[]");
    const isLast = s.currentGameIndex >= pool.length - 1;
    for (const team of TEAMS) {
      const members = players.filter((p) => p.team === team);
      if (members.length === 0) continue;
      // Combo: tüm üyeler bu elde pozitif skor yaptıysa
      const everyPositive = members.every((m) => (roundScores.get(m.userId) ?? 0) > 0);
      if (everyPositive) {
        for (const m of members) {
          bonusByUser.set(m.userId, (bonusByUser.get(m.userId) ?? 0) + COMBO_BONUS);
        }
      }
      // Düello finali: son eldeyse her takımın en yüksek round skorunu karşılaştır
      if (isLast) {
        const heroScore = members.reduce(
          (max, m) => Math.max(max, roundScores.get(m.userId) ?? 0),
          0,
        );
        // Tek bir kayıt olarak sakla, sonra karşılaştır
        bonusByUser.set(`__hero:${team}`, heroScore);
      }
    }

    // Düello kazananı: hangi takımın hero skoru daha yüksekse, o takım kazanır
    const greenHero = bonusByUser.get("__hero:green");
    const goldHero = bonusByUser.get("__hero:gold");
    if (greenHero != null && goldHero != null && greenHero !== goldHero) {
      const winningTeam: MeclisTeam = greenHero > goldHero ? "green" : "gold";
      for (const m of players.filter((p) => p.team === winningTeam)) {
        bonusByUser.set(m.userId, (bonusByUser.get(m.userId) ?? 0) + DUEL_BONUS);
      }
    }
    // Geçici hero anahtarlarını temizle
    bonusByUser.delete("__hero:green");
    bonusByUser.delete("__hero:gold");
  }

  // currentScore'u totalScore'a topla + takım bonusu, finishedAt set olmayanlar süreyi kullanmış sayılır
  const now = Date.now();
  for (const p of players) {
    const finalCurrent = p.currentScore;
    const bonus = bonusByUser.get(p.userId) ?? 0;
    await db
      .update(meclisPlayers)
      .set({
        totalScore: p.totalScore + finalCurrent + bonus,
        finishedAt: p.finishedAt ?? now,
      })
      .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, p.userId)));
  }

  // Son eldeyse interim atla, doğrudan final'a geç — 5sn boşa bekleme olmasın
  const pool: string[] = JSON.parse(s.gamePool || "[]");
  const isLast = s.currentGameIndex >= pool.length - 1;
  await db
    .update(meclisSessions)
    .set({
      status: isLast ? "final" : "interim",
      roundStartedAt: isLast ? null : now,
      updatedAt: now,
    })
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
  await tickBot(meclisId);
  await advanceVotingIfReady(meclisId);
  await advancePlayingIfDone(meclisId);
  await advanceInterimIfElapsed(meclisId);
}

// ── Bot (Abdullah) ───────────────────────────────────────
// Her meclise otomatik eklenir ki ev sahibi tek basina baslatabilsin.
// Sunucu icinde insan gibi davranir: voting fazinda gecikmeli oy kilitler,
// playing fazinda makul bir skor yazip eli bitirir.

const BOT_USER_ID = "__mahfuz_bot__";
const BOT_DISPLAY_NAME = "Abdullah";
const BOT_EMAIL = "bot@mahfuz.internal";
const BOT_VOTING_DELAY_MS = 7_000;
const BOT_PLAYING_FRACTION = 0.75;
const BOT_BASE_SCORE: Record<Difficulty, number> = {
  easy: 110, medium: 180, hard: 320, hafiz: 540,
};

async function ensureBotUser(): Promise<void> {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.id, BOT_USER_ID)).limit(1);
  if (existing.length > 0) return;
  const now = new Date();
  await db.insert(user).values({
    id: BOT_USER_ID,
    name: BOT_DISPLAY_NAME,
    email: BOT_EMAIL,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function addBotToMeclis(meclisId: string): Promise<void> {
  const existing = await db
    .select({ userId: meclisPlayers.userId })
    .from(meclisPlayers)
    .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, BOT_USER_ID)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(meclisPlayers).values({
    meclisId,
    userId: BOT_USER_ID,
    name: BOT_DISPLAY_NAME,
    ready: true,
    votes: "[]",
    totalScore: 0,
    currentScore: 0,
    finishedAt: null,
    joinedAt: Date.now(),
  });
}

function botRoundScore(difficulty: Difficulty): number {
  const base = BOT_BASE_SCORE[difficulty] ?? BOT_BASE_SCORE.easy;
  const jitter = Math.floor((Math.random() - 0.5) * base * 0.7);
  return Math.max(0, base + jitter);
}

async function tickBot(meclisId: string): Promise<void> {
  const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.id, meclisId)).limit(1);
  if (!s) return;
  const [bot] = await db
    .select()
    .from(meclisPlayers)
    .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, BOT_USER_ID)))
    .limit(1);
  if (!bot) return;

  const now = Date.now();

  if (s.status === "voting" && bot.votesLockedAt == null) {
    const startedAt = s.roundStartedAt ?? s.updatedAt;
    if (now - startedAt < BOT_VOTING_DELAY_MS) return;
    const target = s.targetGameCount ?? DEFAULT_POOL_SIZE;
    const shuffled = [...MECLIS_GAMES].sort(() => Math.random() - 0.5).slice(0, target);
    await db
      .update(meclisPlayers)
      .set({ votes: JSON.stringify(shuffled), scopeVote: "all", votesLockedAt: now })
      .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, BOT_USER_ID)));
    return;
  }

  if (s.status === "playing" && bot.finishedAt == null && s.roundStartedAt != null) {
    const elapsed = now - s.roundStartedAt;
    const roundDuration = s.roundDurationMs ?? STARTING_TIME_MS[s.difficulty as Difficulty] ?? STARTING_TIME_MS.easy;
    if (elapsed < roundDuration * BOT_PLAYING_FRACTION) return;

    const score = botRoundScore(s.difficulty as Difficulty);
    const pool: string[] = JSON.parse(s.gamePool || "[]");
    const gameId = pool[s.currentGameIndex] ?? MECLIS_GAMES[0];

    await db
      .update(meclisPlayers)
      .set({ currentScore: score, finishedAt: now })
      .where(and(eq(meclisPlayers.meclisId, meclisId), eq(meclisPlayers.userId, BOT_USER_ID)));

    await db.insert(meclisResults).values({
      id: crypto.randomUUID(),
      meclisId: s.id,
      gameIndex: s.currentGameIndex,
      gameId,
      userId: BOT_USER_ID,
      score,
      correctCount: Math.floor(score / 12),
      wrongCount: Math.floor(Math.random() * 3),
      durationMs: Math.floor(roundDuration * BOT_PLAYING_FRACTION),
      createdAt: now,
    });
  }
}

// ── Server fonksiyonları ─────────────────────────────────

export const createMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: {
    difficulty?: Difficulty;
    gameCount?: number;
    roundDurationMs?: number;
    visibility?: "private" | "public";
    password?: string;
  }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const code = await generateUniqueCode();
    const meclisId = crypto.randomUUID();
    const now = Date.now();
    const gameCount = data.gameCount && VALID_GAME_COUNTS.has(data.gameCount) ? data.gameCount : DEFAULT_POOL_SIZE;
    const roundDuration = data.roundDurationMs && VALID_DURATIONS_MS.has(data.roundDurationMs) ? data.roundDurationMs : DEFAULT_ROUND_DURATION_MS;
    const visibility = data.visibility === "public" ? "public" : "private";
    let passwordHash: string | null = null;
    let passwordSalt: string | null = null;
    if (data.password) {
      if (!isValidNumericPassword(data.password)) throw new Error("Şifre 4 haneli rakam olmalı");
      const h = hashPassword(data.password);
      passwordHash = h.hash;
      passwordSalt = h.salt;
    }
    await db.insert(meclisSessions).values({
      id: meclisId,
      code,
      hostUserId: me.id,
      status: "lobby",
      difficulty: data.difficulty ?? "easy",
      gamePool: "[]",
      targetGameCount: gameCount,
      roundDurationMs: roundDuration,
      currentGameIndex: 0,
      roundStartedAt: null,
      visibility,
      passwordHash,
      passwordSalt,
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
    await ensureBotUser();
    await addBotToMeclis(meclisId);
    return { code, meclisId };
  });

export const joinMeclis = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; name?: string; password?: string }) => input)
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
    // Zaten içerideyse şifre tekrar sorulmaz
    if (existing.length > 0) return { meclisId: s.id, code: s.code };

    if (s.status !== "lobby") throw new Error("Meclis başladı, geç kaldın");

    // Şifre kontrolü — yeni katılan için
    if (s.passwordHash && s.passwordSalt) {
      if (!data.password || !verifyPassword(data.password, s.passwordHash, s.passwordSalt)) {
        throw new Error("Şifre yanlış");
      }
    }

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

/**
 * Mihmandar lobby aşamasında oyun sayısını, süreyi, görünürlüğü ve şifreyi değiştirir.
 * Tüm alanlar opsiyonel — sadece verilenler güncellenir.
 */
export const updateMeclisSetup = createServerFn({ method: "POST" })
  .inputValidator((input: {
    code: string;
    gameCount?: number;
    roundDurationMs?: number;
    visibility?: "private" | "public";
    password?: string | null;
  }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar değiştirebilir");
    if (s.status !== "lobby") throw new Error("Sadece lobide değiştirilebilir");

    const update: Record<string, unknown> = { updatedAt: Date.now() };
    if (data.gameCount != null) {
      if (!VALID_GAME_COUNTS.has(data.gameCount)) throw new Error("Geçersiz oyun sayısı");
      update.targetGameCount = data.gameCount;
    }
    if (data.roundDurationMs != null) {
      if (!VALID_DURATIONS_MS.has(data.roundDurationMs)) throw new Error("Geçersiz süre");
      update.roundDurationMs = data.roundDurationMs;
    }
    if (data.visibility) {
      update.visibility = data.visibility === "public" ? "public" : "private";
    }
    if (data.password === null) {
      update.passwordHash = null;
      update.passwordSalt = null;
    } else if (typeof data.password === "string") {
      if (!isValidNumericPassword(data.password)) throw new Error("Şifre 4 haneli rakam olmalı");
      const h = hashPassword(data.password);
      update.passwordHash = h.hash;
      update.passwordSalt = h.salt;
    }

    await db.update(meclisSessions).set(update).where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

/**
 * Public lobby listesi — /meclis index sayfasında görünür.
 * Sadece status='lobby' ve son aktivitesi 30 dk içinde olanlar.
 */
export const listPublicMeclises = createServerFn({ method: "GET" })
  .handler(async () => {
    const cutoff = Date.now() - PUBLIC_LOBBY_STALE_MS;
    const rows = await db
      .select({
        code: meclisSessions.code,
        difficulty: meclisSessions.difficulty,
        targetGameCount: meclisSessions.targetGameCount,
        hasPassword: sql<number>`CASE WHEN ${meclisSessions.passwordHash} IS NULL THEN 0 ELSE 1 END`,
        hostName: user.name,
        updatedAt: meclisSessions.updatedAt,
        playerCount: sql<number>`(SELECT COUNT(*) FROM meclis_players WHERE meclis_players.meclis_id = ${meclisSessions.id})`,
      })
      .from(meclisSessions)
      .leftJoin(user, eq(meclisSessions.hostUserId, user.id))
      .where(and(
        eq(meclisSessions.visibility, "public"),
        eq(meclisSessions.status, "lobby"),
        gte(meclisSessions.updatedAt, cutoff),
      ))
      .orderBy(desc(meclisSessions.updatedAt))
      .limit(30);

    return rows.map((r) => ({
      code: r.code,
      difficulty: r.difficulty,
      gameCount: r.targetGameCount,
      hasPassword: r.hasPassword === 1,
      hostName: r.hostName ?? "Mihmandar",
      playerCount: Number(r.playerCount ?? 0),
      maxPlayers: MAX_PLAYERS,
    }));
  });

/**
 * Takım modunu aç/kapat. Açılırken üyeler join sırasına göre Yeşil/Altın
 * arasında otomatik dengelenir. Kapanırken takım atamaları temizlenir.
 * Sadece mihmandar ve sadece lobide.
 */
export const setMeclisTeamMode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; enabled: boolean }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar değiştirebilir");
    if (s.status !== "lobby") throw new Error("Sadece lobide değiştirilebilir");

    const now = Date.now();
    await db
      .update(meclisSessions)
      .set({ teamMode: data.enabled, updatedAt: now })
      .where(eq(meclisSessions.id, s.id));

    if (data.enabled) {
      const players = await db
        .select()
        .from(meclisPlayers)
        .where(eq(meclisPlayers.meclisId, s.id))
        .orderBy(meclisPlayers.joinedAt);
      // Auto-balance — join sırasına göre alternatif olarak Yeşil/Altın
      for (let i = 0; i < players.length; i++) {
        const team: MeclisTeam = i % 2 === 0 ? "green" : "gold";
        await db
          .update(meclisPlayers)
          .set({ team })
          .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, players[i].userId)));
      }
    } else {
      await db
        .update(meclisPlayers)
        .set({ team: null })
        .where(eq(meclisPlayers.meclisId, s.id));
    }
    return { ok: true };
  });

/** Mihmandar bir oyuncunun takımını değiştirir. Sadece lobide. */
export const setMeclisPlayerTeam = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; userId: string; team: MeclisTeam }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar değiştirebilir");
    if (s.status !== "lobby") throw new Error("Sadece lobide değiştirilebilir");
    if (!s.teamMode) throw new Error("Takım modu kapalı");
    if (!TEAMS.includes(data.team)) throw new Error("Geçersiz takım");

    await db
      .update(meclisPlayers)
      .set({ team: data.team })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, data.userId)));
    await db.update(meclisSessions).set({ updatedAt: Date.now() }).where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

export const setMeclisVotesVisibility = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; visible: boolean }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.hostUserId !== me.id) throw new Error("Sadece mihmandar değiştirebilir");
    if (s.status !== "lobby" && s.status !== "voting") throw new Error("Sadece lobby veya oylama fazında değiştirilebilir");
    await db
      .update(meclisSessions)
      .set({ votesVisible: data.visible, updatedAt: Date.now() })
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
    if (s.teamMode) {
      const green = players.filter((p) => p.team === "green").length;
      const gold = players.filter((p) => p.team === "gold").length;
      if (green === 0 || gold === 0) throw new Error("Her takımda en az 1 oyuncu olmalı");
    }

    const now = Date.now();
    await db
      .update(meclisSessions)
      .set({ status: "voting", roundStartedAt: now, updatedAt: now })
      .where(eq(meclisSessions.id, s.id));
    return { ok: true };
  });

/**
 * Canlı oylama: her toggle'da çağrılır, picks ve scope'u sunucuya yansıtır.
 * Kullanıcı kilitlemeden önce diğer oyuncular VoterStack üzerinden anında görür.
 * Kilitliyse (`votesLockedAt != null`) değişikliği reddeder.
 */
export const submitMeclisVotes = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; votes: string[]; scope: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "voting") throw new Error("Oylama fazında değil");

    const [player] = await db
      .select()
      .from(meclisPlayers)
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)))
      .limit(1);
    if (player?.votesLockedAt != null) {
      // Kilitli; sessizce yok say (UI zaten read-only)
      return { ok: false, locked: true };
    }

    const cleanVotes = data.votes
      .filter((v) => MECLIS_GAMES.includes(v as MeclisGameId))
      .slice(0, s.targetGameCount ?? DEFAULT_POOL_SIZE);
    const cleanScope = data.scope && MECLIS_SCOPES.includes(data.scope as MeclisScope) ? data.scope : null;

    await db
      .update(meclisPlayers)
      .set({ votes: JSON.stringify(cleanVotes), scopeVote: cleanScope })
      .where(and(eq(meclisPlayers.meclisId, s.id), eq(meclisPlayers.userId, me.id)));

    // Live submit — advance tetikleme; sadece lock geldiğinde advance ol
    return { ok: true };
  });

/**
 * Kullanıcı kararını kilitler. Daha sonra değişiklik yapılamaz.
 * Tüm oyuncular kilitlerse advanceVotingIfReady ileri taşır.
 */
export const lockMeclisVotes = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; votes: string[]; scope: string }) => input)
  .handler(async ({ data }) => {
    const me = await requireUser();
    const [s] = await db.select().from(meclisSessions).where(eq(meclisSessions.code, data.code)).limit(1);
    if (!s) throw new Error("Meclis bulunamadı");
    if (s.status !== "voting") throw new Error("Oylama fazında değil");

    const cleanVotes = data.votes
      .filter((v) => MECLIS_GAMES.includes(v as MeclisGameId))
      .slice(0, s.targetGameCount ?? DEFAULT_POOL_SIZE);
    if (cleanVotes.length === 0) throw new Error("En az 1 oyun seçmelisin");
    const cleanScope = MECLIS_SCOPES.includes(data.scope as MeclisScope) ? data.scope : null;
    if (!cleanScope) throw new Error("Bir sure kapsamı seçmelisin");

    const now = Date.now();
    await db
      .update(meclisPlayers)
      .set({ votes: JSON.stringify(cleanVotes), scopeVote: cleanScope, votesLockedAt: now })
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
    votesVisible: boolean;
    targetGameCount: number;
    visibility: "private" | "public";
    hasPassword: boolean;
    teamMode: boolean;
  };
  players: {
    userId: string;
    name: string;
    image: string | null;
    ready: boolean;
    votes: string[];
    scopeVote: string | null;
    votesLockedAt: number | null;
    totalScore: number;
    currentScore: number;
    finishedAt: number | null;
    isHost: boolean;
    team: MeclisTeam | null;
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
      .select({
        userId: meclisPlayers.userId,
        name: meclisPlayers.name,
        image: user.image,
        ready: meclisPlayers.ready,
        votes: meclisPlayers.votes,
        scopeVote: meclisPlayers.scopeVote,
        votesLockedAt: meclisPlayers.votesLockedAt,
        totalScore: meclisPlayers.totalScore,
        currentScore: meclisPlayers.currentScore,
        finishedAt: meclisPlayers.finishedAt,
        team: meclisPlayers.team,
      })
      .from(meclisPlayers)
      .leftJoin(user, eq(meclisPlayers.userId, user.id))
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
        roundDurationMs: s.roundDurationMs ?? STARTING_TIME_MS[difficulty] ?? STARTING_TIME_MS.easy,
        targetGameCount: s.targetGameCount ?? DEFAULT_POOL_SIZE,
        visibility: (s.visibility === "public" ? "public" : "private"),
        hasPassword: !!s.passwordHash,
        teamMode: !!s.teamMode,
        interimMs: INTERIM_MS,
        hostUserId: s.hostUserId,
        votesVisible: s.votesVisible,
      },
      players: players.map((p) => ({
        userId: p.userId,
        name: p.name,
        image: p.image,
        ready: p.ready,
        votes: (() => {
          try {
            return JSON.parse(p.votes) as string[];
          } catch {
            return [];
          }
        })(),
        scopeVote: p.scopeVote,
        votesLockedAt: p.votesLockedAt,
        totalScore: p.totalScore,
        currentScore: p.currentScore,
        finishedAt: p.finishedAt,
        isHost: p.userId === s.hostUserId,
        team: (p.team === "green" || p.team === "gold" ? p.team : null) as MeclisTeam | null,
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
        votesLockedAt: null,
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
