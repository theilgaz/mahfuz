import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { surahs, ayahs, translations, translationSources } from "~/db/quran-schema";
import { eq, and, asc } from "drizzle-orm";

/**
 * GET /api/v1/daily-verse
 * Returns a deterministic verse-of-the-day with translation and surah info
 */
export const Route = createFileRoute("/api/v1/daily-verse")({
  server: {
    handlers: {
      GET: async () => {
        const TOTAL_VERSES = 6236;
        const dayIndex = Math.floor(Date.now() / 86_400_000);
        const verseOffset = dayIndex % TOTAL_VERSES;

        // Fetch verse and translation source in parallel
        const [verseResult, sourceResult] = await Promise.all([
          db.select().from(ayahs).orderBy(asc(ayahs.id)).limit(1).offset(verseOffset),
          db.select().from(translationSources).where(eq(translationSources.isDefault, true)),
        ]);

        const [verse] = verseResult;
        const [source] = sourceResult;

        if (!verse) {
          return new Response(JSON.stringify(null), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Fetch translation and surah info in parallel
        const [translationResult, surahResult] = await Promise.all([
          source
            ? db.select().from(translations).where(
                and(
                  eq(translations.surahId, verse.surahId),
                  eq(translations.ayahNumber, verse.ayahNumber),
                  eq(translations.sourceId, source.id),
                ),
              )
            : Promise.resolve([]),
          db.select().from(surahs).where(eq(surahs.id, verse.surahId)),
        ]);

        const [translation] = translationResult;
        const [surah] = surahResult;

        const result = {
          verse,
          translation: translation ?? null,
          surah: surah ?? null,
        };

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
