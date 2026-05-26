/**
 * Tefsir servisi — Diyanet Kur'an Yolu ve sonradan eklenecek kaynaklar.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { db } from "~/db";
import {
  ayahs,
  surahs,
  tafsirSources,
  tafsirs,
} from "~/db/quran-schema";

// ── Tüm tefsir kaynakları ────────────────────────────────

export const getTafsirSources = createServerFn({ method: "GET" }).handler(
  async () => {
    return db.select().from(tafsirSources).orderBy(asc(tafsirSources.id));
  },
);

// ── Tek ayet için tek tefsir (varsayılan veya seçili kaynak) ─────────

interface TafsirForVerseInput {
  verseKey: string; // "1:1"
  sourceSlug?: string; // verilmezse isDefault olan döner
}

export const getTafsirForVerse = createServerFn({ method: "GET" })
  .inputValidator((input: TafsirForVerseInput) => input)
  .handler(async ({ data }) => {
    const [surahStr, ayahStr] = data.verseKey.split(":");
    const surahId = Number(surahStr);
    const ayahNumber = Number(ayahStr);

    const [ayah] = await db
      .select()
      .from(ayahs)
      .where(and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNumber)));
    if (!ayah) throw new Error("Ayet bulunamadı");

    const [surah] = await db.select().from(surahs).where(eq(surahs.id, surahId));

    // Kaynağı belirle
    let source;
    if (data.sourceSlug) {
      [source] = await db
        .select()
        .from(tafsirSources)
        .where(eq(tafsirSources.slug, data.sourceSlug));
    } else {
      [source] = await db
        .select()
        .from(tafsirSources)
        .where(eq(tafsirSources.isDefault, true));
      if (!source) {
        [source] = await db
          .select()
          .from(tafsirSources)
          .orderBy(asc(tafsirSources.id))
          .limit(1);
      }
    }

    if (!source) {
      return { ayah, surah, source: null, tafsir: null };
    }

    const [tafsir] = await db
      .select()
      .from(tafsirs)
      .where(
        and(
          eq(tafsirs.sourceId, source.id),
          eq(tafsirs.surahId, surahId),
          eq(tafsirs.ayahNumber, ayahNumber),
        ),
      );

    return { ayah, surah, source, tafsir: tafsir ?? null };
  });

// ── Tek ayet için tüm kaynaklardan tefsir (karşılaştırma) ────────────

export const getAllTafsirsForVerse = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }) => {
    const [surahStr, ayahStr] = verseKey.split(":");
    const surahId = Number(surahStr);
    const ayahNumber = Number(ayahStr);

    const rows = await db
      .select({
        source: tafsirSources,
        tafsir: tafsirs,
      })
      .from(tafsirSources)
      .leftJoin(
        tafsirs,
        and(
          eq(tafsirs.sourceId, tafsirSources.id),
          eq(tafsirs.surahId, surahId),
          eq(tafsirs.ayahNumber, ayahNumber),
        ),
      )
      .orderBy(asc(tafsirSources.id));

    return rows
      .filter((r) => r.tafsir)
      .map((r) => ({ source: r.source, tafsir: r.tafsir! }));
  });
