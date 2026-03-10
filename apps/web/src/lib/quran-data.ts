/**
 * Static Quran data loader — reads from Tanzil.net JSON files.
 *
 * Meta (chapter list): statically imported at build time (31KB).
 * Surah text: client fetches static files; SSR reads from disk via
 * createIsomorphicFn (TanStack Start splits the implementations at build time).
 */
import type {
  TextType,
  TanzilSurahData,
  QuranMeta,
  StaticChapter,
  Chapter,
  Verse,
} from "@mahfuz/shared/types";
import { createIsomorphicFn } from "@tanstack/react-start";
import quranMetaJson from "../data/quran-meta.json";

// ---------- Isomorphic JSON loader ----------

const loadJsonFile = createIsomorphicFn()
  .client(async (publicPath: string) => {
    const resp = await fetch(publicPath);
    if (!resp.ok) throw new Error(`Failed to load ${publicPath}: ${resp.status}`);
    return resp.json();
  })
  .server(async (publicPath: string) => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const candidates = [
      join(process.cwd(), "public", publicPath),
      join(process.cwd(), "dist", "client", publicPath),
    ];
    for (const filePath of candidates) {
      try {
        const raw = await readFile(filePath, "utf-8");
        return JSON.parse(raw);
      } catch {
        continue;
      }
    }
    throw new Error(`[quran-data] Failed to load ${publicPath} from disk`);
  });

// ---------- Cache ----------

const surahCache = new Map<string, TanzilSurahData>();

// ---------- Loaders ----------

/** Returns statically bundled Quran meta (chapters list). No async I/O. */
export async function loadQuranMeta(): Promise<QuranMeta> {
  return quranMetaJson as unknown as QuranMeta;
}

/** Loads surah text. Client: fetches static file. SSR: reads from disk. */
export async function loadSurahText(
  surahId: number,
  textType: TextType
): Promise<TanzilSurahData> {
  const key = `${textType}/${surahId}`;
  const cached = surahCache.get(key);
  if (cached) return cached;

  const data = await loadJsonFile(`/quran/${textType}/${surahId}.json`);
  surahCache.set(key, data);
  return data;
}

// ---------- Converters ----------

/** Convert a StaticChapter from meta.json → the app's Chapter interface */
export function staticChapterToChapter(sc: StaticChapter): Chapter {
  return {
    id: sc.id,
    revelation_place: sc.revelation_place as "makkah" | "madinah",
    revelation_order: sc.revelation_order,
    bismillah_pre: sc.bismillah_pre,
    name_simple: sc.name_simple,
    name_complex: sc.name_simple,
    name_arabic: sc.name_arabic,
    verses_count: sc.verses_count,
    pages: sc.pages,
    translated_name: {
      name: sc.name_translation,
      language_name: "english",
    },
  };
}

/** Convert Tanzil surah data → Verse[] matching the app's Verse interface */
export function tanzilToVerses(
  data: TanzilSurahData,
  surahId: number,
  textType: TextType
): Verse[] {
  return data.verses.map((tv) => {
    const verse: Verse = {
      id: surahId * 1000 + tv.v,
      verse_number: tv.v,
      verse_key: `${surahId}:${tv.v}`,
      hizb_number: Math.ceil(tv.h / 4),
      rub_el_hizb_number: tv.h,
      ruku_number: tv.rk,
      manzil_number: tv.m,
      sajdah_number: tv.sj ? tv.sj : null,
      page_number: tv.p,
      juz_number: tv.j,
    };

    verse.text_uthmani = tv.t;
    verse.text_imlaei = tv.t;

    return verse;
  });
}

/** Merge WBW word data into static verses (used when viewMode === "wordByWord") */
export function mergeWbwIntoVerses(
  staticVerses: Verse[],
  wbwVerses: Verse[] | undefined
): Verse[] {
  if (!wbwVerses?.length) return staticVerses;

  const wbwMap = new Map<string, Verse>();
  for (const v of wbwVerses) {
    wbwMap.set(v.verse_key, v);
  }

  return staticVerses.map((sv) => {
    const wv = wbwMap.get(sv.verse_key);
    if (!wv?.words) return sv;
    return {
      ...sv,
      words: wv.words,
      text_uthmani: sv.text_uthmani || wv.text_uthmani,
      text_imlaei: sv.text_imlaei || wv.text_imlaei,
    };
  });
}
