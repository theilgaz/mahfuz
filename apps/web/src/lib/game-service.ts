/**
 * Oyun servisleri — sunucu taraflı soru üretimi.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { ayahs, surahs } from "~/db/quran-schema";
import { sql, eq, inArray, and, or } from "drizzle-orm";

export type VerseFilter = { surahId: number; verseNums: number[] }[];

export const getRandomVerseForGame = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      surahIds?: number[];
      verseFilter?: VerseFilter;
      excludeAyahIds?: number[];
      optionCount?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const numOptions = data.optionCount ?? 4;
    // Ayet bazında filtre (ezber modu) varsa öncelikli olarak kullan
    const conditions: ReturnType<typeof sql>[] = [];

    if (data.verseFilter && data.verseFilter.length > 0) {
      const scopeConditions = data.verseFilter.map(({ surahId, verseNums }) =>
        and(eq(ayahs.surahId, surahId), inArray(ayahs.ayahNumber, verseNums)),
      );
      conditions.push(
        scopeConditions.length === 1
          ? (scopeConditions[0] as ReturnType<typeof sql>)
          : (or(...scopeConditions) as ReturnType<typeof sql>),
      );
    } else if (data.surahIds && data.surahIds.length > 0) {
      conditions.push(
        inArray(ayahs.surahId, data.surahIds) as ReturnType<typeof sql>,
      );
    }

    conditions.push(sql`length(${ayahs.textUthmani}) BETWEEN 20 AND 80`);

    // Daha once gosterilen ayetleri disla
    if (data.excludeAyahIds && data.excludeAyahIds.length > 0) {
      conditions.push(
        sql`${ayahs.id} NOT IN (${sql.raw(data.excludeAyahIds.join(","))})`,
      );
    }

    const whereClause = and(...conditions);

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

      const [surah] = await db
        .select()
        .from(surahs)
        .where(eq(surahs.id, ayah.surahId));

      const blankIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
      const correctWord = words[blankIndex];

      // Seçenekler: doğru kelime + ayetten (numOptions-1) farklı kelime
      const distractors = words
        .filter((_, i) => i !== blankIndex)
        .sort(() => Math.random() - 0.5)
        .slice(0, numOptions - 1);

      const options = [...distractors, correctWord].sort(
        () => Math.random() - 0.5,
      );

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

    return null;
  });

export const getVerseGuessQuestion = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { surahIds?: number[]; excludeAyahIds?: number[]; optionCount?: number }) => input,
  )
  .handler(async ({ data }) => {
    const numOptions = data.optionCount ?? 4;
    const conditions: ReturnType<typeof sql>[] = [
      sql`length(${ayahs.textUthmani}) BETWEEN 30 AND 100`,
    ];

    if (data.surahIds && data.surahIds.length > 0) {
      conditions.push(
        inArray(ayahs.surahId, data.surahIds) as ReturnType<typeof sql>,
      );
    }

    if (data.excludeAyahIds && data.excludeAyahIds.length > 0) {
      conditions.push(
        sql`${ayahs.id} NOT IN (${sql.raw(data.excludeAyahIds.join(","))})`,
      );
    }

    const [ayah] = await db
      .select()
      .from(ayahs)
      .orderBy(sql`RANDOM()`)
      .where(and(...conditions))
      .limit(1);

    if (!ayah) return null;

    const [correctSurah] = await db
      .select()
      .from(surahs)
      .where(eq(surahs.id, ayah.surahId));

    const wrongConditions = [sql`${surahs.id} != ${ayah.surahId}`];
    if (data.surahIds && data.surahIds.length > 0) {
      wrongConditions.push(
        inArray(surahs.id, data.surahIds) as ReturnType<typeof sql>,
      );
    }
    const wrongSurahs = await db
      .select()
      .from(surahs)
      .where(and(...wrongConditions))
      .orderBy(sql`RANDOM()`)
      .limit(numOptions - 1);

    const options = [...wrongSurahs, correctSurah].sort(() => Math.random() - 0.5);

    return {
      ayahId: ayah.id,
      verseText: ayah.textUthmani,
      verseNum: ayah.ayahNumber,
      correctSurahId: correctSurah.id,
      correctSurahName: correctSurah.nameSimple,
      options: options.map((s) => ({ id: s.id, name: s.nameSimple, arabic: s.nameArabic })),
    };
  });
