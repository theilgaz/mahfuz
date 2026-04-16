/**
 * TanStack Query hook'ları — tüm Kuran verisi buradan okunur.
 */

import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { DEFAULT_TRANSLATION_SLUG } from "@mahfuz/shared";
import {
  getSurahs,
  getSurah,
  getPageData,
  getSurahData,
  getTranslationSources,
  getReciters,
  getDailyVerse,
  getTranslationsForVerse,
} from "~/lib/quran-service";

// ── Query Keys ───────────────────────────────────────────

export const quranKeys = {
  all: ["quran"] as const,
  surahs: () => [...quranKeys.all, "surahs"] as const,
  surah: (id: number) => [...quranKeys.all, "surah", id] as const,
  page: (pageNumber: number, slugs: string[]) =>
    [...quranKeys.all, "page", pageNumber, slugs.join(",")] as const,
  surahData: (surahId: number, slugs: string[]) =>
    [...quranKeys.all, "surahData", surahId, slugs.join(",")] as const,
  translationSources: () => [...quranKeys.all, "translationSources"] as const,
  reciters: () => [...quranKeys.all, "reciters"] as const,
  tajweed: (surahId: number) => [...quranKeys.all, "tajweed", surahId] as const,
  imlaei: (surahId: number) => [...quranKeys.all, "imlaei", surahId] as const,
  mushafLines: (pageNumber: number) => [...quranKeys.all, "mushafLines", pageNumber] as const,
};

// ── Query Options ────────────────────────────────────────

export const surahsQueryOptions = () =>
  queryOptions({
    queryKey: quranKeys.surahs(),
    queryFn: () => getSurahs(),
    staleTime: Infinity,
  });

export const surahQueryOptions = (surahId: number) =>
  queryOptions({
    queryKey: quranKeys.surah(surahId),
    queryFn: () => getSurah({ data: surahId }),
    staleTime: Infinity,
  });

export const pageDataQueryOptions = (pageNumber: number, translationSlugs: string[] = [DEFAULT_TRANSLATION_SLUG]) =>
  queryOptions({
    queryKey: quranKeys.page(pageNumber, translationSlugs),
    queryFn: () => getPageData({ data: { pageNumber, translationSlugs } }),
    staleTime: Infinity,
  });

export const surahDataQueryOptions = (surahId: number, translationSlugs: string[] = [DEFAULT_TRANSLATION_SLUG]) =>
  queryOptions({
    queryKey: quranKeys.surahData(surahId, translationSlugs),
    queryFn: () => getSurahData({ data: { surahId, translationSlugs } }),
    staleTime: Infinity,
  });

export const translationSourcesQueryOptions = () =>
  queryOptions({
    queryKey: quranKeys.translationSources(),
    queryFn: () => getTranslationSources(),
    staleTime: Infinity,
  });

export const recitersQueryOptions = () =>
  queryOptions({
    queryKey: quranKeys.reciters(),
    queryFn: () => getReciters(),
    staleTime: Infinity,
  });

export const tajweedQueryOptions = (surahId: number) =>
  queryOptions({
    queryKey: quranKeys.tajweed(surahId),
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`/tajweed/${surahId}.json`);
      if (!res.ok) throw new Error(`Tajweed data not found for surah ${surahId}`);
      return res.json();
    },
    staleTime: Infinity,
  });

export const imlaeiQueryOptions = (surahId: number) =>
  queryOptions({
    queryKey: quranKeys.imlaei(surahId),
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`/imlaei/${surahId}.json`);
      if (!res.ok) throw new Error(`Imlaei data not found for surah ${surahId}`);
      return res.json();
    },
    staleTime: Infinity,
  });

export interface MushafLineWord {
  /** text_uthmani */
  t: string;
  /** char_type: w=word, e=end, p=pause */
  c: "w" | "e" | "p";
}

export interface MushafPageLines {
  lines: { words: MushafLineWord[] }[];
}

export const mushafLinesQueryOptions = (pageNumber: number) =>
  queryOptions({
    queryKey: quranKeys.mushafLines(pageNumber),
    queryFn: async (): Promise<MushafPageLines> => {
      const res = await fetch(`/mushaf-lines/${pageNumber}.json`);
      if (!res.ok) throw new Error(`Mushaf line data not found for page ${pageNumber}`);
      return res.json();
    },
    staleTime: Infinity,
  });

// ── Suspense Hooks ───────────────────────────────────────

export function useSurahs() {
  return useSuspenseQuery(surahsQueryOptions());
}

export function useSurah(surahId: number) {
  return useSuspenseQuery(surahQueryOptions(surahId));
}

export function usePageData(pageNumber: number, translationSlugs: string[] = [DEFAULT_TRANSLATION_SLUG]) {
  return useSuspenseQuery(pageDataQueryOptions(pageNumber, translationSlugs));
}

export function useSurahData(surahId: number, translationSlugs: string[] = [DEFAULT_TRANSLATION_SLUG]) {
  return useSuspenseQuery(surahDataQueryOptions(surahId, translationSlugs));
}

export function useReciters() {
  return useSuspenseQuery(recitersQueryOptions());
}

/** Tecvidli metin — sadece showTajweed aktifken yüklenir */
export function useTajweed(surahId: number, enabled: boolean) {
  return useQuery({
    ...tajweedQueryOptions(surahId),
    enabled,
  });
}

/** İmlâî metin — sadece textStyle === "basic" iken yüklenir */
export function useImlaei(surahId: number, enabled: boolean) {
  return useQuery({
    ...imlaeiQueryOptions(surahId),
    enabled,
    placeholderData: (prev) => prev,
  });
}

/** Mushaf satır verisi — sayfa bazlı kelime + satır numarası */
export function useMushafLines(pageNumber: number, enabled: boolean) {
  return useQuery({
    ...mushafLinesQueryOptions(pageNumber),
    enabled,
  });
}

export function dailyVerseQueryOptions(locale?: string) {
  return queryOptions({
    queryKey: ["daily-verse", new Date().toDateString(), locale],
    queryFn: () => getDailyVerse({ data: { locale } }),
    staleTime: 1000 * 60 * 60,
  });
}

export function useDailyVerse(locale?: string) {
  return useQuery(dailyVerseQueryOptions(locale));
}

export function multiTranslationQueryOptions(surahId: number, ayahNumber: number, sourceSlugs: string[]) {
  return queryOptions({
    queryKey: ["translations", "multi", surahId, ayahNumber, sourceSlugs],
    queryFn: () => getTranslationsForVerse({ data: { surahId, ayahNumber, sourceSlugs } }),
    staleTime: Infinity,
    enabled: sourceSlugs.length > 0,
  });
}

export function useMultiTranslations(surahId: number, ayahNumber: number, sourceSlugs: string[]) {
  return useQuery(multiTranslationQueryOptions(surahId, ayahNumber, sourceSlugs));
}
