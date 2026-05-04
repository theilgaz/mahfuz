import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { ayahs } from "~/db/quran-schema";
import { eq, asc } from "drizzle-orm";

export const Route = createFileRoute("/api/v1/surahs/$surahId/ayahs")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { surahId: string } }) => {
        const surahId = Number(params.surahId);
        if (!surahId || surahId < 1 || surahId > 114) {
          return new Response(JSON.stringify({ error: "Invalid surahId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const rows = await db
          .select()
          .from(ayahs)
          .where(eq(ayahs.surahId, surahId))
          .orderBy(asc(ayahs.ayahNumber));
        return new Response(JSON.stringify(rows), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
