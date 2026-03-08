import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

interface LocalTranslationData {
  id: string;
  name: string;
  verses: Record<string, string>;
}

/**
 * Fetches and caches multiple local translation JSON files in parallel.
 * Returns a Map<translationId, Map<verseKey, text>> for all non-API ids.
 * API ids ("diyanet-api") are skipped — they come from the verse response.
 */
export function useLocalTranslations(ids: string[]) {
  const localIds = ids.filter((id) => id !== "diyanet-api");

  const results = useQueries({
    queries: localIds.map((id) => ({
      queryKey: ["local-translation", id],
      queryFn: async () => {
        const resp = await fetch(`/translations/${id}.json`);
        if (!resp.ok) throw new Error(`Failed to load translation: ${id}`);
        const data: LocalTranslationData = await resp.json();
        return { id, verses: new Map(Object.entries(data.verses)) };
      },
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const allLoaded = localIds.length === 0 || results.every((r) => r.isSuccess);

  const localMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const r of results) {
      if (r.data) map.set(r.data.id, r.data.verses);
    }
    return map;
  }, [results]);

  return { localMap, isLoading: !allLoaded };
}
