/**
 * Quran Data Service — kendi DB'miz primary source.
 *
 * Tüm veri sorguları buradan geçer. İleride quran.com fallback
 * veya CDN cache katmanı eklenebilir, consumer'lar değişmez.
 */

import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";
import { db } from "~/db";
import { surahs, ayahs, translations, translationSources, reciters } from "~/db/quran-schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";

// ── Sureler ──────────────────────────────────────────────

export const getSurahs = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(surahs).orderBy(asc(surahs.id));
});

export const getSurah = createServerFn({ method: "GET" })
  .inputValidator((surahId: number) => surahId)
  .handler(async ({ data: surahId }) => {
    const [result] = await db.select().from(surahs).where(eq(surahs.id, surahId));
    return result ?? null;
  });

// ── Ayetler ──────────────────────────────────────────────

export const getAyahsBySurah = createServerFn({ method: "GET" })
  .inputValidator((surahId: number) => surahId)
  .handler(async ({ data: surahId }) => {
    return db
      .select()
      .from(ayahs)
      .where(eq(ayahs.surahId, surahId))
      .orderBy(asc(ayahs.ayahNumber));
  });

export const getAyahsByPage = createServerFn({ method: "GET" })
  .inputValidator((pageNumber: number) => pageNumber)
  .handler(async ({ data: pageNumber }) => {
    return db
      .select()
      .from(ayahs)
      .where(eq(ayahs.pageNumber, pageNumber))
      .orderBy(asc(ayahs.surahId), asc(ayahs.ayahNumber));
  });

export const getAyahsByJuz = createServerFn({ method: "GET" })
  .inputValidator((juzNumber: number) => juzNumber)
  .handler(async ({ data: juzNumber }) => {
    return db
      .select()
      .from(ayahs)
      .where(eq(ayahs.juzNumber, juzNumber))
      .orderBy(asc(ayahs.surahId), asc(ayahs.ayahNumber));
  });

// ── Meal (sayfa bazlı — tüm sure ID'lerini tek sorguda çeker) ──

export const getTranslationsForPage = createServerFn({ method: "GET" })
  .inputValidator((input: { surahIds: number[]; ayahNumbers: Record<number, number[]>; sourceSlug?: string }) => input)
  .handler(async ({ data: { surahIds, ayahNumbers, sourceSlug = DEFAULT_TRANSLATION_SLUG } }) => {
    const [source] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.slug, sourceSlug));

    if (!source) return [];

    // Sayfadaki tüm surelerin çevirilerini tek sorguda çek
    const results = await db
      .select()
      .from(translations)
      .where(
        and(
          inArray(translations.surahId, surahIds),
          eq(translations.sourceId, source.id),
        ),
      )
      .orderBy(asc(translations.surahId), asc(translations.ayahNumber));

    // Sadece sayfadaki ayet numaralarını filtrele
    return results.filter((t) => {
      const nums = ayahNumbers[t.surahId];
      return nums && nums.includes(t.ayahNumber);
    });
  });

export const getTranslationSources = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(translationSources).orderBy(desc(translationSources.isDefault));
});

// ── Kâriler ──────────────────────────────────────────────

export const getReciters = createServerFn({ method: "GET" }).handler(async () => {
  return db
    .select()
    .from(reciters)
    .where(eq(reciters.isActive, true))
    .orderBy(desc(reciters.isDefault), asc(reciters.name));
});

// ── Sayfa verisini komple getir (ayetler + sureler + mealler) ──

