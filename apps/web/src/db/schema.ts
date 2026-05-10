import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ── Better Auth tabloları ────────────────────────────────
// (apps/legacy ile aynı — auth sistemi paylaşılıyor)

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ── Kullanıcı ayarları ────────────────────────────────────

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** JSON blob — tüm ayarlar tek sütunda */
  data: text("data").notNull().default("{}"),
  /** Alan bazlı LWW zaman damgaları: { "theme": 1711000000000, ... } */
  fieldTimestamps: text("field_timestamps").notNull().default("{}"),
  /** Liderlik tablosu / şampiyonlarda görünecek isim modu: full | initials | anonymous */
  displayNameMode: text("display_name_mode").notNull().default("full"),
  /** Kullanıcının içinde bulunduğu lig: bronz | gumus | altin | hafiz */
  currentLeague: text("current_league").notNull().default("bronz"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ── Okuma konumu ─────────────────────────────────────────

export const readingPosition = sqliteTable("reading_position", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  pageNumber: integer("page_number").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ── Yer imleri (satır bazlı, soft-delete ile sync) ───────

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    surahId: integer("surah_id").notNull(),
    ayahNumber: integer("ayah_number").notNull(),
    pageNumber: integer("page_number").notNull(),
    createdAt: integer("created_at").notNull(), // epoch ms, client-set
    deletedAt: integer("deleted_at"), // epoch ms — soft delete for sync
  },
  (table) => [
    index("bookmarks_user_idx").on(table.userId),
    index("bookmarks_user_verse_idx").on(table.userId, table.surahId, table.ayahNumber),
  ],
);

// ── Sync metadata (versiyon + alan zaman damgaları) ──────

export const syncMetadata = sqliteTable("sync_metadata", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Her push'ta artan versiyon sayacı */
  version: integer("version").notNull().default(0),
  /** Alan bazlı zaman damgaları: { "settings.theme": ts, "hifz.36": ts, ... } */
  fieldTimestamps: text("field_timestamps").notNull().default("{}"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
