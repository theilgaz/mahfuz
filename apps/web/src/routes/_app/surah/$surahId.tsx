import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { chapterQueryOptions, chaptersQueryOptions } from "~/hooks/useChapters";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { wbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { VerseList, ReadingToolbar } from "~/components/quran";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";
import { TOTAL_CHAPTERS, TOTAL_PAGES } from "@mahfuz/shared/constants";
import { getJuzForPage } from "@mahfuz/shared";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useAutoScrollToVerse } from "~/hooks/useAutoScrollToVerse";
import type { Chapter } from "@mahfuz/shared/types";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { AddToReadingListButton } from "~/components/browse/AddToReadingListButton";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import type { TopicEntry } from "~/data/topic-index";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

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
  pendingComponent: () => (
    <div className="mx-auto max-w-[680px] px-5 py-5 sm:px-6 sm:py-10">
      <div className="mb-6 text-center">
        <Skeleton className="mx-auto mb-2 h-6 w-32" />
        <Skeleton className="mx-auto h-4 w-24" />
      </div>
      <Skeleton className="mx-auto mb-8 h-8 w-64" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4">
            <Skeleton className="mb-3 h-6 w-full" />
            <Skeleton lines={2} />
          </div>
        ))}
      </div>
    </div>
  ),
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

const VIEW_MODE_ICONS: Record<ViewMode, React.ReactNode> = {
  normal: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h7M3 12h10" />
    </svg>
  ),
  wordByWord: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5" y="3" width="4" height="4.5" rx="1" />
      <rect x="7.5" y="3" width="4" height="4.5" rx="1" />
      <rect x="1.5" y="9.5" width="4" height="4.5" rx="1" />
      <rect x="7.5" y="9.5" width="4" height="4.5" rx="1" />
    </svg>
  ),
  mushaf: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" />
      <path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" />
    </svg>
  ),
};