export const getPageData = createServerFn({ method: "GET" })
  .inputValidator((input: { pageNumber: number; translationSlugs?: string[] }) => input)
  .handler(async ({ data: { pageNumber, translationSlugs = [DEFAULT_TRANSLATION_SLUG] } }) => {
    // 1. Sayfadaki ayetleri çek
    const pageAyahs = await db
      .select()
      .from(ayahs)
      .where(eq(ayahs.pageNumber, pageNumber))
      .orderBy(asc(ayahs.surahId), asc(ayahs.ayahNumber));

    if (pageAyahs.length === 0) return null;

    // 2. Sure bilgilerini çek
    const surahIds = [...new Set(pageAyahs.map((a) => a.surahId))];
    const surahList = await db
      .select()
      .from(surahs)
      .where(inArray(surahs.id, surahIds));

    const surahMap = new Map(surahList.map((s) => [s.id, s]));

    // 3. Çoklu çeviri kaynağı çek
    const sources = await db
      .select()
      .from(translationSources)
      .where(inArray(translationSources.slug, translationSlugs));

    // slug → Map<"surahId:ayahNumber", text>
    const translationMaps = new Map<string, Map<string, string>>();

    if (sources.length > 0) {
      const sourceIds = sources.map((s) => s.id);
      const trans = await db
        .select()
        .from(translations)
        .where(
          and(
            inArray(translations.surahId, surahIds),
            inArray(translations.sourceId, sourceIds),
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

    // 4. Sayfadaki sure gruplarını oluştur
    const surahGroups: Array<{
      surah: typeof surahList[0];
      ayahs: Array<{
        id: number;
        surahId: number;
        ayahNumber: number;
        textUthmani: string;
        /** Eski tek-meal uyumluluk (ilk slug) */
        translation: string | null;
        /** Çoklu meal: slug → text */
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
        const surah = surahMap.get(ayah.surahId)!;
        currentGroup = {
          surah,
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

    return {
      pageNumber,
      juzNumber: pageAyahs[0].juzNumber,
      surahGroups,
      totalAyahs: pageAyahs.length,
    };
  });

// ── Günün Ayeti ──────────────────────────────────────────
// Tarihe göre deterministik — gün boyunca aynı ayet, gece yarısı değişir.

export const getDailyVerse = createServerFn({ method: "GET" }).handler(async () => {
  const TOTAL_VERSES = 6236;
  const dayIndex = Math.floor(Date.now() / 86_400_000); // ms → gün sayısı
  const verseOffset = dayIndex % TOTAL_VERSES;

  // Tüm ayetleri id sırasına göre orderla, offset'teki ayeti al
  const [verse] = await db
    .select()
    .from(ayahs)
    .orderBy(asc(ayahs.id))
    .limit(1)
    .offset(verseOffset);

  if (!verse) return null;

  // Türkçe meali çek
  const [source] = await db
    .select()
    .from(translationSources)
    .where(eq(translationSources.isDefault, true));

  const [translation] = source
    ? await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.surahId, verse.surahId),
            eq(translations.ayahNumber, verse.ayahNumber),
            eq(translations.sourceId, source.id),
          ),
        )
    : [];

  const [surah] = await db
    .select()
    .from(surahs)
    .where(eq(surahs.id, verse.surahId));

  return {
    verse,
    translation: translation ?? null,
    surah: surah ?? null,
  };
});

// ── Çoklu Meal (Karşılaştırma için) ─────────────────────

export const getTranslationsForVerse = createServerFn({ method: "GET" })
  .inputValidator((input: { surahId: number; ayahNumber: number; sourceSlugs: string[] }) => input)
  .handler(async ({ data: { surahId, ayahNumber, sourceSlugs } }) => {
    if (sourceSlugs.length === 0) return [];

    const sources = await db
      .select()
      .from(translationSources)
      .where(inArray(translationSources.slug, sourceSlugs));

    if (sources.length === 0) return [];

    const sourceIds = sources.map((s) => s.id);
    const rows = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.surahId, surahId),
          eq(translations.ayahNumber, ayahNumber),
          inArray(translations.sourceId, sourceIds),
        ),
      );

    // Join with source info for display
    return rows.map((r) => ({
      ...r,
      source: sources.find((s) => s.id === r.sourceId) ?? null,
    }));
  });

// ── Sure verisini komple getir ───────────────────────────

export const getSurahData = createServerFn({ method: "GET" })
  .inputValidator((input: { surahId: number; translationSlugs?: string[] }) => input)
  .handler(async ({ data: { surahId, translationSlugs = [DEFAULT_TRANSLATION_SLUG] } }) => {
    const [surah] = await db.select().from(surahs).where(eq(surahs.id, surahId));
    if (!surah) return null;

    const surahAyahs = await db
      .select()
      .from(ayahs)
      .where(eq(ayahs.surahId, surahId))
      .orderBy(asc(ayahs.ayahNumber));

    // Çoklu çeviri kaynağı
    const sources = await db
      .select()
      .from(translationSources)
      .where(inArray(translationSources.slug, translationSlugs));

    // slug → Map<ayahNumber, text>
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

    return {
      surah,
      ayahs: surahAyahs.map((a) => {
        const allTranslations: Record<string, string> = {};
        for (const [slug, map] of translationMaps) {
          const text = map.get(a.ayahNumber);
          if (text) allTranslations[slug] = text;
        }
        return {
          id: a.id!,
          surahId: a.surahId,
          ayahNumber: a.ayahNumber,
          textUthmani: a.textUthmani,
          translation: allTranslations[translationSlugs[0]] ?? null,
          translations: allTranslations,
          pageNumber: a.pageNumber,
          juzNumber: a.juzNumber,
          hizbNumber: a.hizbNumber,
          sajdah: a.sajdah,
        };
      }),
    };
  });
