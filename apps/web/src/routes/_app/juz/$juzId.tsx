import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { versesByJuzQueryOptions, versesByChapterQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { verseAudioQueryOptions } from "~/hooks/useAudio";
import { VerseList, Pagination, ReadingToolbar } from "~/components/quran";
import { useAudioStore } from "~/stores/useAudioStore";
import type { VerseAudioData } from "@mahfuz/audio-engine";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { Loading } from "~/components/ui/Loading";
import { TOTAL_JUZ, TOTAL_PAGES } from "@mahfuz/shared/constants";
import { getPagesForJuz } from "@mahfuz/shared";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { buildVersePageMap } from "~/lib/utils";

export const Route = createFileRoute("/_app/juz/$juzId")({
  loader: ({ context, params }) => {
    const juzId = Number(params.juzId);
    return Promise.all([
      context.queryClient.ensureQueryData(versesByJuzQueryOptions(juzId, 1)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Cüz yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Cüz ${params.juzId} | Mahfuz` }],
  }),
  component: JuzView,
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

function JuzView() {
  const { juzId } = Route.useParams();
  const juzNumber = Number(juzId);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const showTranslation = usePreferencesStore((s) => s.showTranslation);

  const queryClient = useQueryClient();
  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const visitJuz = useReadingHistory((s) => s.visitJuz);
  useEffect(() => { visitJuz(juzNumber); }, [juzNumber, visitJuz]);

  const { data } = useSuspenseQuery(versesByJuzQueryOptions(juzNumber, page));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [pageStart, pageEnd] = getPagesForJuz(juzNumber);

  // Surah range for this juz
  const surahIds = useMemo(() => {
    return [...new Set(data.verses.map((v) => Number(v.verse_key.split(":")[0])))];
  }, [data.verses]);
  const firstSurah = chapters.find((c) => c.id === surahIds[0]);
  const lastSurah = chapters.find((c) => c.id === surahIds[surahIds.length - 1]);

  // First verse info for play
  const firstVerse = data.verses[0];
  const firstChapterId = firstVerse ? Number(firstVerse.verse_key.split(":")[0]) : null;
  const isPlayingThisJuz = firstChapterId !== null && audioChapterId === firstChapterId && (playbackState === "playing" || playbackState === "loading");

  const handlePlayJuz = useCallback(async () => {
    if (isPlayingThisJuz) { togglePlayPause(); return; }
    if (!firstVerse || !firstChapterId) return;
    
    // Fetch both audio and verses for page mapping
    // Note: fetches page 1 only (~50 verses) for the first chapter in juz
    const [audioFiles, chapterVerses] = await Promise.all([
      queryClient.fetchQuery(verseAudioQueryOptions(reciterId, firstChapterId)),
      queryClient.fetchQuery(versesByChapterQueryOptions(firstChapterId, 1)),
    ]);
    
    const audioData: VerseAudioData[] = audioFiles.map((f) => ({ 
      verseKey: f.verse_key, url: f.url, segments: f.segments 
    }));
    
    const versePageMap = buildVersePageMap(chapterVerses.verses);
    
    playVerse(firstChapterId, `Cüz ${juzNumber}`, firstVerse.verse_key, audioData, versePageMap);
  }, [isPlayingThisJuz, togglePlayPause, firstVerse, firstChapterId, queryClient, reciterId, playVerse, juzNumber]);

  const handlePlayFromVerse = useCallback(async (verseKey: string) => {
    const chId = Number(verseKey.split(":")[0]);
    
    // Fetch both audio and verses for page mapping
    // Note: fetches page 1 only (~50 verses) for the chapter
    const [audioFiles, chapterVerses] = await Promise.all([
      queryClient.fetchQuery(verseAudioQueryOptions(reciterId, chId)),
      queryClient.fetchQuery(versesByChapterQueryOptions(chId, 1)),
    ]);
    
    const audioData: VerseAudioData[] = audioFiles.map((f) => ({ 
      verseKey: f.verse_key, url: f.url, segments: f.segments 
    }));
    
    const versePageMap = buildVersePageMap(chapterVerses.verses);
    
    playVerse(chId, `Cüz ${juzNumber}`, verseKey, audioData, versePageMap);
  }, [queryClient, reciterId, playVerse, juzNumber]);

  const hasPrev = juzNumber > 1;
  const hasNext = juzNumber < TOTAL_JUZ;

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      {/* Juz header — standard picker pattern */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-[var(--theme-pill-bg)] px-6 py-10 text-center">
        <div className="relative z-10">
          <span className="mb-2 block text-[3.5rem] font-semibold tabular-nums leading-tight text-[var(--theme-text)] sm:text-[4rem]">
            {juzNumber}
          </span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group mx-auto flex items-center gap-1 transition-transform active:scale-[0.97]"
          >
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--theme-text)]">
              Cüz {juzNumber}
            </span>
            <svg className="h-3.5 w-3.5 text-[var(--theme-text-tertiary)] transition-transform group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
          <div className="mx-auto mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[var(--theme-text-tertiary)]">
            {firstSurah && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Link to="/surah/$surahId" params={{ surahId: String(firstSurah.id) }} className="transition-colors hover:text-primary-600">
                    {firstSurah.translated_name.name}
                  </Link>
                  {lastSurah && lastSurah.id !== firstSurah.id && (
                    <>
                      <span>–</span>
                      <Link to="/surah/$surahId" params={{ surahId: String(lastSurah.id) }} className="transition-colors hover:text-primary-600">
                        {lastSurah.translated_name.name}
                      </Link>
                    </>
                  )}
                </span>
                <span>·</span>
              </>
            )}
            <span>{data.pagination.total_records} ayet</span>
            <span>·</span>
            <Link
              to="/page/$pageNumber"
              params={{ pageNumber: String(pageStart) }}
              className="transition-colors hover:text-primary-600"
            >
              Sayfa {pageStart}–{pageEnd}
            </Link>
            <span>·</span>
            <span className="rounded-full bg-primary-600/10 px-2 py-0.5 text-[11px] font-medium text-primary-700">
              Cüz {juzNumber}
            </span>
          </div>

          <button
            onClick={handlePlayJuz}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              {isPlayingThisJuz ? <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <path d="M8 5.14v14l11-7-11-7z" />}
            </svg>
            {isPlayingThisJuz ? "Durakla" : "Cüzü Dinle"}
          </button>
        </div>
      </div>

      {/* View mode controls + Reading toolbar — sticky band */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-2 sm:-mx-6 sm:px-2">
        <div className="flex items-center justify-between">
          {/* Left arrow — prev juz */}
          {hasPrev ? (
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber - 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Önceki cüz"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}

          {/* Center: unified toolbar (icon-only tabs + A ⚙) */}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex items-center rounded-xl bg-[var(--theme-pill-bg)] p-1">
              <SegmentedControl options={VIEW_MODE_OPTIONS} value={viewMode} onChange={setViewMode} iconOnlyMobile transparent />
              <div className="mx-0.5 h-4 w-px bg-[var(--theme-border)]" />
              <ReadingToolbar segmentStyle />
            </div>
          </div>

          {/* Right arrow — next juz */}
          {hasNext ? (
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber + 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Sonraki cüz"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}
        </div>
      </div>

      <VerseList
        verses={data.verses}
        showTranslation={showTranslation}
        onPlayFromVerse={handlePlayFromVerse}
      />

      <Pagination pagination={data.pagination} onPageChange={setPage} />

      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to="/juz/$juzId"
            params={{ juzId: String(juzNumber - 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={() => setPage(1)}
          >
            ← Önceki Cüz
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link
            to="/juz/$juzId"
            params={{ juzId: String(juzNumber + 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={() => setPage(1)}
          >
            Sonraki Cüz →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Juz picker overlay */}
      {pickerOpen && (
        <JuzPicker
          currentJuz={juzNumber}
          onSelect={(juz) => {
            setPickerOpen(false);
            setPage(1);
            navigate({ to: "/juz/$juzId", params: { juzId: String(juz) } });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// -- Juz Picker Overlay --

function JuzPicker({
  currentJuz,
  onSelect,
  onClose,
}: {
  currentJuz: number;
  onSelect: (juz: number) => void;
  onClose: () => void;
}) {
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
      <div className="mx-auto mt-10 flex w-[92%] max-w-[440px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)] sm:mt-14">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
            Cüze Git
          </h2>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            Kapat
          </button>
        </div>

        {/* Juz grid */}
        <div className="grid grid-cols-5 gap-2 p-4">
          {Array.from({ length: 30 }, (_, i) => {
            const juz = i + 1;
            const isCurrent = juz === currentJuz;
            const [start, end] = getPagesForJuz(juz);
            return (
              <button
                key={juz}
                type="button"
                onClick={() => onSelect(juz)}
                className={`flex flex-col items-center rounded-xl px-1 py-3 transition-all ${
                  isCurrent
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-[var(--theme-hover-bg)]/60 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                }`}
              >
                <span className="text-[16px] font-semibold tabular-nums leading-tight">
                  {juz}
                </span>
                <span className={`mt-1 text-[9px] leading-tight ${
                  isCurrent ? "text-white/70" : "text-[var(--theme-text-quaternary)]"
                }`}>
                  {start}–{end}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
