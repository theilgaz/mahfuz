/**
 * İkra ek tabloları — Hatim Grubu, Oyun Skorları, Abonelik.
 * Bunlar apps/web'de yoktu; İkra'ya özgü yeni özellikler.
 */

import { sqliteTable, text, integer, real, index, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./schema";
import { ayahs } from "./quran-schema";

// ── Hatim Grupları ───────────────────────────────────────

export const hatimGroups = sqliteTable("hatim_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "full" | "juz" | "range" */
  scopeType: text("scope_type").notNull().default("full"),
  /**
   * JSON — kapsam verisi:
   *   full:  {}
   *   juz:   { juzNumbers: number[] }
   *   range: { surahStart: number, verseStart: number, surahEnd: number, verseEnd: number }
   */
  scopeData: text("scope_data").notNull().default("{}"),
  targetDate: integer("target_date"),
  inviteCode: text("invite_code").notNull().unique(),
  /** "active" | "completed" | "cancelled" */
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [
  index("hatim_groups_creator_idx").on(t.creatorId),
  index("hatim_groups_invite_idx").on(t.inviteCode),
]);

export const hatimGroupMembers = sqliteTable("hatim_group_members", {
  groupId: text("group_id")
    .notNull()
    .references(() => hatimGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /**
   * JSON — atanan bölümler:
   *   [{ type: "juz", id: 1 }, { type: "page", id: 25 }]
   */
  assignedSections: text("assigned_sections").notNull().default("[]"),
  joinedAt: integer("joined_at").notNull(),
}, (t) => [
  index("hatim_group_members_group_idx").on(t.groupId),
  index("hatim_group_members_user_idx").on(t.userId),
]);

export const hatimGroupProgress = sqliteTable("hatim_group_progress", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => hatimGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "juz:1" | "page:25" | "surah:2" */
  sectionId: text("section_id").notNull(),
  completedAt: integer("completed_at").notNull(),
}, (t) => [
  index("hatim_group_progress_group_idx").on(t.groupId),
  index("hatim_group_progress_user_idx").on(t.userId),
]);

// ── Oyun Skorları ────────────────────────────────────────

export const gameScores = sqliteTable("game_scores", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /**
   * Oyun ID'si:
   *   "fill-blank" | "surah-guess" | "word-meaning" | "word-rain" |
   *   "verse-chain" | "connections" | "hexagon" | "shared-root" |
   *   "story-guess" | "recitation-karaoke"
   */
  gameId: text("game_id").notNull(),
  score: integer("score").notNull(),
  /** Oyun modu / zorluğu — opsiyonel (örn. "easy", "timed") */
  mode: text("mode"),
  difficulty: text("difficulty"),
  /** Seans süresi (ms) */
  durationMs: integer("duration_ms"),
  /** Ek meta veri — JSON (örn. hangi sure, kaçıncı soru...) */
  metadata: text("metadata").default("{}"),
  createdAt: integer("created_at").notNull(),
}, (t) => [
  index("game_scores_user_idx").on(t.userId),
  index("game_scores_game_idx").on(t.gameId),
  index("game_scores_created_idx").on(t.createdAt),
]);

// ── Kıraet Hata Logu ────────────────────────────────────

export const recitationMistakes = sqliteTable("recitation_mistakes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "2:255" formatında */
  verseKey: text("verse_key").notNull(),
  /** Yanlış yapılan kelimenin Arapça metni */
  wordText: text("word_text").notNull(),
  /** Kelime pozisyonu (ayet içinde kaçıncı kelime) */
  wordPosition: integer("word_position"),
  /** "missed" | "wrong" | "extra" */
  mistakeType: text("mistake_type").notNull().default("wrong"),
  sessionId: text("session_id"),
  createdAt: integer("created_at").notNull(),
}, (t) => [
  index("recitation_mistakes_user_idx").on(t.userId),
  index("recitation_mistakes_verse_idx").on(t.verseKey),
]);

// ── Abonelikler ──────────────────────────────────────────

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "plus" | "family" */
  plan: text("plan").notNull(),
  /** "active" | "cancelled" | "past_due" | "trialing" */
  status: text("status").notNull().default("active"),
  currentPeriodStart: integer("current_period_start"),
  currentPeriodEnd: integer("current_period_end"),
  /** "lemon_squeezy" | "stripe" | "manual" */
  provider: text("provider").notNull().default("lemon_squeezy"),
  providerId: text("provider_id"),
  providerCustomerId: text("provider_customer_id"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [
  index("subscriptions_user_idx").on(t.userId),
  index("subscriptions_status_idx").on(t.status),
]);

// ── Aile Üyeleri (Family Plan) ───────────────────────────

export const familyMembers = sqliteTable("family_members", {
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "owner" | "member" */
  role: text("role").notNull().default("member"),
  addedAt: integer("added_at").notNull(),
});

// ── Ayet Notları (Annotation genişletmesi) ───────────────

export const verseNotes = sqliteTable("verse_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "2:255" formatında */
  verseKey: text("verse_key").notNull(),
  content: text("content").notNull(),
  /** JSON string array: ["sabır", "dua", "iman"] */
  tags: text("tags").notNull().default("[]"),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [
  index("verse_notes_user_idx").on(t.userId),
  index("verse_notes_verse_idx").on(t.verseKey),
]);

// ── Semantik Ayet Benzerliği ─────────────────────────────

export const verseSimilarity = sqliteTable("verse_similarity", {
  ayahId: integer("ayah_id")
    .notNull()
    .references(() => ayahs.id, { onDelete: "cascade" }),
  similarAyahId: integer("similar_ayah_id")
    .notNull()
    .references(() => ayahs.id, { onDelete: "cascade" }),
  /** Jaccard benzerlik skoru — 0 ile 1 arasında */
  score: real("score").notNull(),
  /** "word-overlap" | "tfidf" | "embedding" */
  method: text("method").notNull().default("word-overlap"),
}, (t) => [
  primaryKey({ columns: [t.ayahId, t.similarAyahId] }),
  index("verse_similarity_ayah_idx").on(t.ayahId),
  index("verse_similarity_similar_idx").on(t.similarAyahId),
]);

// ── Kullanıcı Başarımları ────────────────────────────────

export const userAchievements = sqliteTable("user_achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Achievement ID from code definitions (e.g. "fill-blank-score-bronze") */
  achievementId: text("achievement_id").notNull(),
  unlockedAt: integer("unlocked_at").notNull(),
  /** Context data when unlocked -- JSON (e.g. score, gameId) */
  context: text("context").default("{}"),
}, (t) => [
  index("user_achievements_user_idx").on(t.userId),
  index("user_achievements_user_ach_idx").on(t.userId, t.achievementId),
]);

// ── Günlük Meydan Okuma (Daily Challenge) ────────────────

export const dailyChallengeResults = sqliteTable("daily_challenge_results", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "2026-04-06" formatında */
  date: text("date").notNull(),
  /** "connections" | "hexagon" | "fill-blank" */
  gameId: text("game_id").notNull(),
  score: integer("score").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  guesses: integer("guesses").default(0),
  durationMs: integer("duration_ms"),
  createdAt: integer("created_at").notNull(),
}, (t) => [
  index("daily_challenge_user_date_idx").on(t.userId, t.date),
]);
