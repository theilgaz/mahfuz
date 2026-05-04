/**
 * Ayet Zinciri oyunu server-side servisi.
 * Dinamik sorular — DB'den ayet çekerek oluşturulur.
 * Statik sorular için: verse-chain-data.ts
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { ayahs, surahs } from "~/db/quran-schema";
import { eq, and, ne, sql } from "drizzle-orm";
import type { ChainQuestion } from "./verse-chain-data";
import { splitWords } from "~/lib/split-words";

export type { ChainQuestion };

export const getDynamicChainQuestion = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }): Promise<ChainQuestion> => {
    const [surahId, ayahNum] = verseKey.split(":").map(Number);

    const [current] = await db
      .select({
        id: ayahs.id,
        surahId: ayahs.surahId,
        ayahNumber: ayahs.ayahNumber,
        textUthmani: ayahs.textUthmani,
      })
      .from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNum)));

    if (!current) throw new Error("Ayet bulunamadı");

    // Sonraki ayet
    let nextAyah = await db
      .select()
      .from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNum + 1)))
      .then((r) => r[0] ?? null);

    if (!nextAyah) {
      nextAyah = await db
        .select()
        .from(ayahs)
        .where(and(eq(ayahs.surahId, surahId + 1), eq(ayahs.ayahNumber, 1)))
        .then((r) => r[0] ?? null);
    }

    if (!nextAyah) throw new Error("Sonraki ayet yok");

    const [curSurah] = await db
      .select({ nameSimple: surahs.nameSimple })
      .from(surahs)
      .where(eq(surahs.id, surahId));

    const [nextSurah] = await db
      .select({ nameSimple: surahs.nameSimple })
      .from(surahs)
      .where(eq(surahs.id, nextAyah.surahId));

    // 3 tuzak
    const decoys = await db
      .select({ id: ayahs.id, surahId: ayahs.surahId, ayahNumber: ayahs.ayahNumber, textUthmani: ayahs.textUthmani })
      .from(ayahs)
      .where(ne(ayahs.id, nextAyah.id))
      .orderBy(sql`RANDOM()`)
      .limit(3);

    const options: ChainQuestion["options"] = [
      {
        verseKey: `${nextAyah.surahId}:${nextAyah.ayahNumber}`,
        surahName: nextSurah?.nameSimple ?? "",
        textUthmani: nextAyah.textUthmani,
        firstWords: splitWords(nextAyah.textUthmani).slice(0, 4).join(" ") + "...",
        isCorrect: true,
      },
      ...await Promise.all(
        decoys.map(async (d) => {
          const [s] = await db
            .select({ nameSimple: surahs.nameSimple })
            .from(surahs)
            .where(eq(surahs.id, d.surahId));
          return {
            verseKey: `${d.surahId}:${d.ayahNumber}`,
            surahName: s?.nameSimple ?? "",
            textUthmani: d.textUthmani,
            firstWords: splitWords(d.textUthmani).slice(0, 4).join(" ") + "...",
            isCorrect: false,
          };
        }),
      ),
    ];

    // Karıştır
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const lastWord = splitWords(current.textUthmani).at(-1) ?? "";

    return {
      currentVerse: {
        verseKey,
        surahName: curSurah?.nameSimple ?? "",
        textUthmani: current.textUthmani,
        lastWordArabic: lastWord,
      },
      options,
      correctIndex: options.findIndex((o) => o.isCorrect),
    };
  });
