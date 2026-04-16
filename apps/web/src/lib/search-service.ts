/**
 * Arama servisi — ayetlerde ve meallerde arama yapar.
 * JOIN-based: N+1 sorgu yok.
 */

import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";
import { db } from "~/db";
import { ayahs, surahs, translations, translationSources } from "~/db/quran-schema";
import { eq, like, and, inArray } from "drizzle-orm";

export interface SearchResult {
  surahId: number;
  ayahNumber: number;
  surahNameArabic: string;
  surahNameSimple: string;
  textUthmani: string;
  translation: string | null;
  pageNumber: number;
  /** Sonuç tipi: "surah" = sure eşleşmesi, "translation" = meal, "arabic" = Arapça metin */
  matchType: "surah" | "translation" | "arabic";
}

/** Diacritics ve özel karakterleri kaldır — fuzzy sure adı eşleşmesi için */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/['-]/g, "")           // tire, apostrof
    .replace(/\s+/g, "");           // boşluklar
}

/** Sure adı eşleşme alternatifleri */
const SURAH_ALIASES: Record<number, string[]> = {
  1: ["fatiha", "fateha", "opening"],
  2: ["bakara", "baqara", "baqarah", "cow"],
  36: ["yasin", "yaseen", "yasen"],
  55: ["rahman", "arrahman"],
  56: ["vakia", "waqia", "waqiah", "vakıa"],
  67: ["mulk", "muluk", "mülk"],
  78: ["nebe", "naba"],
  112: ["ihlas", "ikhlas"],
  113: ["felak", "falaq"],
  114: ["nas", "naas"],
};

export const searchQuran = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string; translationSlug?: string; limit?: number }) => input)
  .handler(async ({ data: { query, translationSlug = DEFAULT_TRANSLATION_SLUG, limit = 30 } }) => {
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

    // Sure adı araması — normalize ile fuzzy eşleşme
    const normalizedQuery = normalizeForSearch(trimmed);

    // 1) DB'den LIKE ile
    const surahNameHits = await db
      .select({
        surahId: surahs.id,
        surahNameArabic: surahs.nameArabic,
        surahNameSimple: surahs.nameSimple,
      })
      .from(surahs)
      .where(like(surahs.nameSimple, `%${trimmed}%`))
      .limit(5);

    // 2) Alias eşleşmesi (yaseen, mulk, vakia vs.)
    const aliasMatches: number[] = [];
    for (const [id, aliases] of Object.entries(SURAH_ALIASES)) {
      if (aliases.some((a) => a.includes(normalizedQuery) || normalizedQuery.includes(a))) {
        aliasMatches.push(Number(id));
      }
    }

    // 3) Normalize ile nameSimple eşleşmesi
    if (surahNameHits.length === 0 && aliasMatches.length === 0 && normalizedQuery.length >= 3) {
      const allSurahs = await db.select({ id: surahs.id, nameSimple: surahs.nameSimple, nameArabic: surahs.nameArabic }).from(surahs);
      for (const s of allSurahs) {
        if (normalizeForSearch(s.nameSimple).includes(normalizedQuery)) {
          surahNameHits.push({ surahId: s.id, surahNameArabic: s.nameArabic, surahNameSimple: s.nameSimple });
        }
      }
    }

    // Alias match'leri de ekle
    if (aliasMatches.length > 0) {
      const aliasRows = await db.select({ surahId: surahs.id, surahNameArabic: surahs.nameArabic, surahNameSimple: surahs.nameSimple }).from(surahs)
        .where(inArray(surahs.id, aliasMatches));
      for (const r of aliasRows) {
        if (!surahNameHits.some((h) => h.surahId === r.surahId)) {
          surahNameHits.push(r);
        }
      }
    }

    const results: SearchResult[] = [];
    const seenKeys = new Set<string>();

    // Sure sonuçlarını oluştur
    if (surahNameHits.length > 0) {
      const surahResults: SearchResult[] = [];

      for (const s of surahNameHits.slice(0, 5)) {
        const [firstAyah] = await db
          .select({ ayahNumber: ayahs.ayahNumber, textUthmani: ayahs.textUthmani, pageNumber: ayahs.pageNumber })
          .from(ayahs)
          .where(and(eq(ayahs.surahId, s.surahId), eq(ayahs.ayahNumber, 1)))
          .limit(1);

        if (firstAyah) {
          surahResults.push({
            surahId: s.surahId, ayahNumber: firstAyah.ayahNumber,
            surahNameArabic: s.surahNameArabic, surahNameSimple: s.surahNameSimple,
            textUthmani: firstAyah.textUthmani, translation: null,
            pageNumber: firstAyah.pageNumber, matchType: "surah",
          });
        }
      }

      // Sure eşleşmesi varsa ama tek sonuçsa, devam et meal aramasına da
      if (surahResults.length > 0 && surahResults.length >= 3) return surahResults;
      // Az sonuç varsa devam et, meal sonuçlarıyla birleştir
      results.push(...surahResults);
      for (const r of surahResults) seenKeys.add(`${r.surahId}:${r.ayahNumber}`);
    }

    const pattern = `%${trimmed}%`;

    // Meal kaynak ID'sini bul
    const [source] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.slug, translationSlug));

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
          matchType: "translation",
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
          matchType: "arabic",
        });
      }
    }

    return results;
  });
