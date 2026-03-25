import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// ── Sureler ──────────────────────────────────────────────

export const surahs = sqliteTable("surahs", {
  id: integer("id").primaryKey(), // 1-114
  nameArabic: text("name_arabic").notNull(),
  nameSimple: text("name_simple").notNull(), // Al-Faatiha
  nameTranslation: text("name_translation").notNull(), // The Opening
  revelation: text("revelation").notNull(), // makkah | madinah
  ayahCount: integer("ayah_count").notNull(),
  pageStart: integer("page_start").notNull(),
  pageEnd: integer("page_end").notNull(),
  revelationOrder: integer("revelation_order").notNull(),
  bismillahPre: integer("bismillah_pre", { mode: "boolean" }).notNull().default(true),
});

// ── Ayetler ──────────────────────────────────────────────

export const ayahs = sqliteTable(
  "ayahs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }), // global key
    surahId: integer("surah_id")
      .notNull()
      .references(() => surahs.id),
    ayahNumber: integer("ayah_number").notNull(),
    textUthmani: text("text_uthmani").notNull(),
    textSimple: text("text_simple"), // harekesiz (arama için)
    pageNumber: integer("page_number").notNull(),
    juzNumber: integer("juz_number").notNull(),
    hizbNumber: integer("hizb_number").notNull(),
    rukuNumber: integer("ruku_number").notNull(),
    sajdah: integer("sajdah", { mode: "boolean" }).default(false),
  },
  (table) => [
    index("ayahs_surah_idx").on(table.surahId),
    index("ayahs_page_idx").on(table.pageNumber),
    index("ayahs_juz_idx").on(table.juzNumber),
    index("ayahs_surah_ayah_idx").on(table.surahId, table.ayahNumber),
  ],
);

// ── Kelimeler (tecvid + kelime-kelime mod) ───────────────

export const words = sqliteTable(
  "words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ayahId: integer("ayah_id")
      .notNull()
      .references(() => ayahs.id),
    position: integer("position").notNull(),
    textUthmani: text("text_uthmani").notNull(),
    transliteration: text("transliteration"),
    meaningTr: text("meaning_tr"), // Türkçe kelime anlamı
    meaningEn: text("meaning_en"), // İngilizce kelime anlamı
    charType: text("char_type").notNull().default("word"), // word | end | pause
    tajweedRule: text("tajweed_rule"), // tecvid kuralı adı
    audioTimestamp: real("audio_timestamp"), // ms
  },
  (table) => [
    index("words_ayah_idx").on(table.ayahId),
    index("words_ayah_pos_idx").on(table.ayahId, table.position),
  ],
);

// ── Meal Kaynakları ──────────────────────────────────────

export const translationSources = sqliteTable("translation_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  language: text("language").notNull(), // tr | en | ar | ...
  author: text("author").notNull(),
  name: text("name").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
});

// ── Mealler ──────────────────────────────────────────────

export const translations = sqliteTable(
  "translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    surahId: integer("surah_id").notNull(),
    ayahNumber: integer("ayah_number").notNull(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => translationSources.id),
    text: text("text").notNull(),
  },
  (table) => [
    index("translations_verse_idx").on(table.surahId, table.ayahNumber),
    index("translations_source_idx").on(table.sourceId),
    index("translations_source_verse_idx").on(table.sourceId, table.surahId, table.ayahNumber),
  ],
);

// ── Kâriler ──────────────────────────────────────────────

export const reciters = sqliteTable("reciters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nameArabic: text("name_arabic"),
  name: text("name").notNull(),
  country: text("country"),
  style: text("style"), // murattal | mujawwad | muallim
  audioBaseUrl: text("audio_base_url").notNull(),
  audioFormat: text("audio_format").notNull().default("mp3"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  source: text("source").default("qurancom"), // self | qurancom
  qurancomId: integer("qurancom_id"), // quran.com/QDC ID
});

// ── Alışkanlık / Okuma ───────────────────────────────────

export const readingSessions = sqliteTable(
  "reading_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    pagesRead: integer("pages_read").notNull().default(0),
    ayahsRead: integer("ayahs_read").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    startPage: integer("start_page"),
    endPage: integer("end_page"),
  },
  (table) => [
    index("sessions_user_date_idx").on(table.userId, table.date),
  ],
);

export const hatims = sqliteTable(
  "hatims",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    lastPage: integer("last_page").notNull().default(1),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
  },
  (table) => [
    index("hatims_user_active_idx").on(table.userId, table.isActive),
  ],
);

export const readingGoals = sqliteTable("reading_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  dailyTargetPages: integer("daily_target_pages").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
