/**
 * Mushaf sayfası route'u — /page/1 ... /page/604
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { MushafPage } from "~/components/reader/MushafPage";
import { AudioBar } from "~/components/reader/AudioBar";
import { pageDataQueryOptions } from "~/hooks/useQuranQuery";
import { ScrollToTop } from "~/components/ScrollToTop";
import { FontSizeControl } from "~/components/reader/FontSizeControl";
import { useSwipeNav } from "~/hooks/useSwipeNav";
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
  const navigate = useNavigate();
  const page = parseInt(pageNumber, 10);

  const goTo = useCallback(
    (p: number) => {
      if (p < 1 || p > TOTAL_PAGES) return;
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) }, search: { ayah: undefined } });
    },
    [navigate],
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
      <FontSizeControl />
      <AudioBar />
      <ScrollToTop />
    </div>
  );
}
