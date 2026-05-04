import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { translationSources } from "~/db/quran-schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/v1/translation-sources
 * Returns available translation sources, defaults first
 */
export const Route = createFileRoute("/api/v1/translation-sources")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db
          .select()
          .from(translationSources)
          .orderBy(desc(translationSources.isDefault));

        return new Response(JSON.stringify(rows), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
