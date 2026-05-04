import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { surahs, ayahs, translations, translationSources } from "~/db/quran-schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";

/**
 * GET /api/v1/pages/:pageNumber?translations=slug1,slug2
 * Returns page data with surah groups and translations
 */
export const Route = createFileRoute("/api/v1/pages/$pageNumber")({
  server: {
    handlers: {
      GET: async ({ params, request }: { params: { pageNumber: string }; request: Request }) => {
        const pageNumber = Number(params.pageNumber);
        if (!pageNumber || pageNumber < 1 || pageNumber > 604) {
          return new Response(JSON.stringify({ error: "Invalid pageNumber (1-604)" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const slugsParam = url.searchParams.get("translations");
        const translationSlugs = slugsParam
          ? slugsParam.split(",")
          : [DEFAULT_TRANSLATION_SLUG];

        const pageAyahs = await db
          .select()
          .from(ayahs)
          .where(eq(ayahs.pageNumber, pageNumber))
          .orderBy(asc(ayahs.surahId), asc(ayahs.ayahNumber));

        if (pageAyahs.length === 0) {
          return new Response(JSON.stringify({ error: "Page not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const surahIds = [...new Set(pageAyahs.map((a) => a.surahId))];
        const surahList = await db
          .select()
          .from(surahs)
          .where(inArray(surahs.id, surahIds));
        const surahMap = new Map(surahList.map((s) => [s.id, s]));

        // Translations
        const sources = await db
          .select()
          .from(translationSources)
          .where(inArray(translationSources.slug, translationSlugs));

        const translationMaps = new Map<string, Map<string, string>>();
        if (sources.length > 0) {
          const sourceIds = sources.map((s) => s.id);
          const ayahNumbers = [...new Set(pageAyahs.map((a) => a.ayahNumber))];
          const trans = await db
            .select()
            .from(translations)
            .where(
              and(
                inArray(translations.surahId, surahIds),
                inArray(translations.sourceId, sourceIds),
                inArray(translations.ayahNumber, ayahNumbers),
              ),
            );
          const sourceIdToSlug = new Map(sources.map((s) => [s.id, s.slug]));
          for (const t of trans) {
            const slug = sourceIdToSlug.get(t.sourceId)!;
            let map = translationMaps.get(slug);
            if (!map) { map = new Map(); translationMaps.set(slug, map); }
            map.set(`${t.surahId}:${t.ayahNumber}`, t.text);
          }
        }

        // Build surah groups
        const surahGroups: Array<{
          surah: typeof surahList[0];
          ayahs: Array<{
            id: number;
            surahId: number;
            ayahNumber: number;
            textUthmani: string;
            translation: string | null;
            translations: Record<string, string>;
            juzNumber: number;
            hizbNumber: number;
            sajdah: boolean;
          }>;
          isStart: boolean;
        }> = [];

        let currentSurahId = -1;
        let currentGroup: (typeof surahGroups)[0] | null = null;

        for (const ayah of pageAyahs) {
          if (ayah.surahId !== currentSurahId) {
            currentSurahId = ayah.surahId;
            currentGroup = {
              surah: surahMap.get(ayah.surahId)!,
              ayahs: [],
              isStart: ayah.ayahNumber === 1,
            };
            surahGroups.push(currentGroup);
          }

          const key = `${ayah.surahId}:${ayah.ayahNumber}`;
          const allTranslations: Record<string, string> = {};
          for (const [slug, map] of translationMaps) {
            const text = map.get(key);
            if (text) allTranslations[slug] = text;
          }

          currentGroup!.ayahs.push({
            id: ayah.id!,
            surahId: ayah.surahId,
            ayahNumber: ayah.ayahNumber,
            textUthmani: ayah.textUthmani,
            translation: allTranslations[translationSlugs[0]] ?? null,
            translations: allTranslations,
            juzNumber: ayah.juzNumber,
            hizbNumber: ayah.hizbNumber,
            sajdah: !!ayah.sajdah,
          });
        }

        const result = {
          pageNumber,
          juzNumber: pageAyahs[0].juzNumber,
          surahGroups,
          totalAyahs: pageAyahs.length,
        };

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
