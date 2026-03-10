import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Quran data is static
        gcTime: 1000 * 60 * 60 * 24, // 24 hours — Quran data is static, keep in memory longer
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });
}
