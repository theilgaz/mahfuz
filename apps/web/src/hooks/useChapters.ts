import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";

export const chaptersQueryOptions = () =>
  queryOptions({
    queryKey: ["chapters"],
    queryFn: () => quranApi.chapters.list(),
    gcTime: Infinity, // Chapters list never changes — keep in memory permanently
  });

export const chapterQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: ["chapter", chapterId],
    queryFn: () => quranApi.chapters.get(chapterId),
  });
