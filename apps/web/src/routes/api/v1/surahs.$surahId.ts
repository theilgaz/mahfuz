import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { surahs, ayahs, translations, translationSources } from "~/db/quran-schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";

/**
 * GET /api/v1/surahs/:surahId?translations=slug1,slug2
 * Returns surah metadata + ayahs with translations
 */
export const Route = createFileRoute("/api/v1/surahs/$surahId")({
  server: {
    handlers: {
      GET: async ({ params, request }: { params: { surahId: string }; request: Request }) => {
        const surahId = Number(params.surahId);
        if (!surahId || surahId < 1 || surahId > 114) {
          return new Response(JSON.stringify({ error: "Invalid surahId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const slugsParam = url.searchParams.get("translations");
        const translationSlugs = slugsParam
          ? slugsParam.split(",")
          : [DEFAULT_TRANSLATION_SLUG];

        const [surah] = await db.select().from(surahs).where(eq(surahs.id, surahId));
        if (!surah) {
          return new Response(JSON.stringify({ error: "Surah not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const surahAyahs = await db
          .select()
          .from(ayahs)
          .where(eq(ayahs.surahId, surahId))
          .orderBy(asc(ayahs.ayahNumber));

        // Fetch translation sources
        const sources = await db
          .select()
          .from(translationSources)
          .where(inArray(translationSources.slug, translationSlugs));

        const translationMaps = new Map<string, Map<number, string>>();

        if (sources.length > 0) {
          const sourceIds = sources.map((s) => s.id);
          const trans = await db
            .select()
            .from(translations)
            .where(
              and(
                eq(translations.surahId, surahId),
                inArray(translations.sourceId, sourceIds),
              ),
            );

          const sourceIdToSlug = new Map(sources.map((s) => [s.id, s.slug]));
          for (const t of trans) {
            const slug = sourceIdToSlug.get(t.sourceId)!;
            let map = translationMaps.get(slug);
            if (!map) { map = new Map(); translationMaps.set(slug, map); }
            map.set(t.ayahNumber, t.text);
          }
        }

        const result = {
          surah,
          ayahs: surahAyahs.map((a) => {
            const allTranslations: Record<string, string> = {};
            for (const [slug, map] of translationMaps) {
              const text = map.get(a.ayahNumber);
              if (text) allTranslations[slug] = text;
            }
            return {
              id: a.id,
              surahId: a.surahId,
              ayahNumber: a.ayahNumber,
              textUthmani: a.textUthmani,
              translation: allTranslations[translationSlugs[0]] ?? null,
              translations: allTranslations,
              pageNumber: a.pageNumber,
              juzNumber: a.juzNumber,
              hizbNumber: a.hizbNumber,
              sajdah: !!a.sajdah,
            };
          }),
        };

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
