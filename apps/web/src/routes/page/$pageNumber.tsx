/**
 * Mushaf sayfasi route'u -- /page/1 ... /page/604
 *
 * Mobil: Mushaf ekrani kaplar, yukari swipe = mealler, asagi swipe = mushaf.
 * Yatay swipe (+ web'de mouse drag) ile sayfa gecisi (RTL).
 */

import { createFileRoute, useRouter, Link, notFound } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef, useState } from "react";
import { MushafPage } from "~/components/reader/MushafPage";
import { PageJumpDialog } from "~/components/reader/PageJumpDialog";
import { SurahPicker } from "~/components/reader/SurahPicker";

import { pageDataQueryOptions, usePageData } from "~/hooks/useQuranQuery";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";
import { useSettingsStore } from "~/stores/settings.store";
import { useShallow } from "zustand/react/shallow";
import { JUZ_FIRST_PAGE } from "@mahfuz/shared";

const TOTAL_PAGES = 604;
const TOP_BAR_H = 36; // px — top bar height

export const Route = createFileRoute("/page/$pageNumber")({
  validateSearch: (search: Record<string, unknown>) => ({
    ayah: (search.ayah as string) || undefined,
  }),
  loader: async ({ params, context }) => {
    const pageNumber = parseInt(params.pageNumber, 10);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_PAGES) {
      throw notFound();
    }
    const data = await context.queryClient.ensureQueryData(pageDataQueryOptions(pageNumber));
    if (!data) {
      throw notFound();
    }
    return data;
  },
  component: PageRoute,
  errorComponent: RouteErrorFallback,
});

const ZOOM_SCALE = 2.5;

/* ─── Double-tap zoom on mushaf image ─── */
function useZoom(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [zoomed, setZoomed] = useState(false);
  const origin = useRef({ x: 50, y: 50 });
  const translate = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  // Pan state
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panTranslateStart = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback((el: HTMLElement, scale: number) => {
    const t = translate.current;
    el.style.transformOrigin = `${origin.current.x}% ${origin.current.y}%`;
    el.style.transform = scale > 1
      ? `scale(${scale}) translate(${t.x}px, ${t.y}px)`
      : "";
  }, []);

  const resetZoom = useCallback(() => {
    setZoomed(false);
    translate.current = { x: 0, y: 0 };
    const el = containerRef.current;
    if (el) {
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function getRelativePos(clientX: number, clientY: number) {
      const rect = el!.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    }

    function handleDoubleTap(clientX: number, clientY: number) {
      setZoomed((prev) => {
        const next = !prev;
        if (next) {
          origin.current = getRelativePos(clientX, clientY);
          translate.current = { x: 0, y: 0 };
          applyTransform(el!, ZOOM_SCALE);
        } else {
          translate.current = { x: 0, y: 0 };
          el!.style.transform = "";
          el!.style.transformOrigin = "";
        }
        return next;
      });
    }

    // Touch: detect double-tap
    function onTouchEnd(e: TouchEvent) {
      const now = Date.now();
      const dt = now - lastTap.current;
      lastTap.current = now;
      if (dt < 300 && dt > 0 && e.changedTouches.length === 1) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleDoubleTap(touch.clientX, touch.clientY);
      }
    }

    // Mouse: native dblclick
    function onDblClick(e: MouseEvent) {
      e.preventDefault();
      handleDoubleTap(e.clientX, e.clientY);
    }

    // Pan when zoomed
    function onPointerDown(e: PointerEvent) {
      // Read current zoomed state from transform
      if (!el!.style.transform.includes("scale")) return;
      panning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panTranslateStart.current = { ...translate.current };
      el!.style.transition = "none";
      el!.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!panning.current) return;
      const dx = (e.clientX - panStart.current.x) / ZOOM_SCALE;
      const dy = (e.clientY - panStart.current.y) / ZOOM_SCALE;
      translate.current = {
        x: panTranslateStart.current.x + dx,
        y: panTranslateStart.current.y + dy,
      };
      applyTransform(el!, ZOOM_SCALE);
    }

    function onPointerUp() {
      if (!panning.current) return;
      panning.current = false;
      el!.style.transition = "";
    }

    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("dblclick", onDblClick);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("dblclick", onDblClick);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [containerRef, applyTransform]);

  // Reset zoom on page change handled externally
  return { zoomed, resetZoom };
}

