import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo, type PointerEvent as ReactPointerEvent } from "react";
import { versesByPageQueryOptions, versesByChapterQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { verseAudioQueryOptions } from "~/hooks/useAudio";
import { Bismillah, VerseList, ReadingToolbar } from "~/components/quran";
import { Loading } from "~/components/ui/Loading";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { TOTAL_PAGES } from "@mahfuz/shared/constants";
import { getJuzForPage, getAllJuzRanges } from "@mahfuz/shared";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useAutoScrollToVerse } from "~/hooks/useAutoScrollToVerse";
import type { Chapter, Verse } from "@mahfuz/shared/types";
import type { VerseAudioData } from "@mahfuz/audio-engine";
import { useReadingHistory } from "~/stores/useReadingHistory";

export const Route = createFileRoute("/_app/page/$pageNumber")({
  loader: ({ context, params }) => {
    const pageNum = Number(params.pageNumber);
    return Promise.all([
      context.queryClient.ensureQueryData(versesByPageQueryOptions(pageNum)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Sayfa yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Sayfa ${params.pageNumber} | Mahfuz` }],
  }),
  component: MushafPageView,
});

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "normal",
    label: "Normal",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 4h10M3 8h7M3 12h10" />
      </svg>
    ),
  },
  {
    value: "wordByWord",
    label: "Kelime",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1.5" y="3" width="4" height="4.5" rx="1" />
        <rect x="7.5" y="3" width="4" height="4.5" rx="1" />
        <rect x="1.5" y="9.5" width="4" height="4.5" rx="1" />
        <rect x="7.5" y="9.5" width="4" height="4.5" rx="1" />
      </svg>
    ),
  },
  {
    value: "mushaf",
    label: "Mushaf",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" />
        <path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" />
      </svg>
    ),
  },
];

/**
 * Swipe navigation hook for touch devices.
 * RTL-aware: swipe right = next page, swipe left = previous page.
 */
function useSwipeNavigation(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void },
) {
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 50;
    const MAX_VERTICAL_RATIO = 1.5; // allow up to 1.5x vertical travel

    function onPointerDown(e: globalThis.PointerEvent) {
      // Only track single-finger touch or mouse
      if (e.pointerType === "touch" || e.pointerType === "mouse") {
        pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }
    }

    function onPointerUp(e: globalThis.PointerEvent) {
      if (!pointerStart.current) return;
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      const elapsed = Date.now() - pointerStart.current.time;
      pointerStart.current = null;

      // Ignore slow drags (>500ms) or too-vertical gestures
      if (elapsed > 500) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

      if (dx > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    function onPointerCancel() {
      pointerStart.current = null;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight]);
}

function MushafPageView() {
  const { pageNumber } = Route.useParams();
  const pageNum = Number(pageNumber);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const showTranslation = usePreferencesStore((s) => s.showTranslation);

  const [pickerOpen, setPickerOpen] = useState(false);

  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const { data: versesData } = useSuspenseQuery(versesByPageQueryOptions(pageNum));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  useAutoScrollToVerse();

  const visitPage = useReadingHistory((s) => s.visitPage);
  useEffect(() => { visitPage(pageNum); }, [pageNum, visitPage]);

  // Group verses by chapter_id (derived from verse_key)
  const verseGroups = useMemo(() => {
    const groups: { chapterId: number; chapter: Chapter | undefined; verses: Verse[] }[] = [];
    let currentChapterId = -1;

    for (const verse of versesData.verses) {
      const chId = Number(verse.verse_key.split(":")[0]);
      if (chId !== currentChapterId) {
        currentChapterId = chId;
        groups.push({
          chapterId: chId,
          chapter: chapters.find((ch) => ch.id === chId),
          verses: [],
        });
      }
      groups[groups.length - 1].verses.push(verse);
    }
    return groups;
  }, [versesData.verses, chapters]);

  const juzNumber = getJuzForPage(pageNum);

  // Fullscreen support for Mushaf mode
  const mushafContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (viewMode !== "mushaf" && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [viewMode]);

  const toggleFullscreen = useCallback(() => {
    if (!mushafContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mushafContainerRef.current.requestFullscreen();
    }
  }, []);

  // Audio: play from a specific verse
  const handlePlayFromVerse = useCallback(
    async (verseKey: string) => {
      const chapterId = Number(verseKey.split(":")[0]);
      const ch = chapters.find((c) => c.id === chapterId);
      
      // Fetch both audio and verses to get page information
      const [audioFiles, chapterVerses] = await Promise.all([
        queryClient.fetchQuery(verseAudioQueryOptions(reciterId, chapterId)),
        queryClient.fetchQuery(versesByChapterQueryOptions(chapterId, 1)),
      ]);
      
      const audioData: VerseAudioData[] = audioFiles.map((f) => ({
        verseKey: f.verse_key,
        url: f.url,
        segments: f.segments,
      }));
      
      // Build verse page map
      const versePageMap: Record<string, number> = {};
      for (const verse of chapterVerses.verses) {
        versePageMap[verse.verse_key] = verse.page_number;
      }
      
      playVerse(
        chapterId,
        ch?.translated_name.name || `Sure ${chapterId}`,
        verseKey,
        audioData,
        versePageMap,
      );
    },
    [chapters, queryClient, reciterId, playVerse],
  );

  // Play page audio — starts from first verse on this page
  const firstGroup = verseGroups[0];
  const isPlayingThisPage =
    firstGroup && audioChapterId === firstGroup.chapterId &&
    (playbackState === "playing" || playbackState === "loading");

  const handlePlayPage = useCallback(async () => {
    if (isPlayingThisPage) { togglePlayPause(); return; }
    if (!firstGroup) return;
    const ch = firstGroup.chapter;
    const firstVerseKey = firstGroup.verses[0]?.verse_key;
    if (!firstVerseKey) return;
    
    // Fetch both audio and verses to get page information
    const [audioFiles, chapterVerses] = await Promise.all([
      queryClient.fetchQuery(verseAudioQueryOptions(reciterId, firstGroup.chapterId)),
      queryClient.fetchQuery(versesByChapterQueryOptions(firstGroup.chapterId, 1)),
    ]);
    
    const audioData: VerseAudioData[] = audioFiles.map((f) => ({
      verseKey: f.verse_key, url: f.url, segments: f.segments,
    }));
    
    // Build verse page map
    const versePageMap: Record<string, number> = {};
    for (const verse of chapterVerses.verses) {
      versePageMap[verse.verse_key] = verse.page_number;
    }
    
    playVerse(
      firstGroup.chapterId, 
      ch?.translated_name.name || `Sure ${firstGroup.chapterId}`, 
      firstVerseKey, 
      audioData,
      versePageMap,
    );
  }, [isPlayingThisPage, togglePlayPause, firstGroup, queryClient, reciterId, playVerse]);

  // Keyboard navigation (ArrowLeft/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && pageNum > 1) {
        navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum - 1) } });
      } else if (e.key === "ArrowRight" && pageNum < TOTAL_PAGES) {
        navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum + 1) } });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pageNum, navigate]);

  const hasPrev = pageNum > 1;
  const hasNext = pageNum < TOTAL_PAGES;

  // Swipe navigation (RTL: swipe right = next page, swipe left = prev page)
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const goNext = useCallback(() => {
    if (hasNext) navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum + 1) } });
  }, [hasNext, pageNum, navigate]);
  const goPrev = useCallback(() => {
    if (hasPrev) navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum - 1) } });
  }, [hasPrev, pageNum, navigate]);
  useSwipeNavigation(swipeContainerRef, { onSwipeLeft: goPrev, onSwipeRight: goNext });

  const fullscreenIcon = (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 2 2 6 2" />
      <polyline points="18 6 18 2 14 2" />
      <polyline points="2 14 2 18 6 18" />
      <polyline points="18 14 18 18 14 18" />
    </svg>
  );

  const exitFullscreenIcon = (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 2 6 6 2 6" />
      <polyline points="14 2 14 6 18 6" />
      <polyline points="6 18 6 14 2 14" />
      <polyline points="14 18 14 14 18 14" />
    </svg>
  );

  return (
    <div ref={swipeContainerRef} className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10" style={{ touchAction: "pan-y" }}>
      {/* Page header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-[var(--theme-pill-bg)] px-6 py-10 text-center">
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group mx-auto mb-2 flex flex-col items-center gap-0 transition-transform active:scale-[0.97]"
          >
            <span className="text-[3.5rem] font-semibold tabular-nums leading-tight text-[var(--theme-text)] sm:text-[4rem]">
              {pageNum}
            </span>
            <span className="flex items-center gap-1 text-[17px] font-semibold tracking-[-0.01em] text-[var(--theme-text)]">
              Sayfa {pageNum}
              <svg className="h-3.5 w-3.5 text-[var(--theme-text-tertiary)] transition-transform group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </span>
          </button>
          <div className="mx-auto mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[var(--theme-text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(verseGroups[0].chapterId) }}
                className="transition-colors hover:text-primary-600"
              >
                {verseGroups[0].chapter?.translated_name.name}
              </Link>
              {verseGroups.length > 1 && (
                <>
                  <span>–</span>
                  <Link
                    to="/surah/$surahId"
                    params={{ surahId: String(verseGroups[verseGroups.length - 1].chapterId) }}
                    className="transition-colors hover:text-primary-600"
                  >
                    {verseGroups[verseGroups.length - 1].chapter?.translated_name.name}
                  </Link>
                </>
              )}
            </span>
            <span>·</span>
            <span>{versesData.pagination.total_records} ayet</span>
            <span>·</span>
            <span>Sayfa {pageNum}</span>
            <span>·</span>
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber) }}
              className="rounded-full bg-primary-600/10 px-2 py-0.5 text-[11px] font-medium text-primary-700 transition-colors hover:bg-primary-600/20"
            >
              Cüz {juzNumber}
            </Link>
          </div>

          <button
            onClick={handlePlayPage}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              {isPlayingThisPage ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5.14v14l11-7-11-7z" />
              )}
            </svg>
            {isPlayingThisPage ? "Durakla" : "Sayfayı Dinle"}
          </button>
        </div>
      </div>

      {/* View mode controls + Reading toolbar — sticky band */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-2 sm:-mx-6 sm:px-2">
        <div className="flex items-center justify-between">
          {/* Left arrow — prev page */}
          {pageNum > 1 ? (
            <Link
              to="/page/$pageNumber"
              params={{ pageNumber: String(pageNum - 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Önceki sayfa"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}

          {/* Center content */}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <SegmentedControl options={VIEW_MODE_OPTIONS} value={viewMode} onChange={setViewMode} />
          </div>

          {/* Right group: page info + fullscreen + reading toolbar + arrow */}
          <div className="flex shrink-0 items-center gap-0.5">
            <span className="hidden text-[12px] tabular-nums text-[var(--theme-text-tertiary)] sm:inline">
              Sayfa {pageNum}
            </span>
            {viewMode === "mushaf" && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Tam ekran"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-hover-bg)]"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                {fullscreenIcon}
              </button>
            )}
            <ReadingToolbar />
            {pageNum < TOTAL_PAGES ? (
              <Link
                to="/page/$pageNumber"
                params={{ pageNumber: String(pageNum + 1) }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                aria-label="Sonraki sayfa"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ) : (
              <span className="w-8 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Mushaf fullscreen container */}
      <div
        ref={mushafContainerRef}
        className={isFullscreen ? "h-screen overflow-y-auto bg-[var(--theme-bg)] px-5 py-8 sm:px-6" : ""}
      >
        {/* Exit fullscreen button */}
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Tam ekrandan çık"
            className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-xl transition-colors hover:bg-[var(--theme-hover-bg)]"
            style={{
              background: "color-mix(in srgb, var(--theme-hover-bg) 80%, transparent)",
              color: "var(--theme-text-tertiary)",
            }}
          >
            {exitFullscreenIcon}
          </button>
        )}

        {/* Verses grouped by surah with Bismillah dividers */}
        {verseGroups.map((group, groupIndex) => {
          const isNewSurah = group.verses[0]?.verse_number === 1;
          return (
            <div key={group.chapterId}>
              {/* Surah divider for multi-surah pages */}
              {(groupIndex > 0 || isNewSurah) && group.chapter && (
                <div className="mb-4 mt-8 text-center first:mt-0">
                  <Link
                    to="/surah/$surahId"
                    params={{ surahId: String(group.chapterId) }}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-pill-bg)] px-4 py-2 transition-colors hover:shadow-[var(--shadow-elevated)]"
                  >
                    <span className="arabic-text text-lg leading-none text-[var(--theme-text)]">
                      {group.chapter.name_arabic}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
                      {group.chapter.translated_name.name}
                    </span>
                  </Link>
                </div>
              )}

              {/* Bismillah if surah starts here and has bismillah_pre */}
              {isNewSurah && group.chapter?.bismillah_pre && <Bismillah />}

              {/* Verse list for this group */}
              <VerseList
                verses={group.verses}
                showTranslation={showTranslation}
                onPlayFromVerse={handlePlayFromVerse}
              />
            </div>
          );
        })}
      </div>

      {/* Prev/Next page navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: String(pageNum - 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            ← Önceki Sayfa
          </Link>
        ) : (
          <span />
        )}
        <span className="text-[12px] text-[var(--theme-text-quaternary)]">
          {pageNum} / {TOTAL_PAGES}
        </span>
        {hasNext ? (
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: String(pageNum + 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Sonraki Sayfa →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Page picker overlay */}
      {pickerOpen && (
        <PagePicker
          currentPage={pageNum}
          chapters={chapters}
          onSelect={(p) => {
            setPickerOpen(false);
            navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) } });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// -- Page Picker Overlay --

function PagePicker({
  currentPage,
  chapters,
  onSelect,
  onClose,
}: {
  currentPage: number;
  chapters: Chapter[];
  onSelect: (page: number) => void;
  onClose: () => void;
}) {
  const juzRanges = getAllJuzRanges();
  const currentJuz = getJuzForPage(currentPage);
  const currentJuzRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [activeJuz, setActiveJuz] = useState<number | null>(null);

  // Build page → chapter name lookup
  const pageChapterMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const ch of chapters) {
      for (let p = ch.pages[0]; p <= ch.pages[1]; p++) {
        map[p] = ch.name_simple;
      }
    }
    return map;
  }, [chapters]);

  // Auto-scroll to current juz on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      currentJuzRef.current?.scrollIntoView({ block: "center" });
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Scrubber: resolve juz from pointer Y position
  const getJuzFromY = useCallback((clientY: number) => {
    const el = scrubberRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return Math.min(30, Math.floor(ratio * 30) + 1);
  }, []);

  const scrollToJuz = useCallback((juz: number) => {
    document.getElementById(`picker-juz-${juz}`)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  // Pointer scrub handlers
  const handleScrubStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const juz = getJuzFromY(e.clientY);
    if (juz) { setActiveJuz(juz); scrollToJuz(juz); }
  }, [getJuzFromY, scrollToJuz]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const juz = getJuzFromY(e.clientY);
    if (juz && juz !== activeJuz) { setActiveJuz(juz); scrollToJuz(juz); }
  }, [getJuzFromY, activeJuz, scrollToJuz]);

  const handleScrubEnd = useCallback(() => {
    setActiveJuz(null);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-auto mt-10 flex w-[92%] max-w-[600px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)] sm:mt-14">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
            Sayfaya Git
          </h2>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            Kapat
          </button>
        </div>

        {/* Content area with right-side scrubber */}
        <div className="relative flex max-h-[70vh] min-h-0">
          {/* Scrollable page grid */}
          <div className="flex-1 overflow-y-auto px-3 py-3 pr-8">
            {juzRanges.map(({ juz, start, end }) => (
              <div
                key={juz}
                id={`picker-juz-${juz}`}
                ref={juz === currentJuz ? currentJuzRef : undefined}
                className="mb-5 last:mb-0"
              >
                <p className="sticky top-0 z-10 mb-2 bg-[var(--theme-bg-primary)] py-1 text-[13px] font-semibold text-[var(--theme-text)]">
                  Cüz {juz}
                  <span className="ml-2 text-[12px] font-normal text-[var(--theme-text-tertiary)]">
                    Sayfa {start}–{end}
                  </span>
                </p>
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: end - start + 1 }, (_, i) => {
                    const page = start + i;
                    const isCurrent = page === currentPage;
                    const chapterName = pageChapterMap[page];
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => onSelect(page)}
                        className={`flex flex-col items-center rounded-xl px-1 py-2 transition-all ${
                          isCurrent
                            ? "bg-primary-600 text-white shadow-sm"
                            : "bg-[var(--theme-hover-bg)]/60 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                        }`}
                      >
                        <span className="text-[13px] font-semibold tabular-nums leading-tight">
                          {page}
                        </span>
                        {chapterName && (
                          <span className={`mt-0.5 max-w-full truncate text-[8px] leading-tight ${
                            isCurrent ? "text-white/80" : "text-[var(--theme-text-quaternary)]"
                          }`}>
                            {chapterName}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right-side juz scrubber — Apple Contacts style */}
          <div
            ref={scrubberRef}
            className="absolute right-0 top-0 bottom-0 flex w-7 cursor-pointer flex-col items-center justify-around py-2 select-none touch-none"
            onPointerDown={handleScrubStart}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubEnd}
            onPointerCancel={handleScrubEnd}
          >
            {Array.from({ length: 30 }, (_, i) => {
              const juz = i + 1;
              const isActive = juz === activeJuz;
              const isCurr = juz === currentJuz;
              return (
                <span
                  key={juz}
                  className={`text-[9px] font-semibold tabular-nums leading-none transition-all ${
                    isActive
                      ? "scale-125 text-primary-600"
                      : isCurr
                        ? "text-primary-600"
                        : "text-[var(--theme-text-quaternary)]"
                  }`}
                >
                  {juz}
                </span>
              );
            })}
          </div>

          {/* Floating juz indicator bubble (shown while scrubbing) */}
          {activeJuz && (
            <div className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 rounded-xl bg-primary-600 px-3 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              Cüz {activeJuz}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
