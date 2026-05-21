import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth";
import { db } from "~/db";
import {
  userSettings,
  readingPosition,
  bookmarks as bookmarksTable,
  syncMetadata,
} from "~/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

/**
 * POST /api/v1/sync/push — Push client changes to server (LWW)
 * GET  /api/v1/sync/pull  — Pull latest server state
 */
export const Route = createFileRoute("/api/v1/sync")({
  server: {
    handlers: {
      // Pull: GET /api/v1/sync
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Settings
        const [settingsRow] = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, userId))
          .limit(1);

        const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

        // Reading positions
        const positions = await db
          .select()
          .from(readingPosition)
          .where(eq(readingPosition.userId, userId))
          .orderBy(desc(readingPosition.updatedAt))
          .limit(5);

        // Bookmarks (not deleted)
        const bookmarks = await db
          .select()
          .from(bookmarksTable)
          .where(
            and(
              eq(bookmarksTable.userId, userId),
              isNull(bookmarksTable.deletedAt),
            ),
          );

        // Version
        const [meta] = await db
          .select()
          .from(syncMetadata)
          .where(eq(syncMetadata.userId, userId))
          .limit(1);

        const result = {
          version: meta?.version ?? 0,
          settings,
          bookmarks: bookmarks.map((b) => ({
            surahId: b.surahId,
            ayahNumber: b.ayahNumber,
            pageNumber: b.pageNumber ?? 0,
            createdAt: b.createdAt ?? Date.now(),
          })),
          readingPositions: positions.map((p) => ({
            surahId: p.surahId,
            ayahNumber: p.ayahNumber,
            pageNumber: p.pageNumber,
          })),
        };

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },

      // Push: POST /api/v1/sync
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;
        const body = await request.json();

        // Save reading positions
        if (body.readingPositions?.length > 0) {
          for (const pos of body.readingPositions) {
            await db
              .insert(readingPosition)
              .values({
                userId,
                surahId: pos.surahId,
                ayahNumber: pos.ayahNumber,
                pageNumber: pos.pageNumber,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [readingPosition.userId, readingPosition.surahId],
                set: {
                  ayahNumber: pos.ayahNumber,
                  pageNumber: pos.pageNumber,
                  updatedAt: new Date(),
                },
              });
          }
        }

        // Save bookmarks
        if (body.bookmarks?.length > 0) {
          for (const bm of body.bookmarks) {
            if (bm.deleted) {
              await db
                .update(bookmarksTable)
                .set({ deletedAt: Date.now() })
                .where(
                  and(
                    eq(bookmarksTable.userId, userId),
                    eq(bookmarksTable.surahId, bm.surahId),
                    eq(bookmarksTable.ayahNumber, bm.ayahNumber),
                  ),
                );
            } else {
              await db
                .insert(bookmarksTable)
                .values({
                  userId,
                  surahId: bm.surahId,
                  ayahNumber: bm.ayahNumber,
                  pageNumber: bm.pageNumber,
                  createdAt: bm.createdAt,
                })
                .onConflictDoNothing();
            }
          }
        }

        // Save settings
        if (body.settings && Object.keys(body.settings).length > 0) {
          const [existing] = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

          const merged = existing ? JSON.parse(existing.data) : {};
          for (const [key, val] of Object.entries(body.settings)) {
            merged[key] = (val as any).value;
          }

          if (existing) {
            await db
              .update(userSettings)
              .set({ data: JSON.stringify(merged), updatedAt: new Date() })
              .where(eq(userSettings.userId, userId));
          } else {
            await db.insert(userSettings).values({
              userId,
              data: JSON.stringify(merged),
              updatedAt: new Date(),
            });
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