/* ─── Pointer-drag helper for web horizontal scroll ─── */
function usePointerDrag(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function onDown(e: PointerEvent) {
      // Only primary button (mouse left / touch)
      if (e.pointerType === "touch") return; // touch handled natively by scroll-snap
      dragging.current = true;
      startX.current = e.clientX;
      startScroll.current = el!.scrollLeft;
      el!.style.scrollSnapType = "none";
      el!.style.cursor = "grabbing";
      el!.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      el!.scrollLeft = startScroll.current - dx;
    }

    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      el!.style.scrollSnapType = "";
      el!.style.cursor = "";
      // Re-snap: nudge scroll so snap kicks in
      el!.scrollBy({ left: 0, behavior: "smooth" });
    }

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [scrollRef]);
}

/* ─── Main route component ─── */
function PageRoute() {
  const { pageNumber } = Route.useParams();
  const { ayah } = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const page = parseInt(pageNumber, 10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const isNavigating = useRef(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [section, setSection] = useState<"mushaf" | "translation">("mushaf");
  const { zoomed, resetZoom } = useZoom(zoomRef);

  const hasPrev = page > 1;
  const hasNext = page < TOTAL_PAGES;

  // Page data for top bar info
  const { translationSlugs, showTranslation } = useSettingsStore(
    useShallow((s) => ({ translationSlugs: s.translationSlugs, showTranslation: s.showTranslation }))
  );
  const { data: pageData } = usePageData(page, translationSlugs);

  const surahGroups = pageData?.surahGroups ?? [];
  const uniqueSurahs = surahGroups.map((g) => g.surah);
  const juzNumber = surahGroups[0]?.ayahs[0]?.juzNumber;

  // Prefetch adjacent pages
  useEffect(() => {
    if (hasPrev) queryClient.prefetchQuery(pageDataQueryOptions(page - 1));
    if (hasNext) queryClient.prefetchQuery(pageDataQueryOptions(page + 1));
  }, [page, hasPrev, hasNext, queryClient]);

  const goTo = useCallback(
    (p: number) => {
      if (p < 1 || p > TOTAL_PAGES) return;
      router.navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) }, search: { ayah: undefined } });
    },
    [router],
  );

  // Reset to mushaf section on page change
  useEffect(() => {
    setSection("mushaf");
    resetZoom();
    verticalRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page, resetZoom]);

  // Center horizontal scroll on the current page panel (RTL layout)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerIndex = hasNext ? 1 : 0;
    const centerPanel = el.children[centerIndex] as HTMLElement | undefined;
    if (centerPanel) {
      centerPanel.scrollIntoView({ inline: "center", behavior: "instant" as ScrollBehavior });
    }
    isNavigating.current = false;
  }, [page, hasNext]);

  // Handle horizontal scroll-snap settle
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollTimer: ReturnType<typeof setTimeout>;

    function onScrollEnd() {
      if (isNavigating.current) return;
      const elRef = scrollRef.current;
      if (!elRef) return;

      const panelWidth = elRef.offsetWidth;

      // In RTL, use scrollIntoView-based detection via panel visibility
      const centerIndex = hasNext ? 1 : 0;
      const centerPanel = elRef.children[centerIndex] as HTMLElement | undefined;
      if (!centerPanel) return;

      // Check which panel is most visible by comparing bounding rects
      const containerRect = elRef.getBoundingClientRect();
      const centerRect = centerPanel.getBoundingClientRect();
      const diff = centerRect.left - containerRect.left;

      if (Math.abs(diff) > panelWidth * 0.25) {
        isNavigating.current = true;
        if (diff > 0 && hasNext) {
          // Content moved right = swiped right-to-left (RTL forward) = next page
          goTo(page + 1);
        } else if (diff < 0 && hasPrev) {
          // Content moved left = swiped left-to-right (RTL backward) = prev page
          goTo(page - 1);
        } else {
          isNavigating.current = false;
        }
      }
    }

    if ("onscrollend" in window) {
      el.addEventListener("scrollend", onScrollEnd);
      return () => el.removeEventListener("scrollend", onScrollEnd);
    } else {
      function onScroll() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(onScrollEnd, 150);
      }
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", onScroll);
        clearTimeout(scrollTimer);
      };
    }
  }, [page, hasPrev, hasNext, goTo]);

  // Track vertical scroll section
  useEffect(() => {
    const el = verticalRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;
    function onScroll() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const scrollTop = el!.scrollTop;
        const threshold = el!.clientHeight * 0.4;
        setSection(scrollTop > threshold ? "translation" : "mushaf");
      }, 100);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  // Web drag support
  usePointerDrag(scrollRef);

  // Keyboard navigation (RTL: ArrowLeft = next, ArrowRight = prev)
  // preventDefault needed to stop browser from natively scrolling the snap container
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") goTo(page + 1);
      if (e.key === "ArrowRight") goTo(page - 1);
      if (e.key === "ArrowDown") {
        verticalRef.current?.scrollTo({ top: verticalRef.current.clientHeight, behavior: "smooth" });
      }
      if (e.key === "ArrowUp") {
        verticalRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, goTo]);

  const mushafHeight = `calc(100dvh - ${TOP_BAR_H}px)`;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Top bar */}
      <div className="flex items-center px-2 shrink-0 border-b border-[var(--color-border)] relative" style={{ height: TOP_BAR_H }}>
        {/* Center: Sure · Sayfa · Cuz */}
        <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
          {/* Surah picker */}
          <SurahPicker currentSurahId={uniqueSurahs[0]?.id ?? 1} mode="page" currentPage={page} />

          <span className="text-[var(--color-text-secondary)] text-[10px]">·</span>

          {/* Page jump */}
          <button
            onClick={() => setJumpOpen(true)}
            className="text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {page}/604
          </button>

          {juzNumber && (
            <>
              <span className="text-[var(--color-text-secondary)] text-[10px]">·</span>
              <button
                onClick={() => goTo(JUZ_FIRST_PAGE[juzNumber] ?? 1)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cuz {juzNumber}
              </button>
            </>
          )}
        </div>

        {/* Exit mushaf mode */}
        <Link
          to="/"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          title="Kapat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
      </div>

      {/* Vertical snap container: mushaf / translations */}
      <div
        ref={verticalRef}
        className={`mushaf-pager flex-1 snap-y snap-mandatory ${zoomed ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {/* Section 1: Mushaf — full viewport height */}
        <div className="snap-start snap-always relative" style={{ height: mushafHeight }}>
          {/* Horizontal scroll-snap for page navigation (RTL: next page on left, prev on right) */}
          <div
            ref={scrollRef}
            dir="rtl"
            className={`mushaf-pager flex snap-x snap-mandatory h-full ${zoomed ? "overflow-hidden" : "overflow-x-auto cursor-grab active:cursor-grabbing"}`}
          >
            {/* Next page ghost (left side in RTL = first in DOM) */}
            {hasNext && (
              <div className="w-full shrink-0 snap-center flex items-center justify-center" style={{ height: mushafHeight }}>
                <img
                  src={`/mushaf-pages/${page + 1}.webp`}
                  alt=""
                  className="max-w-full max-h-full object-contain select-none opacity-40"
                  draggable={false}
                />
              </div>
            )}

            {/* Current page — zoomable */}
            <div className="w-full shrink-0 snap-center flex items-center justify-center overflow-hidden" style={{ height: mushafHeight }}>
              <div
                ref={zoomRef}
                className="flex items-center justify-center h-full mushaf-zoom-container"
                style={zoomed ? { touchAction: "none" } : undefined}
              >
                <img
                  src={`/mushaf-pages/${page}.webp`}
                  alt={`Mushaf page ${page}`}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Previous page ghost (right side in RTL = last in DOM) */}
            {hasPrev && (
              <div className="w-full shrink-0 snap-center flex items-center justify-center" style={{ height: mushafHeight }}>
                <img
                  src={`/mushaf-pages/${page - 1}.webp`}
                  alt=""
                  className="max-w-full max-h-full object-contain select-none opacity-40"
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Pull-up hint for translations */}
          {section === "mushaf" && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none mushaf-hint-fade-in">
              <div className="flex flex-col items-center gap-0.5 text-[var(--color-text-secondary)] opacity-60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="text-[10px]">Meal</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Translations */}
        <div className="snap-start snap-always flex flex-col" style={{ height: mushafHeight }}>
            {/* Back-to-mushaf handle */}
            <button
              onClick={() => verticalRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="shrink-0 w-full flex justify-center py-2 bg-[var(--color-bg)] border-b border-[var(--color-border)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            <div className="flex-1 overflow-y-auto">
              <MushafPage pageNumber={page} highlightAyah={ayah} translationsOnly />
            </div>
        </div>
      </div>

      <PageJumpDialog open={jumpOpen} onClose={() => setJumpOpen(false)} currentPage={page} />
    </div>
  );
}
