/**
 * Quran Data Service — kendi DB'miz primary source.
 *
 * Tüm veri sorguları buradan geçer. İleride quran.com fallback
 * veya CDN cache katmanı eklenebilir, consumer'lar değişmez.
 */

import { createServerFn } from "@tanstack/react-start";
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
  .handler(async ({ data: { surahIds, ayahNumbers, sourceSlug = "omer-celik" } }) => {
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
  .inputValidator((input: { pageNumber: number; translationSlug?: string }) => input)
  .handler(async ({ data: { pageNumber, translationSlug = "omer-celik" } }) => {
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

    // 3. Çevirileri çek
    const [source] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.slug, translationSlug));

    let translationMap = new Map<string, string>();

    if (source) {
      const trans = await db
        .select()
        .from(translations)
        .where(
          and(
            inArray(translations.surahId, surahIds),
            eq(translations.sourceId, source.id),
          ),
        );

      translationMap = new Map(
        trans.map((t) => [`${t.surahId}:${t.ayahNumber}`, t.text]),
      );
    }

    // 4. Sayfadaki sure gruplarını oluştur
    const surahGroups: Array<{
      surah: typeof surahList[0];
      ayahs: Array<{
        id: number;
        surahId: number;
        ayahNumber: number;
        textUthmani: string;
        translation: string | null;
        juzNumber: number;
        hizbNumber: number;
      }>;
      isStart: boolean; // sayfada sure başlıyor mu?
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

      currentGroup!.ayahs.push({
        id: ayah.id!,
        surahId: ayah.surahId,
        ayahNumber: ayah.ayahNumber,
        textUthmani: ayah.textUthmani,
        translation: translationMap.get(`${ayah.surahId}:${ayah.ayahNumber}`) ?? null,
        juzNumber: ayah.juzNumber,
        hizbNumber: ayah.hizbNumber,
      });
    }

    return {
      pageNumber,
      juzNumber: pageAyahs[0].juzNumber,
      surahGroups,
      totalAyahs: pageAyahs.length,
    };
  });

// ── Sure verisini komple getir ───────────────────────────

export const getSurahData = createServerFn({ method: "GET" })
  .inputValidator((input: { surahId: number; translationSlug?: string }) => input)
  .handler(async ({ data: { surahId, translationSlug = "omer-celik" } }) => {
    const [surah] = await db.select().from(surahs).where(eq(surahs.id, surahId));
    if (!surah) return null;

    const surahAyahs = await db
      .select()
      .from(ayahs)
      .where(eq(ayahs.surahId, surahId))
      .orderBy(asc(ayahs.ayahNumber));

    const [source] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.slug, translationSlug));

    let translationMap = new Map<number, string>();

    if (source) {
      const trans = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.surahId, surahId),
            eq(translations.sourceId, source.id),
          ),
        );
      translationMap = new Map(trans.map((t) => [t.ayahNumber, t.text]));
    }

    return {
      surah,
      ayahs: surahAyahs.map((a) => ({
        id: a.id!,
        surahId: a.surahId,
        ayahNumber: a.ayahNumber,
        textUthmani: a.textUthmani,
        translation: translationMap.get(a.ayahNumber) ?? null,
        pageNumber: a.pageNumber,
        juzNumber: a.juzNumber,
        hizbNumber: a.hizbNumber,
        sajdah: a.sajdah,
      })),
    };
  });
