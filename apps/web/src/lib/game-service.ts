/**
 * Oyun servisleri — sunucu taraflı soru üretimi.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { ayahs, surahs } from "~/db/quran-schema";
import { sql, eq, inArray, and } from "drizzle-orm";

export const getRandomVerseForGame = createServerFn({ method: "GET" })
  .inputValidator((input: { surahIds?: number[] }) => input)
  .handler(async ({ data }) => {
    const surahFilter = data.surahIds && data.surahIds.length > 0
      ? inArray(ayahs.surahId, data.surahIds)
      : undefined;

    const whereClause = surahFilter
      ? and(sql`length(${ayahs.textUthmani}) BETWEEN 20 AND 80`, surahFilter)
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

export const getVerseGuessQuestion = createServerFn({ method: "GET" }).handler(async () => {
  const [ayah] = await db
    .select()
    .from(ayahs)
    .orderBy(sql`RANDOM()`)
    .where(sql`length(${ayahs.textUthmani}) BETWEEN 30 AND 100`)
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
