/**
 * Unified sync service — push/pull with per-field LWW.
 * Replaces reading-service + settings-service for cross-device sync.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import {
  userSettings,
  readingPosition,
  bookmarks as bookmarksTable,
  syncMetadata,
} from "~/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────

export interface SettingsFields {
  theme?: string;
  textStyle?: string;
  translationSlugs?: string[];
  showTranslation?: boolean;
  showTranslit?: boolean;
  showTajweed?: boolean;
  readingMode?: string;
  surahListFilter?: string;
  reciterSlug?: string;
  arabicFontSize?: number;
  translationFontSize?: number;
  locale?: string;
}

export interface BookmarkChange {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
  createdAt: number; // epoch ms
  deleted?: boolean;
}

export interface HifzChange {
  surahId: number;
  verses: number[];
  ts: number; // epoch ms
}

export interface ReadingPos {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
}

export interface PushInput {
  userId: string;
  settings?: Record<string, { value: any; ts: number }>;
  hifz?: HifzChange[];
  bookmarks?: BookmarkChange[];
  readingPositions?: ReadingPos[];
}

export interface PullResult {
  version: number;
  settings: SettingsFields;
  hifzMemorized: Record<number, number[]>;
  bookmarks: Array<{
    surahId: number;
    ayahNumber: number;
    pageNumber: number;
    createdAt: number;
  }>;
  readingPositions: ReadingPos[];
}

// ── Push (client → server) ───────────────────────────────

export const pushChanges = createServerFn({ method: "POST" })
  .inputValidator((input: PushInput) => input)
  .handler(async ({ data }) => {
    const { userId } = data;
    const now = new Date();

    // Load or create sync metadata
    let [meta] = await db
      .select()
      .from(syncMetadata)
      .where(eq(syncMetadata.userId, userId))
      .limit(1);

    const serverTimestamps: Record<string, number> = meta
      ? JSON.parse(meta.fieldTimestamps)
      : {};

    // ── Settings: per-field LWW ────────────────────────

    if (data.settings && Object.keys(data.settings).length > 0) {
      // Load current settings blob
      const [settingsRow] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      const currentData: Record<string, any> = settingsRow
        ? JSON.parse(settingsRow.data)
        : {};
      const currentFieldTs: Record<string, number> = settingsRow?.fieldTimestamps
        ? JSON.parse(settingsRow.fieldTimestamps)
        : {};

      let changed = false;
      for (const [field, { value, ts }] of Object.entries(data.settings)) {
        const serverTs = currentFieldTs[field] ?? 0;
        if (ts > serverTs) {
          currentData[field] = value;
          currentFieldTs[field] = ts;
          serverTimestamps[`settings.${field}`] = ts;
          changed = true;
        }
      }

      if (changed) {
        if (settingsRow) {
          await db
            .update(userSettings)
            .set({
              data: JSON.stringify(currentData),
              fieldTimestamps: JSON.stringify(currentFieldTs),
              updatedAt: now,
            })
            .where(eq(userSettings.userId, userId));
        } else {
          await db.insert(userSettings).values({
            userId,
            data: JSON.stringify(currentData),
            fieldTimestamps: JSON.stringify(currentFieldTs),
            updatedAt: now,
          });
        }
      }
    }

    // ── Hifz: per-surah LWW ───────────────────────────

    if (data.hifz && data.hifz.length > 0) {
      const [settingsRow] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      const currentData: Record<string, any> = settingsRow
        ? JSON.parse(settingsRow.data)
        : {};
      const currentFieldTs: Record<string, number> = settingsRow?.fieldTimestamps
        ? JSON.parse(settingsRow.fieldTimestamps)
        : {};
      const hifz: Record<number, number[]> = currentData.hifzMemorized ?? {};

      let changed = false;
      for (const { surahId, verses, ts } of data.hifz) {
        const key = `hifz.${surahId}`;
        const serverTs = currentFieldTs[key] ?? 0;
        if (ts > serverTs) {
          if (verses.length > 0) {
            hifz[surahId] = verses;
          } else {
            delete hifz[surahId];
          }
          currentFieldTs[key] = ts;
          serverTimestamps[key] = ts;
          changed = true;
        }
      }

      if (changed) {
        currentData.hifzMemorized = hifz;
        if (settingsRow) {
          await db
            .update(userSettings)
            .set({
              data: JSON.stringify(currentData),
              fieldTimestamps: JSON.stringify(currentFieldTs),
              updatedAt: now,
            })
            .where(eq(userSettings.userId, userId));
        } else {
          await db.insert(userSettings).values({
            userId,
            data: JSON.stringify(currentData),
            fieldTimestamps: JSON.stringify(currentFieldTs),
            updatedAt: now,
          });
        }
      }
    }

    // ── Bookmarks: upsert with soft-delete ────────────

    if (data.bookmarks && data.bookmarks.length > 0) {
      for (const bm of data.bookmarks) {
        const [existing] = await db
          .select()
          .from(bookmarksTable)
          .where(
            and(
              eq(bookmarksTable.userId, userId),
              eq(bookmarksTable.surahId, bm.surahId),
              eq(bookmarksTable.ayahNumber, bm.ayahNumber),
            ),
          )
          .limit(1);

        if (existing) {
          // LWW: accept if client timestamp is newer
          if (bm.createdAt > existing.createdAt) {
            await db
              .update(bookmarksTable)
              .set({
                pageNumber: bm.pageNumber,
                createdAt: bm.createdAt,
                deletedAt: bm.deleted ? bm.createdAt : null,
              })
              .where(eq(bookmarksTable.id, existing.id));
          } else if (bm.deleted && !existing.deletedAt) {
            // Soft-delete even if timestamp is same
            await db
              .update(bookmarksTable)
              .set({ deletedAt: bm.createdAt })
              .where(eq(bookmarksTable.id, existing.id));
          }
        } else if (!bm.deleted) {
          await db.insert(bookmarksTable).values({
            userId,
            surahId: bm.surahId,
            ayahNumber: bm.ayahNumber,
            pageNumber: bm.pageNumber,
            createdAt: bm.createdAt,
            deletedAt: null,
          });
        }
      }
    }

    // ── Reading positions: simple upsert, max 5 ──────

    if (data.readingPositions && data.readingPositions.length > 0) {
      for (const pos of data.readingPositions) {
        const [existing] = await db
          .select({ id: readingPosition.id })
          .from(readingPosition)
          .where(
            and(
              eq(readingPosition.userId, userId),
              eq(readingPosition.surahId, pos.surahId),
            ),
          )
          .limit(1);

        if (existing) {
          await db
            .update(readingPosition)
            .set({
              ayahNumber: pos.ayahNumber,
              pageNumber: pos.pageNumber,
              updatedAt: now,
            })
            .where(eq(readingPosition.id, existing.id));
        } else {
          await db.insert(readingPosition).values({
            userId,
            surahId: pos.surahId,
            ayahNumber: pos.ayahNumber,
            pageNumber: pos.pageNumber,
            updatedAt: now,
          });

          // Cleanup: keep max 5
          const all = await db
            .select({ id: readingPosition.id })
            .from(readingPosition)
            .where(eq(readingPosition.userId, userId))
            .orderBy(desc(readingPosition.updatedAt));

          if (all.length > 5) {
            for (const row of all.slice(5)) {
              await db
                .delete(readingPosition)
                .where(eq(readingPosition.id, row.id));
            }
          }
        }
      }
    }

    // ── Update sync metadata version ──────────────────

    const newVersion = (meta?.version ?? 0) + 1;
    if (meta) {
      await db
        .update(syncMetadata)
        .set({
          version: newVersion,
          fieldTimestamps: JSON.stringify(serverTimestamps),
          updatedAt: now,
        })
        .where(eq(syncMetadata.userId, userId));
    } else {
      await db.insert(syncMetadata).values({
        userId,
        version: newVersion,
        fieldTimestamps: JSON.stringify(serverTimestamps),
        updatedAt: now,
      });
    }

    return { version: newVersion };
  });

// ── Pull (server → client) ──────────────────────────────

export const pullChanges = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: string; clientVersion: number }) => input)
  .handler(async ({ data: { userId, clientVersion } }): Promise<PullResult | null> => {
    // Check version
    const [meta] = await db
      .select()
      .from(syncMetadata)
      .where(eq(syncMetadata.userId, userId))
      .limit(1);

    const serverVersion = meta?.version ?? 0;

    // Up-to-date — nothing to send
    if (serverVersion > 0 && clientVersion >= serverVersion) {
      return null;
    }

    // Load full snapshot
    const [settingsRow] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const settingsData: Record<string, any> = settingsRow
      ? JSON.parse(settingsRow.data)
      : {};

    // Extract settings fields (exclude hifz/bookmarks from blob)
    const settings: SettingsFields = {};
    const SETTINGS_KEYS = [
      "theme", "textStyle", "translationSlugs", "showTranslation",
      "showTranslit", "showTajweed",
      "readingMode", "surahListFilter", "reciterSlug",
      "arabicFontSize", "translationFontSize", "locale",
    ] as const;
    for (const key of SETTINGS_KEYS) {
      if (settingsData[key] !== undefined) {
        (settings as any)[key] = settingsData[key];
      }
    }

    // Hifz from blob
    const hifzMemorized: Record<number, number[]> =
      settingsData.hifzMemorized ?? {};

    // Bookmarks from table (non-deleted only)
    const bookmarkRows = await db
      .select({
        surahId: bookmarksTable.surahId,
        ayahNumber: bookmarksTable.ayahNumber,
        pageNumber: bookmarksTable.pageNumber,
        createdAt: bookmarksTable.createdAt,
      })
      .from(bookmarksTable)
      .where(and(eq(bookmarksTable.userId, userId), isNull(bookmarksTable.deletedAt)));

    // Also check legacy bookmarks in the blob (migration)
    const legacyBookmarks: BookmarkChange[] = settingsData.bookmarks ?? [];
    if (legacyBookmarks.length > 0 && bookmarkRows.length === 0) {
      // Migrate legacy bookmarks to table
      for (const bm of legacyBookmarks) {
        await db.insert(bookmarksTable).values({
          userId,
          surahId: bm.surahId,
          ayahNumber: bm.ayahNumber,
          pageNumber: bm.pageNumber,
          createdAt: bm.createdAt,
          deletedAt: null,
        }).onConflictDoNothing();
      }
      // Remove from blob
      delete settingsData.bookmarks;
      if (settingsRow) {
        await db
          .update(userSettings)
          .set({ data: JSON.stringify(settingsData), updatedAt: new Date() })
          .where(eq(userSettings.userId, userId));
      }
      // Re-fetch after migration
      const migratedRows = await db
        .select({
          surahId: bookmarksTable.surahId,
          ayahNumber: bookmarksTable.ayahNumber,
          pageNumber: bookmarksTable.pageNumber,
          createdAt: bookmarksTable.createdAt,
        })
        .from(bookmarksTable)
        .where(and(eq(bookmarksTable.userId, userId), isNull(bookmarksTable.deletedAt)));

      return {
        version: serverVersion || 1,
        settings,
        hifzMemorized,
        bookmarks: migratedRows,
        readingPositions: await getPositions(userId),
      };
    }

    return {
      version: serverVersion || 1,
      settings,
      hifzMemorized,
      bookmarks: bookmarkRows,
      readingPositions: await getPositions(userId),
    };
  });

// ── Helper ───────────────────────────────────────────────

async function getPositions(userId: string): Promise<ReadingPos[]> {
  return db
    .select({
      surahId: readingPosition.surahId,
      ayahNumber: readingPosition.ayahNumber,
      pageNumber: readingPosition.pageNumber,
    })
    .from(readingPosition)
    .where(eq(readingPosition.userId, userId))
    .orderBy(desc(readingPosition.updatedAt))
    .limit(5);
}
