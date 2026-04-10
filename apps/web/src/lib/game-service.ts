/**
 * Oyun servisleri — sunucu taraflı soru üretimi.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { ayahs, surahs } from "~/db/quran-schema";
import { sql, eq, inArray, and, or } from "drizzle-orm";

export type VerseFilter = { surahId: number; verseNums: number[] }[];

export const getRandomVerseForGame = createServerFn({ method: "GET" })
  .inputValidator((input: { surahIds?: number[]; verseFilter?: VerseFilter }) => input)
  .handler(async ({ data }) => {
    // Ayet bazında filtre (ezber modu) varsa öncelikli olarak kullan
    let scopeFilter;
    if (data.verseFilter && data.verseFilter.length > 0) {
      const conditions = data.verseFilter.map(({ surahId, verseNums }) =>
        and(eq(ayahs.surahId, surahId), inArray(ayahs.ayahNumber, verseNums))
      );
      scopeFilter = conditions.length === 1 ? conditions[0] : or(...conditions);
    } else if (data.surahIds && data.surahIds.length > 0) {
      scopeFilter = inArray(ayahs.surahId, data.surahIds);
    }

    const whereClause = scopeFilter
      ? and(sql`length(${ayahs.textUthmani}) BETWEEN 20 AND 80`, scopeFilter)
      : sql`length(${ayahs.textUthmani}) BETWEEN 20 AND 80`;

    // Yeterli kelimeli ayet bulana kadar dene (max 5 deneme)
    for (let attempt = 0; attempt < 5; attempt++) {
      const [ayah] = await db
        .select()
        .from(ayahs)
        .orderBy(sql`RANDOM()`)
        .where(whereClause)
        .limit(1);

      if (!ayah) continue;

      const words = ayah.textUthmani.split(/\s+/).filter(Boolean);
      if (words.length < 4) continue;

      const [surah] = await db.select().from(surahs).where(eq(surahs.id, ayah.surahId));

      const blankIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
      const correctWord = words[blankIndex];

      // Seçenekler: doğru kelime + aynı ayetten 3 farklı kelime
      const distractors = words
        .filter((_, i) => i !== blankIndex)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [...distractors, correctWord].sort(() => Math.random() - 0.5);

      return {
        ayahId: ayah.id,
        surahName: surah?.nameSimple ?? "",
        verseNum: ayah.ayahNumber,
        words,
        blankIndex,
        correctWord,
        options,
      };
    }

    throw new Error("Uygun ayet bulunamadı");
  });

export const getVerseGuessQuestion = createServerFn({ method: "GET" })
  .inputValidator((input: { surahIds?: number[] }) => input)
  .handler(async ({ data }) => {
    const surahFilter = data.surahIds && data.surahIds.length > 0
      ? and(sql`length(${ayahs.textUthmani}) BETWEEN 30 AND 100`, inArray(ayahs.surahId, data.surahIds))
      : sql`length(${ayahs.textUthmani}) BETWEEN 30 AND 100`;

    const [ayah] = await db
      .select()
      .from(ayahs)
      .orderBy(sql`RANDOM()`)
      .where(surahFilter)
      .limit(1);

    const [correctSurah] = await db
      .select()
      .from(surahs)
      .where(eq(surahs.id, ayah.surahId));

    const wrongSurahs = await db
      .select()
      .from(surahs)
      .where(sql`${surahs.id} != ${ayah.surahId}`)
      .orderBy(sql`RANDOM()`)
      .limit(3);

    const options = [...wrongSurahs, correctSurah].sort(() => Math.random() - 0.5);

    return {
      verseText: ayah.textUthmani,
      verseNum: ayah.ayahNumber,
      correctSurahId: correctSurah.id,
      correctSurahName: correctSurah.nameSimple,
      options: options.map((s) => ({ id: s.id, name: s.nameSimple, arabic: s.nameArabic })),
    };
  });
