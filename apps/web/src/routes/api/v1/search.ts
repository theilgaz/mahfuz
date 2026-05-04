import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";
import { db } from "~/db";
import { ayahs, surahs, translations, translationSources } from "~/db/quran-schema";
import { eq, like, and, inArray } from "drizzle-orm";

/**
 * GET /api/v1/search?q=query&limit=20
 * Searches ayahs and translations
 */
export const Route = createFileRoute("/api/v1/search")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get("q")?.trim() ?? "";
        const limit = Math.min(50, Number(url.searchParams.get("limit")) || 20);

        if (query.length < 2) {
          return new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const results: Array<{
          surahId: number;
          ayahNumber: number;
          surahNameSimple: string;
          textUthmani: string;
          translation: string | null;
          pageNumber: number;
        }> = [];

        // Verse reference (e.g., "2:255")
        const refMatch = query.match(/^(\d{1,3})\s*[:./]\s*(\d{1,3})$/);
        if (refMatch) {
          const surahId = parseInt(refMatch[1], 10);
          const ayahNumber = parseInt(refMatch[2], 10);

          const rows = await db
            .select({
              surahId: ayahs.surahId,
              ayahNumber: ayahs.ayahNumber,
              textUthmani: ayahs.textUthmani,
              pageNumber: ayahs.pageNumber,
              surahNameSimple: surahs.nameSimple,
            })
            .from(ayahs)
            .innerJoin(surahs, eq(surahs.id, ayahs.surahId))
            .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNumber)))
            .limit(1);

          for (const r of rows) {
            results.push({ ...r, translation: null });
          }

          return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Translation text search
        const [source] = await db
          .select()
          .from(translationSources)
          .where(eq(translationSources.slug, DEFAULT_TRANSLATION_SLUG))
          .limit(1);

        if (source) {
          const transResults = await db
            .select({
              surahId: translations.surahId,
              ayahNumber: translations.ayahNumber,
              text: translations.text,
            })
            .from(translations)
            .where(
              and(
                eq(translations.sourceId, source.id),
                like(translations.text, `%${query}%`),
              ),
            )
            .limit(limit);

          if (transResults.length > 0) {
            const surahIds = [...new Set(transResults.map((t) => t.surahId))];
            const surahList = await db
              .select()
              .from(surahs)
              .where(inArray(surahs.id, surahIds));
            const surahMap = new Map(surahList.map((s) => [s.id, s]));

            // Batch-fetch all ayah texts in one query
            const ayahRows = await db
              .select()
              .from(ayahs)
              .where(inArray(ayahs.surahId, surahIds));
            const ayahMap = new Map(
              ayahRows.map((a) => [`${a.surahId}:${a.ayahNumber}`, a]),
            );

            for (const tr of transResults) {
              const ayah = ayahMap.get(`${tr.surahId}:${tr.ayahNumber}`);
              results.push({
                surahId: tr.surahId,
                ayahNumber: tr.ayahNumber,
                surahNameSimple: surahMap.get(tr.surahId)?.nameSimple ?? "",
                textUthmani: ayah?.textUthmani ?? "",
                translation: tr.text,
                pageNumber: ayah?.pageNumber ?? 0,
              });
            }
          }
        }

        return new Response(JSON.stringify(results), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
