/**
 * Arama servisi — ayetlerde ve meallerde arama yapar.
 * JOIN-based: N+1 sorgu yok.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { ayahs, surahs, translations, translationSources } from "~/db/quran-schema";
import { eq, like, and, inArray } from "drizzle-orm";

interface SearchResult {
  surahId: number;
  ayahNumber: number;
  surahNameArabic: string;
  surahNameSimple: string;
  textUthmani: string;
  translation: string | null;
  pageNumber: number;
}

export const searchQuran = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string; translationSlug?: string; limit?: number }) => input)
  .handler(async ({ data: { query, translationSlug = "omer-celik", limit = 30 } }) => {
    if (!query || query.trim().length < 2) return [];

    const trimmed = query.trim();

    // Sure:ayet referansı algıla (ör: "33:35", "2:255", "1/5")
    const refMatch = trimmed.match(/^(\d{1,3})\s*[:./]\s*(\d{1,3})$/);
    if (refMatch) {
      const surahId = parseInt(refMatch[1], 10);
      const ayahNumber = parseInt(refMatch[2], 10);

      if (surahId >= 1 && surahId <= 114) {
        const [source] = await db
          .select()
          .from(translationSources)
          .where(eq(translationSources.slug, translationSlug));

        const directHits = await db
          .select({
            surahId: ayahs.surahId,
            ayahNumber: ayahs.ayahNumber,
            textUthmani: ayahs.textUthmani,
            pageNumber: ayahs.pageNumber,
            surahNameArabic: surahs.nameArabic,
            surahNameSimple: surahs.nameSimple,
          })
          .from(ayahs)
          .innerJoin(surahs, eq(surahs.id, ayahs.surahId))
          .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNumber)))
          .limit(1);

        if (directHits.length > 0) {
          const hit = directHits[0];
          let translation: string | null = null;

          if (source) {
            const [trans] = await db
              .select({ text: translations.text })
              .from(translations)
              .where(
                and(
                  eq(translations.sourceId, source.id),
                  eq(translations.surahId, surahId),
                  eq(translations.ayahNumber, ayahNumber),
                ),
              )
              .limit(1);
            translation = trans?.text ?? null;
          }

          return [{
            surahId: hit.surahId,
            ayahNumber: hit.ayahNumber,
            surahNameArabic: hit.surahNameArabic,
            surahNameSimple: hit.surahNameSimple,
            textUthmani: hit.textUthmani,
            translation,
            pageNumber: hit.pageNumber,
          }];
        }

        return [];
      }
    }

    // Sadece sayı — sure numarası (ör: "33", "2", "114")
    const surahNumMatch = trimmed.match(/^(\d{1,3})$/);
    if (surahNumMatch) {
      const surahId = parseInt(surahNumMatch[1], 10);
      if (surahId >= 1 && surahId <= 114) {
        const surahRows = await db
          .select({
            surahId: surahs.id,
            surahNameArabic: surahs.nameArabic,
            surahNameSimple: surahs.nameSimple,
          })
          .from(surahs)
          .where(eq(surahs.id, surahId))
          .limit(1);

        if (surahRows.length > 0) {
          const s = surahRows[0];
          // İlk ayeti getir — sure kartı olarak göster
          const [firstAyah] = await db
            .select({
              ayahNumber: ayahs.ayahNumber,
              textUthmani: ayahs.textUthmani,
              pageNumber: ayahs.pageNumber,
            })
            .from(ayahs)
            .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, 1)))
            .limit(1);

          if (firstAyah) {
            const [source] = await db
              .select()
              .from(translationSources)
              .where(eq(translationSources.slug, translationSlug));

            let translation: string | null = null;
            if (source) {
              const [trans] = await db
                .select({ text: translations.text })
                .from(translations)
                .where(
                  and(
                    eq(translations.sourceId, source.id),
                    eq(translations.surahId, surahId),
                    eq(translations.ayahNumber, 1),
                  ),
                )
                .limit(1);
              translation = trans?.text ?? null;
            }

            return [{
              surahId: s.surahId,
              ayahNumber: firstAyah.ayahNumber,
              surahNameArabic: s.surahNameArabic,
              surahNameSimple: s.surahNameSimple,
              textUthmani: firstAyah.textUthmani,
              translation,
              pageNumber: firstAyah.pageNumber,
            }];
          }
        }
      }
    }

    // Sure adı araması (ör: "fatiha", "bakara", "ahzab")
    const surahNameHits = await db
      .select({
        surahId: surahs.id,
        surahNameArabic: surahs.nameArabic,
        surahNameSimple: surahs.nameSimple,
      })
      .from(surahs)
      .where(like(surahs.nameSimple, `%${trimmed}%`))
      .limit(5);

    if (surahNameHits.length > 0) {
      const surahResults: SearchResult[] = [];

      for (const s of surahNameHits) {
        const [firstAyah] = await db
          .select({
            ayahNumber: ayahs.ayahNumber,
            textUthmani: ayahs.textUthmani,
            pageNumber: ayahs.pageNumber,
          })
          .from(ayahs)
          .where(and(eq(ayahs.surahId, s.surahId), eq(ayahs.ayahNumber, 1)))
          .limit(1);

        if (firstAyah) {
          surahResults.push({
            surahId: s.surahId,
            ayahNumber: firstAyah.ayahNumber,
            surahNameArabic: s.surahNameArabic,
            surahNameSimple: s.surahNameSimple,
            textUthmani: firstAyah.textUthmani,
            translation: null,
            pageNumber: firstAyah.pageNumber,
          });
        }
      }

      if (surahResults.length > 0) return surahResults;
    }

    const pattern = `%${trimmed}%`;

    // Meal kaynak ID'sini bul
    const [source] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.slug, translationSlug));

    const results: SearchResult[] = [];
    const seenKeys = new Set<string>();

    // 1. Mealde ara — JOIN ile tek sorguda ayah + surah + translation
    if (source) {
      const translationHits = await db
        .select({
          surahId: translations.surahId,
          ayahNumber: translations.ayahNumber,
          translationText: translations.text,
          textUthmani: ayahs.textUthmani,
          pageNumber: ayahs.pageNumber,
          surahNameArabic: surahs.nameArabic,
          surahNameSimple: surahs.nameSimple,
        })
        .from(translations)
        .innerJoin(
          ayahs,
          and(
            eq(ayahs.surahId, translations.surahId),
            eq(ayahs.ayahNumber, translations.ayahNumber),
          ),
        )
        .innerJoin(surahs, eq(surahs.id, translations.surahId))
        .where(
          and(
            eq(translations.sourceId, source.id),
            like(translations.text, pattern),
          ),
        )
        .limit(limit);

      for (const hit of translationHits) {
        const key = `${hit.surahId}:${hit.ayahNumber}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        results.push({
          surahId: hit.surahId,
          ayahNumber: hit.ayahNumber,
          surahNameArabic: hit.surahNameArabic,
          surahNameSimple: hit.surahNameSimple,
          textUthmani: hit.textUthmani,
          translation: hit.translationText,
          pageNumber: hit.pageNumber,
        });
      }
    }

    // 2. Arapça metinde ara (simple text — harekesiz) — JOIN ile
    if (results.length < limit) {
      const remaining = limit - results.length;

      const arabicHits = await db
        .select({
          surahId: ayahs.surahId,
          ayahNumber: ayahs.ayahNumber,
          textUthmani: ayahs.textUthmani,
          pageNumber: ayahs.pageNumber,
          surahNameArabic: surahs.nameArabic,
          surahNameSimple: surahs.nameSimple,
        })
        .from(ayahs)
        .innerJoin(surahs, eq(surahs.id, ayahs.surahId))
        .where(like(ayahs.textSimple, pattern))
        .limit(remaining);

      // Bu sonuçlar için meal çekmemiz gerekiyor — toplu olarak
      const needTranslation = arabicHits.filter(
        (h) => !seenKeys.has(`${h.surahId}:${h.ayahNumber}`),
      );

      // Toplu meal çekme — sure ID'lerine göre filtrele
      let translationMap = new Map<string, string>();
      if (source && needTranslation.length > 0) {
        const surahIds = [...new Set(needTranslation.map((h) => h.surahId))];
        const transRows = await db
          .select({
            surahId: translations.surahId,
            ayahNumber: translations.ayahNumber,
            text: translations.text,
          })
          .from(translations)
          .where(
            and(
              eq(translations.sourceId, source.id),
              inArray(translations.surahId, surahIds),
            ),
          );

        for (const row of transRows) {
          translationMap.set(`${row.surahId}:${row.ayahNumber}`, row.text);
        }
      }

      for (const hit of arabicHits) {
        const key = `${hit.surahId}:${hit.ayahNumber}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        results.push({
          surahId: hit.surahId,
          ayahNumber: hit.ayahNumber,
          surahNameArabic: hit.surahNameArabic,
          surahNameSimple: hit.surahNameSimple,
          textUthmani: hit.textUthmani,
          translation: translationMap.get(key) ?? null,
          pageNumber: hit.pageNumber,
        });
      }
    }

    return results;
  });
