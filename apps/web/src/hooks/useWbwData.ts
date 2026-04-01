/**
 * Word-by-word (kelime kelime) veri hook'u.
 * quran.com API'den kelime bazlı çeviri verisini çeker.
 * Türkçe eksik kelimeleri /wbw-tr-patch.json ile tamamlar.
 */

import { queryOptions, useQuery } from "@tanstack/react-query";

const QDC_API = "https://api.quran.com/api/v4";

export interface WbwWord {
  position: number;
  textUthmani: string;
  translation: string;
  transliteration: string;
}

export interface WbwVerse {
  verseKey: string;
  words: WbwWord[];
}

/** verseKey → WbwWord[] */
export type WbwData = Map<string, WbwWord[]>;

interface QDCWord {
  position: number;
  text_uthmani: string;
  char_type_name: string;
  translation?: { text: string; language_name: string };
  transliteration?: { text: string; language_name: string };
}

interface QDCVerse {
  verse_key: string;
  words: QDCWord[];
}

interface QDCResponse {
  verses: QDCVerse[];
  pagination: { total_pages: number; current_page: number };
}

/** Türkçe yama: Arapça kelime formu → Türkçe çeviri */
type TrPatch = Record<string, string>;

let patchCache: TrPatch | null = null;

async function loadTrPatch(): Promise<TrPatch> {
  if (patchCache) return patchCache;
  try {
    const res = await fetch("/wbw-tr-patch.json");
    if (res.ok) {
      patchCache = await res.json();
    } else {
      patchCache = {};
    }
  } catch {
    patchCache = {};
  }
  return patchCache!;
}

async function fetchWbwChapter(chapterId: number): Promise<WbwData> {
  const patch = await loadTrPatch();
  const map: WbwData = new Map();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${QDC_API}/verses/by_chapter/${chapterId}?language=tr&words=true&word_fields=text_uthmani,translation,transliteration&word_translation_language=tr&per_page=50&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) break;

    const data: QDCResponse = await res.json();
    totalPages = data.pagination.total_pages;

    for (const verse of data.verses) {
      const words: WbwWord[] = verse.words
        .filter((w) => w.char_type_name === "word")
        .map((w) => {
          const isTurkish = w.translation?.language_name === "turkish";
          const apiTranslation = isTurkish ? (w.translation?.text ?? "") : "";
          const patchTranslation = !isTurkish ? (patch[w.text_uthmani] ?? "") : "";
          return {
            position: w.position,
            textUthmani: w.text_uthmani,
            translation: apiTranslation || patchTranslation,
            transliteration: w.transliteration?.text ?? "",
          };
        });
      map.set(verse.verse_key, words);
    }

    page++;
  }

  return map;
}

export const wbwQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: ["wbw", chapterId],
    queryFn: () => fetchWbwChapter(chapterId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30 min
  });

export function useWbwData(chapterId: number, enabled: boolean) {
  return useQuery({
    ...wbwQueryOptions(chapterId),
    enabled,
  });
}