function SurahView() {
  const { surahId } = Route.useParams();
  const { verse: verseParam, topic: topicParam } = Route.useSearch();
  const chapterId = Number(surahId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const { t, locale } = useTranslation();

  const viewModeOptions = useMemo(() => ([
    { value: "normal" as ViewMode, label: t.quranReader.viewModes.normal, icon: VIEW_MODE_ICONS.normal },
    { value: "wordByWord" as ViewMode, label: t.quranReader.viewModes.wordByWord, icon: VIEW_MODE_ICONS.wordByWord },
    { value: "mushaf" as ViewMode, label: t.quranReader.viewModes.mushaf, icon: VIEW_MODE_ICONS.mushaf },
  ]), [t]);
  const reciterId = useAudioStore((s) => s.reciterId);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(chapterId));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const { data: versesData } = useSuspenseQuery(
    versesByChapterQueryOptions(chapterId)
  );
  // Lazy-load WBW word data (translation, transliteration, positions) for tooltips + audio word sync
  const { data: wbwData } = useQuery(wbwByChapterQueryOptions(chapterId));
  const versesWithWords = useMemo(
    () => mergeWbwIntoVerses(versesData.verses, wbwData),
    [versesData.verses, wbwData],
  );
  const translatedVerses = useTranslatedVerses(versesWithWords);

  useAutoScrollToVerse();

  // Scroll to verse from ?verse= search param is handled by VerseList's scrollToVerse prop

  // Lazy-load TOPIC_INDEX only when topicParam is present (saves ~5-10KB from bundle)
  const [topicData, setTopicData] = useState<TopicEntry[] | null>(null);
  useEffect(() => {
    if (topicParam !== undefined) {
      import("~/data/topic-index").then((m) => setTopicData(m.TOPIC_INDEX));
    } else {
      setTopicData(null);
    }
  }, [topicParam]);

  const visitSurah = useReadingHistory((s) => s.visitSurah);
  const touchItem = useReadingListStore((s) => s.touchItem);
  useEffect(() => {
    visitSurah(chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale));
    touchItem("surah", chapterId);
  }, [chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale), visitSurah, touchItem]);

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

  const fetchChapterAudio = useCallback(async (): Promise<ChapterAudioData> => {
    const qdcFile = await queryClient.fetchQuery(
      chapterAudioQueryOptions(reciterId, chapterId),
    );
    return {
      audioUrl: qdcFile.audio_url,
      verseTimings: qdcFile.verse_timings.map((t) => ({
        verseKey: t.verse_key,
        from: t.timestamp_from,
        to: t.timestamp_to,
        segments: t.segments,
      })),
    };
  }, [queryClient, reciterId, chapterId]);

  const handlePlaySurah = useCallback(async () => {
    if (isPlayingThisSurah) {
      togglePlayPause();
      return;
    }
    const audioData = await fetchChapterAudio();
    playSurah(chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale), audioData);
  }, [
    isPlayingThisSurah,
    togglePlayPause,
    fetchChapterAudio,
    playSurah,
    chapterId,
    getSurahName(chapter.id, chapter.translated_name.name, locale),
  ]);

  const handlePlayFromVerse = useCallback(
    async (verseKey: string) => {
      const audioData = await fetchChapterAudio();
      playVerse(
        chapterId,
        getSurahName(chapter.id, chapter.translated_name.name, locale),
        verseKey,
        audioData,
      );
    },
    [fetchChapterAudio, playVerse, chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale)],
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
    <div className="mx-auto max-w-[680px] px-4 py-5 sm:px-6 sm:py-10">
      {/* Topic navigation bar (when coming from Fihrist) */}
      {topicParam !== undefined && topicData && topicData[topicParam] && (
        <TopicNavBar topic={topicData[topicParam]} topicIndex={topicParam} currentSurahId={chapterId} t={t} />
      )}

      {/* Surah header */}
      <div className="relative mb-4 rounded-2xl bg-[var(--theme-pill-bg)] px-4 py-3.5 sm:mb-6">
        {/* Top-right: bookmark + A ع */}
        <div className="absolute top-2.5 right-3 flex items-center gap-0.5">
          <AddToReadingListButton type="surah" id={chapterId} iconOnly />
          <ReadingToolbar segmentStyle />
        </div>

        <div className="relative">
          {/* Surah name */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group min-w-0 text-left transition-transform active:scale-[0.97]"
          >
            <div className="flex items-center gap-2">
              <h1 className="arabic-text text-[1.75rem] leading-none text-[var(--theme-text)]" dir="rtl">
                {chapter.name_arabic}
              </h1>
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold text-[var(--theme-text)]">{getSurahName(chapter.id, chapter.translated_name.name, locale)}</span>
                <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)]">
              {chapter.verses_count} {t.quranReader.versesUnit} · {t.quranReader.pageAbbr}{chapter.pages[0]}–{chapter.pages[1]} · {t.common.juz} {juzNumber}
            </p>
          </button>

          {/* Action row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handlePlaySurah}
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                {isPlayingThisSurah ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5.14v14l11-7-11-7z" />
                )}
              </svg>
              {isPlayingThisSurah ? t.quranReader.pause : t.quranReader.listen}
            </button>

            {/* View mode picker */}
            <div className="relative" ref={modeRef}>
              <button
                type="button"
                onClick={() => setModeOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
                  modeOpen
                    ? "bg-[var(--theme-text)] text-[var(--theme-bg)]"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
                }`}
              >
                {VIEW_MODE_ICONS[viewMode]}
                {viewModeOptions.find((o) => o.value === viewMode)?.label}
              </button>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setModeOpen(false)} />
                  <div className="absolute left-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] py-1 shadow-[var(--shadow-float)]">
                    {viewModeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setViewMode(opt.value); setModeOpen(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium transition-colors ${
                          viewMode === opt.value
                            ? "bg-primary-600/10 text-primary-600"
                            : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                        {viewMode === opt.value && (
                          <svg className="ml-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link
              to="/verse"
              search={{ surah: chapterId, verse: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 3v18M3 12h18" />
              </svg>
              {t.quranReader.verseByVerse}
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky nav: prev/next arrows only */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-1 sm:-mx-6 sm:mb-6 sm:px-2">
        <div className="flex items-center justify-between">
          {chapterId > 1 ? (
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(chapterId - 1) }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.nav.prevSurah}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
          ) : (
            <span className="w-7 shrink-0" />
          )}

          <span className="text-[11px] font-medium tabular-nums text-[var(--theme-text-quaternary)]">
            {getSurahName(chapter.id, chapter.translated_name.name, locale)}
          </span>

          <div className="flex shrink-0 items-center gap-0.5">
            {viewMode === "mushaf" && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={t.quranReader.fullscreen}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-hover-bg)]"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                {fullscreenIcon}
              </button>
            )}
            {chapterId < TOTAL_CHAPTERS ? (
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(chapterId + 1) }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                aria-label={t.nav.nextSurah}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ) : (
              <span className="w-7 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Mushaf fullscreen container */}
      <div
        ref={mushafContainerRef}
        className={isFullscreen ? "h-screen overflow-y-auto bg-[var(--theme-bg)] px-5 py-8 sm:px-6" : ""}
      >
        {/* Exit fullscreen button, inside container so it's visible in fullscreen */}
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={t.quranReader.exitFullscreen}
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
          verses={translatedVerses}
          onPlayFromVerse={handlePlayFromVerse}
          onTogglePlayPause={togglePlayPause}
          scrollToVerse={verseParam}
        />
      </div>

      {/* Prev/Next surah navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to="/surah/$surahId"
            params={{ surahId: String(chapterId - 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"

          >
            ← {t.quranReader.prevSurah}
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link
            to="/surah/$surahId"
            params={{ surahId: String(chapterId + 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"

          >
            {t.quranReader.nextSurah} →
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
          t={t}
          locale={locale}
          onSelect={(id) => {
            setPickerOpen(false);
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
  t,
  locale,
}: {
  currentChapterId: number;
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>["t"];
  locale: "tr" | "en";
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
        getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) ||
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
            placeholder={t.surahPicker.placeholder}
            className="flex-1 bg-transparent text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none"
          />
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            {t.common.close}
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
                      {getSurahName(ch.id, ch.translated_name.name, locale)}
                    </span>
                    <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                      {ch.name_simple}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
                    <span>{ch.verses_count} {t.quranReader.versesUnit}</span>
                    <span>·</span>
                    <span>{t.common.page} {ch.pages[0]}–{ch.pages[1]}</span>
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
              {t.common.noResults}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Topic Navigation Bar (when coming from Fihrist) --

function TopicNavBar({ topic, topicIndex, currentSurahId, t }: { topic: TopicEntry; topicIndex: number; currentSurahId: number; t: ReturnType<typeof useTranslation>["t"] }) {
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
          {t.quranReader.backToIndex}
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
