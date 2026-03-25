/**
 * TanStack Query hook'ları — tüm Kuran verisi buradan okunur.
 */

import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  getSurahs,
  getSurah,
  getPageData,
  getSurahData,
  getTranslationSources,
  getReciters,
} from "~/lib/quran-service";

// ── Query Keys ───────────────────────────────────────────

export const quranKeys = {
  all: ["quran"] as const,
  surahs: () => [...quranKeys.all, "surahs"] as const,
  surah: (id: number) => [...quranKeys.all, "surah", id] as const,
  page: (pageNumber: number, slug: string) =>
    [...quranKeys.all, "page", pageNumber, slug] as const,
  surahData: (surahId: number, slug: string) =>
    [...quranKeys.all, "surahData", surahId, slug] as const,
  translationSources: () => [...quranKeys.all, "translationSources"] as const,
  reciters: () => [...quranKeys.all, "reciters"] as const,
  tajweed: (surahId: number) => [...quranKeys.all, "tajweed", surahId] as const,
  imlaei: (surahId: number) => [...quranKeys.all, "imlaei", surahId] as const,
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

export const pageDataQueryOptions = (pageNumber: number, translationSlug = "omer-celik") =>
  queryOptions({
    queryKey: quranKeys.page(pageNumber, translationSlug),
    queryFn: () => getPageData({ data: { pageNumber, translationSlug } }),
    staleTime: Infinity,
  });

export const surahDataQueryOptions = (surahId: number, translationSlug = "omer-celik") =>
  queryOptions({
    queryKey: quranKeys.surahData(surahId, translationSlug),
    queryFn: () => getSurahData({ data: { surahId, translationSlug } }),
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

// ── Suspense Hooks ───────────────────────────────────────

export function useSurahs() {
  return useSuspenseQuery(surahsQueryOptions());
}

export function useSurah(surahId: number) {
  return useSuspenseQuery(surahQueryOptions(surahId));
}

export function usePageData(pageNumber: number, translationSlug = "omer-celik") {
  return useSuspenseQuery(pageDataQueryOptions(pageNumber, translationSlug));
}

export function useSurahData(surahId: number, translationSlug = "omer-celik") {
  return useSuspenseQuery(surahDataQueryOptions(surahId, translationSlug));
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
