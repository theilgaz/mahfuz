/**
 * Mushaf sayfası route'u — /page/1 ... /page/604
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { MushafPage } from "~/components/reader/MushafPage";

import { pageDataQueryOptions } from "~/hooks/useQuranQuery";
import { ScrollToTop } from "~/components/ScrollToTop";
import { FontSizeControl } from "~/components/reader/FontSizeControl";
import { useSwipeNav } from "~/hooks/useSwipeNav";
import { useViewTransition } from "~/hooks/useViewTransition";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

const TOTAL_PAGES = 604;

export const Route = createFileRoute("/page/$pageNumber")({
  validateSearch: (search: Record<string, unknown>) => ({
    ayah: (search.ayah as string) || undefined,
  }),
  loader: ({ params, context }) => {
    const pageNumber = parseInt(params.pageNumber, 10);
    return context.queryClient.ensureQueryData(pageDataQueryOptions(pageNumber));
  },
  component: PageRoute,
  errorComponent: RouteErrorFallback,
});

function PageRoute() {
  const { pageNumber } = Route.useParams();
  const { ayah } = Route.useSearch();
  const { navigateWithTransition } = useViewTransition();
  const queryClient = useQueryClient();
  const page = parseInt(pageNumber, 10);

  // Prefetch adjacent pages for instant navigation
  useEffect(() => {
    if (page > 1) queryClient.prefetchQuery(pageDataQueryOptions(page - 1));
    if (page < TOTAL_PAGES) queryClient.prefetchQuery(pageDataQueryOptions(page + 1));
  }, [page, queryClient]);

  const goTo = useCallback(
    (p: number) => {
      if (p < 1 || p > TOTAL_PAGES) return;
      navigateWithTransition({ to: "/page/$pageNumber", params: { pageNumber: String(p) }, search: { ayah: undefined } });
    },
    [navigateWithTransition],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(page + 1);
      if (e.key === "ArrowRight") goTo(page - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, goTo]);

  useSwipeNav({
    onSwipeLeft: () => goTo(page + 1),
    onSwipeRight: () => goTo(page - 1),
  });

  return (
    <div className="min-h-screen relative pb-20">
      <MushafPage pageNumber={page} highlightAyah={ayah} />
      <FontSizeControl mushaf />
      <ScrollToTop />
    </div>
  );
}
