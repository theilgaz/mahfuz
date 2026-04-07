/**
 * Ayet Tahlili servisi — meal, benzer ayetler.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import {
  ayahs,
  surahs,
  translationSources,
  translations as translationsTable,
} from "~/db/quran-schema";
import { verseSimilarity } from "~/db/ikra-schema";
import { eq, and, desc } from "drizzle-orm";
import { getVerseByAuthors } from "~/lib/acik-kuran-client";

// Aykırı / alternatif mealci ID'leri (Açık Kuran API)
export const ACIK_KURAN_AUTHORS = [
  { id: 38, name: "Mustafa İslamoğlu", desc: "Hayat Kitabı Kur'an", tag: "Modernist" },
  { id: 104, name: "Edip Yüksel", desc: "Mesaj: Kuran Çevirisi", tag: "Kur'anist" },
  { id: 30, name: "Yaşar Nuri Öztürk", desc: "Kur'an-ı Kerim Meali", tag: "Modernist" },
  { id: 107, name: "Mehmet Okuyan", desc: "Kur'an Meal-Tefsir", tag: "Akademik" },
  { id: 52, name: "Süleymaniye Vakfı", desc: "Süleymaniye Vakfı Meali", tag: "Rasyonalist" },
  { id: 8, name: "Bayraktar Bayraklı", desc: "Yeni Anlayışın Işığında", tag: "Reformist" },
  { id: 3, name: "Ahmed Hulusi", desc: "Kur'an Çözümü", tag: "Sufi" },
  { id: 22, name: "Muhammed Esed", desc: "Kur'an Mesajı", tag: "Modernist" },
  { id: 27, name: "Süleyman Ateş", desc: "Kur'an-ı Kerim ve Yüce Meali", tag: "Sufi" },
  { id: 26, name: "Suat Yıldırım", desc: "Kur'an-ı Kerim ve Meali", tag: "Akademik" },
  { id: 6, name: "Ali Bulaç", desc: "Kur'an-ı Kerim ve Türkçe Anlamı", tag: "Klasik" },
] as const;

// ── Ayet Tahlili ─────────────────────────────────────────

export const getVerseAnalysis = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }) => {
    const [surahId, verseNum] = verseKey.split(":").map(Number);

    const [ayah] = await db
      .select()
      .from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, verseNum)));

    if (!ayah) throw new Error("Ayet bulunamadı");

    const [surah] = await db.select().from(surahs).where(eq(surahs.id, surahId));

    const transSources = await db
      .select({ ts: translationSources, t: translationsTable })
      .from(translationSources)
      .leftJoin(
        translationsTable,
        and(
          eq(translationsTable.sourceId, translationSources.id),
          eq(translationsTable.surahId, surahId),
          eq(translationsTable.ayahNumber, verseNum),
        ),
      );

    return {
      ayah,
      surah,
      translations: transSources
        .filter((r) => r.t)
        .map((r) => ({ source: r.ts, text: r.t!.text })),
    };
  });

// ── Benzer Ayetler ────────────────────────────────────────

export const getSimilarVerses = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }) => {
    const [surahId, verseNum] = verseKey.split(":").map(Number);

    const [ayah] = await db
      .select({ id: ayahs.id })
      .from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, verseNum)));

    if (!ayah) return [];

    const similarRows = await db
      .select({
        similarAyahId: verseSimilarity.similarAyahId,
        score: verseSimilarity.score,
      })
      .from(verseSimilarity)
      .where(eq(verseSimilarity.ayahId, ayah.id))
      .orderBy(desc(verseSimilarity.score))
      .limit(5);

    if (similarRows.length === 0) return [];

    const results = await Promise.all(
      similarRows.map(async (row) => {
        const [sim] = await db
          .select({
            id: ayahs.id,
            surahId: ayahs.surahId,
            ayahNumber: ayahs.ayahNumber,
            textUthmani: ayahs.textUthmani,
          })
          .from(ayahs)
          .where(eq(ayahs.id, row.similarAyahId));

        if (!sim) return null;

        const [surah] = await db
          .select({ nameSimple: surahs.nameSimple, nameArabic: surahs.nameArabic })
          .from(surahs)
          .where(eq(surahs.id, sim.surahId));

        const [trRow] = await db
          .select({ text: translationsTable.text })
          .from(translationsTable)
          .where(
            and(
              eq(translationsTable.surahId, sim.surahId),
              eq(translationsTable.ayahNumber, sim.ayahNumber),
            ),
          )
          .limit(1);

        return {
          verseKey: `${sim.surahId}:${sim.ayahNumber}`,
          surahId: sim.surahId,
          ayahNumber: sim.ayahNumber,
          textUthmani: sim.textUthmani,
          surahName: surah?.nameSimple ?? "",
          surahNameArabic: surah?.nameArabic ?? "",
          translation: trRow?.text ?? null,
          score: row.score,
        };
      }),
    );

    return results.filter(Boolean) as NonNullable<(typeof results)[number]>[];
  });

// ── Alternatif / Aykırı Mealler (Açık Kuran API) ─────────────────────────

export const getAcikKuranTranslations = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }) => {
    const [surahId, verseNum] = verseKey.split(":").map(Number);
    const authorIds = ACIK_KURAN_AUTHORS.map((a) => a.id);
    const translations = await getVerseByAuthors(surahId, verseNum, authorIds);

    return translations.map((t) => ({
      ...t,
      tag: ACIK_KURAN_AUTHORS.find((a) => a.id === t.authorId)?.tag ?? "",
    }));
  });
