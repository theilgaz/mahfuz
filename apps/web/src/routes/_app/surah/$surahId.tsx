import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { chapterQueryOptions, chaptersQueryOptions } from "~/hooks/useChapters";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { verseAudioQueryOptions } from "~/hooks/useAudio";
import { VerseList, Pagination, ReadingToolbar } from "~/components/quran";
import { Loading } from "~/components/ui/Loading";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { TOTAL_CHAPTERS, TOTAL_PAGES } from "@mahfuz/shared/constants";
import { getJuzForPage } from "@mahfuz/shared";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useAutoScrollToVerse } from "~/hooks/useAutoScrollToVerse";
import type { Chapter } from "@mahfuz/shared/types";
import type { VerseAudioData } from "@mahfuz/audio-engine";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { TOPIC_INDEX } from "~/data/topic-index";

export const Route = createFileRoute("/_app/surah/$surahId")({
  validateSearch: (search: Record<string, unknown>) => ({
    verse: search.verse ? Number(search.verse) : undefined,
    topic: typeof search.topic === "number" ? search.topic : undefined,
  }),
  loader: ({ context, params }) => {
    const chapterId = Number(params.surahId);
    return Promise.all([
      context.queryClient.ensureQueryData(chapterQueryOptions(chapterId)),
      context.queryClient.ensureQueryData(
        versesByChapterQueryOptions(chapterId, 1)
      ),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Sure yükleniyor..." />,
  head: ({ loaderData }) => {
    const chapter = loaderData?.[0];
    if (!chapter) return {};
    return {
      meta: [
        {
          title: `${chapter.translated_name.name} (${chapter.name_simple}) | Mahfuz`,
        },
      ],
    };
  },
  component: SurahView,
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

function SurahView() {
  const { surahId } = Route.useParams();
  const { verse: verseParam, topic: topicParam } = Route.useSearch();
  const chapterId = Number(surahId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const showTranslation = usePreferencesStore((s) => s.showTranslation);

  const reciterId = useAudioStore((s) => s.reciterId);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(chapterId));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const { data: versesData } = useSuspenseQuery(
    versesByChapterQueryOptions(chapterId, page)
  );

  useAutoScrollToVerse();

  // Scroll to verse from ?verse= search param (e.g. from CommandPalette)
  useEffect(() => {
    if (!verseParam) return;
    const verseKey = `${chapterId}:${verseParam}`;
    // Wait for DOM to render verses
    const timer = setTimeout(() => {
      const el = document.getElementById(`verse-${verseKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Brief highlight
        el.classList.add("ring-2", "ring-primary-400/50", "rounded-xl");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary-400/50", "rounded-xl");
        }, 2000);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [chapterId, verseParam]);

  const visitSurah = useReadingHistory((s) => s.visitSurah);
  useEffect(() => { visitSurah(chapterId, chapter.translated_name.name); }, [chapterId, chapter.translated_name.name, visitSurah]);

  const juzNumber = getJuzForPage(chapter.pages[0]);

  // Fullscreen support for Mushaf mode
  const mushafContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Exit fullscreen when switching away from mushaf
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

  const isPlayingThisSurah =
    audioChapterId === chapterId &&
    (playbackState === "playing" || playbackState === "loading");

  const fetchAudioData = useCallback(async (): Promise<VerseAudioData[]> => {
    const audioFiles = await queryClient.fetchQuery(
      verseAudioQueryOptions(reciterId, chapterId),
    );
    return audioFiles.map((f) => ({
      verseKey: f.verse_key,
      url: f.url,
      segments: f.segments,
    }));
  }, [queryClient, reciterId, chapterId]);

  /** Fetch Bismillah audio (verse 1:1 from Al-Fatiha) to prepend before surahs */
  const fetchBismillahAudio = useCallback(async (): Promise<VerseAudioData | null> => {
    if (!chapter.bismillah_pre) return null;
    const fatihaAudio = await queryClient.fetchQuery(
      verseAudioQueryOptions(reciterId, 1),
    );
    const bismillah = fatihaAudio.find((f) => f.verse_key === "1:1");
    if (!bismillah) return null;
    return {
      verseKey: "bismillah",
      url: bismillah.url,
      segments: bismillah.segments,
    };
  }, [queryClient, reciterId, chapter.bismillah_pre]);

  const handlePlaySurah = useCallback(async () => {
    if (isPlayingThisSurah) {
      togglePlayPause();
      return;
    }
    const [audioData, bismillah] = await Promise.all([
      fetchAudioData(),
      fetchBismillahAudio(),
    ]);
    const playlist = bismillah ? [bismillah, ...audioData] : audioData;
    
    // Build verse page map
    const versePageMap: Record<string, number> = {};
    for (const verse of versesData.verses) {
      versePageMap[verse.verse_key] = verse.page_number;
    }
    
    playSurah(chapterId, chapter.translated_name.name, playlist, versePageMap);
  }, [
    isPlayingThisSurah,
    togglePlayPause,
    fetchAudioData,
    fetchBismillahAudio,
    playSurah,
    chapterId,
    chapter.translated_name.name,
    versesData.verses,
  ]);

  const handlePlayFromVerse = useCallback(
    async (verseKey: string) => {
      const [audioData, bismillah] = await Promise.all([
        fetchAudioData(),
        fetchBismillahAudio(),
      ]);
      // Prepend Bismillah when playing from the first verse
      const isFirstVerse = verseKey === `${chapterId}:1`;
      const playlist =
        bismillah && isFirstVerse ? [bismillah, ...audioData] : audioData;
      const playKey = bismillah && isFirstVerse ? "bismillah" : verseKey;
      
      // Build verse page map
      const versePageMap: Record<string, number> = {};
      for (const verse of versesData.verses) {
        versePageMap[verse.verse_key] = verse.page_number;
      }
      
      playVerse(
        chapterId,
        chapter.translated_name.name,
        playKey,
        playlist,
        versePageMap,
      );
    },
    [fetchAudioData, fetchBismillahAudio, playVerse, chapterId, chapter.translated_name.name, versesData.verses],
  );

  const hasPrev = chapterId > 1;
  const hasNext = chapterId < TOTAL_CHAPTERS;

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
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      {/* Topic navigation bar (when coming from Fihrist) */}
      {topicParam !== undefined && TOPIC_INDEX[topicParam] && (
        <TopicNavBar topicIndex={topicParam} currentSurahId={chapterId} />
      )}

      {/* Surah header — standard picker pattern */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-[var(--theme-pill-bg)] px-6 py-10 text-center">
        <div className="relative z-10">
          <h1
            className="arabic-text mb-3 text-[3.5rem] leading-tight text-[var(--theme-text)] sm:text-[4rem]"
            dir="rtl"
          >
            {chapter.name_arabic}
          </h1>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group mx-auto flex items-center gap-1 transition-transform active:scale-[0.97]"
          >
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--theme-text)]">
              {chapter.translated_name.name}
            </span>
            <svg className="h-3.5 w-3.5 text-[var(--theme-text-tertiary)] transition-transform group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">{chapter.name_simple}</p>
          <div className="mx-auto mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[var(--theme-text-tertiary)]">
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(chapter.id) }}
              className="transition-colors hover:text-primary-600"
            >
              {chapter.translated_name.name}
            </Link>
            <span>·</span>
            <span>{chapter.verses_count} ayet</span>
            <span>·</span>
            <Link
              to="/page/$pageNumber"
              params={{ pageNumber: String(chapter.pages[0]) }}
              className="transition-colors hover:text-primary-600"
            >
              Sayfa {chapter.pages[0]}–{chapter.pages[1]}
            </Link>
            <span>·</span>
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber) }}
              className="rounded-full bg-primary-600/10 px-2 py-0.5 text-[11px] font-medium text-primary-700 transition-colors hover:bg-primary-600/20"
            >
              Cüz {juzNumber}
            </Link>
          </div>

          {/* Play surah button */}
          <button
            onClick={handlePlaySurah}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {isPlayingThisSurah ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5.14v14l11-7-11-7z" />
              )}
            </svg>
            {isPlayingThisSurah ? "Durakla" : "Sureyi Dinle"}
          </button>
        </div>
      </div>

      {/* View mode controls + Reading toolbar — sticky band */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-2 sm:-mx-6 sm:px-2">
        <div className="flex items-center justify-between">
          {/* Left arrow — prev surah */}
          {chapterId > 1 ? (
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(chapterId - 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Önceki sure"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}

          {/* Center: unified toolbar (icon-only tabs + A ع) */}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex items-center rounded-xl bg-[var(--theme-pill-bg)] p-1">
              <SegmentedControl options={VIEW_MODE_OPTIONS} value={viewMode} onChange={setViewMode} iconOnlyMobile transparent />
              <div className="mx-0.5 h-4 w-px bg-[var(--theme-border)]" />
              <ReadingToolbar segmentStyle />
            </div>
          </div>

          {/* Right group: fullscreen + arrow */}
          <div className="flex shrink-0 items-center gap-0.5">
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
            {chapterId < TOTAL_CHAPTERS ? (
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(chapterId + 1) }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                aria-label="Sonraki sure"
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
        {/* Exit fullscreen button — inside container so it's visible in fullscreen */}
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

        {/* Verses (Bismillah is rendered automatically by VerseList for the first verse of a surah) */}
        <VerseList
          verses={versesData.verses}
          showTranslation={showTranslation}
          onPlayFromVerse={handlePlayFromVerse}
          onTogglePlayPause={togglePlayPause}
        />
      </div>

      {/* Pagination */}
      <Pagination pagination={versesData.pagination} onPageChange={setPage} />

      {/* Prev/Next surah navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to="/surah/$surahId"
            params={{ surahId: String(chapterId - 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={() => setPage(1)}
          >
            ← Önceki Sure
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link
            to="/surah/$surahId"
            params={{ surahId: String(chapterId + 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={() => setPage(1)}
          >
            Sonraki Sure →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Surah picker overlay */}
      {pickerOpen && (
        <SurahPicker
          currentChapterId={chapterId}
          chapters={chapters}
          onSelect={(id) => {
            setPickerOpen(false);
            setPage(1);
            navigate({ to: "/surah/$surahId", params: { surahId: String(id) } });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// -- Surah Picker Overlay --

function SurahPicker({
  currentChapterId,
  chapters,
  onSelect,
  onClose,
}: {
  currentChapterId: number;
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        ch.translated_name.name.toLowerCase().includes(q) ||
        String(ch.id).startsWith(q),
    );
  }, [chapters, search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to current surah on mount (only when not searching)
  useEffect(() => {
    if (!search) {
      requestAnimationFrame(() => {
        currentRef.current?.scrollIntoView({ block: "center" });
      });
    }
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-auto mt-10 flex w-[92%] max-w-[520px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)] sm:mt-14">
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sure ara..."
            className="flex-1 bg-transparent text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none"
          />
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            Kapat
          </button>
        </div>

        {/* Surah list */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map((ch) => {
            const isCurrent = ch.id === currentChapterId;
            return (
              <button
                key={ch.id}
                ref={isCurrent ? currentRef : undefined}
                type="button"
                onClick={() => onSelect(ch.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isCurrent
                    ? "bg-primary-600/10"
                    : "hover:bg-[var(--theme-hover-bg)]"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                  isCurrent
                    ? "bg-primary-600 text-white"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"
                }`}>
                  {ch.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--theme-text)]">
                      {ch.translated_name.name}
                    </span>
                    <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                      {ch.name_simple}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
                    <span>{ch.verses_count} ayet</span>
                    <span>·</span>
                    <span>Sayfa {ch.pages[0]}–{ch.pages[1]}</span>
                  </div>
                </div>
                <span className="arabic-text shrink-0 text-base text-[var(--theme-text-secondary)]" dir="rtl">
                  {ch.name_arabic}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">
              Sonuç bulunamadı
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Topic Navigation Bar (when coming from Fihrist) --

function TopicNavBar({ topicIndex, currentSurahId }: { topicIndex: number; currentSurahId: number }) {
  const topic = TOPIC_INDEX[topicIndex];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active ref
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-active]");
    if (el) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [currentSurahId]);

  return (
    <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] p-3">
      {/* Header row */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[18px] leading-none">{topic.icon}</span>
        <span className="flex-1 text-[13px] font-semibold text-[var(--theme-text)]">{topic.topic}</span>
        <Link
          to="/browse/$tab"
          params={{ tab: "index" }}
          search={{ topic: topicIndex }}
          className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
        >
          Fihrist'e Dön
        </Link>
      </div>
      {/* Scrollable refs */}
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {topic.refs.map((ref) => {
          const [surah, verseRange] = ref.split(":");
          const surahId = Number(surah);
          const firstVerse = verseRange?.split("-")[0];
          const isActive = surahId === currentSurahId;
          return (
            <Link
              key={ref}
              to="/surah/$surahId"
              params={{ surahId: surah }}
              search={{ topic: topicIndex, verse: firstVerse ? Number(firstVerse) : undefined }}
              {...(isActive ? { "data-active": true } : {})}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium tabular-nums transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-primary-600/10 hover:text-primary-700"
              }`}
            >
              {ref}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
