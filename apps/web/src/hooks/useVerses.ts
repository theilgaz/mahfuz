/**
 * Verse query options — now backed by static Tanzil JSON data.
 * Keeps the same export names for backward compatibility with
 * memorization components and other consumers.
 */
import { queryOptions } from "@tanstack/react-query";
import type { TextType } from "@mahfuz/shared/types";
import {
  loadSurahText,
  loadQuranMeta,
  tanzilToVerses,
} from "~/lib/quran-data";
import { usePreferencesStore } from "~/stores/usePreferencesStore";

function getTextType(): TextType {
  return usePreferencesStore.getState().textType ?? "uthmani";
}

export const versesByChapterQueryOptions = (
  chapterId: number,
  _page: number = 1,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ["static-verses", "chapter", chapterId, getTextType()],
    queryFn: async () => {
      const textType = getTextType();
      const data = await loadSurahText(chapterId, textType);
      return {
        verses: tanzilToVerses(data, chapterId, textType),
        pagination: { current_page: 1, total_pages: 1, total_records: data.verses.length, per_page: data.verses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const versesByPageQueryOptions = (
  pageNumber: number,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ["static-verses", "page", pageNumber, getTextType()],
    queryFn: async () => {
      const textType = getTextType();
      const meta = await loadQuranMeta();
      const surahIds = meta.pageToSurahs[pageNumber] ?? [];

      const allVerses = [];
      for (const surahId of surahIds) {
        const data = await loadSurahText(surahId, textType);
        const verses = tanzilToVerses(data, surahId, textType);
        allVerses.push(...verses.filter((v) => v.page_number === pageNumber));
      }

      return {
        verses: allVerses,
        pagination: { current_page: 1, total_pages: 1, total_records: allVerses.length, per_page: allVerses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const versesByJuzQueryOptions = (
  juzNumber: number,
  _page: number = 1,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ["static-verses", "juz", juzNumber, getTextType()],
    queryFn: async () => {
      const textType = getTextType();
      const meta = await loadQuranMeta();
      const boundary = meta.juzBoundaries[juzNumber];
      if (!boundary) throw new Error(`Unknown juz: ${juzNumber}`);

      const [startSura, startAya] = boundary.start.split(":").map(Number);
      const [endSura, endAya] = boundary.end.split(":").map(Number);

      const allVerses = [];
      for (let surahId = startSura; surahId <= endSura; surahId++) {
        const data = await loadSurahText(surahId, textType);
        const verses = tanzilToVerses(data, surahId, textType);
        allVerses.push(
          ...verses.filter((v) => {
            if (surahId === startSura && v.verse_number < startAya) return false;
            if (surahId === endSura && v.verse_number > endAya) return false;
            return true;
          })
        );
      }

      return {
        verses: allVerses,
        pagination: { current_page: 1, total_pages: 1, total_records: allVerses.length, per_page: allVerses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const verseByKeyQueryOptions = (
  verseKey: string,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ["static-verse", verseKey, getTextType()],
    queryFn: async () => {
      const textType = getTextType();
      const [surahId, verseNum] = verseKey.split(":").map(Number);
      const data = await loadSurahText(surahId, textType);
      const verses = tanzilToVerses(data, surahId, textType);
      const verse = verses.find((v) => v.verse_number === verseNum);
      if (!verse) throw new Error(`Verse not found: ${verseKey}`);
      return verse;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
