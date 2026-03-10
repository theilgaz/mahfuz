/**
 * Word-by-word data hook — fetches from quran.com API ONLY for WBW mode.
 * This is the only remaining quran.com text API dependency.
 */
import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";
import type { GetVersesParams } from "@mahfuz/shared/types";

const WBW_PARAMS: GetVersesParams = {
  words: true,
  perPage: 286, // max verses in a chapter (Baqara) — load all at once
  wordFields: ["text_uthmani", "text_imlaei"],
  translationFields: [],
  fields: ["text_uthmani"],
};

/**
 * Fetch word-by-word data for all verses in a chapter.
 * Only used when viewMode === "wordByWord".
 */
export const wbwByChapterQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: ["wbw", "chapter", chapterId],
    queryFn: async () => {
      // Fetch all pages of WBW data
      const firstPage = await quranApi.verses.byChapter(chapterId, {
        ...WBW_PARAMS,
        page: 1,
      });

      let allVerses = [...firstPage.verses];

      // If there are more pages, fetch them
      if (firstPage.pagination && firstPage.pagination.total_pages > 1) {
        for (let p = 2; p <= firstPage.pagination.total_pages; p++) {
          const pageData = await quranApi.verses.byChapter(chapterId, {
            ...WBW_PARAMS,
            page: p,
          });
          allVerses.push(...pageData.verses);
        }
      }

      return allVerses;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
