import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { versesByJuzQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { VerseList, ReadingToolbar } from "~/components/quran";
import { useAudioStore } from "~/stores/useAudioStore";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { Loading } from "~/components/ui/Loading";
import { TOTAL_JUZ, TOTAL_PAGES } from "@mahfuz/shared/constants";
import { getPagesForJuz } from "@mahfuz/shared";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { AddToReadingListButton } from "~/components/browse/AddToReadingListButton";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

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

function JuzView() {
  const { juzId } = Route.useParams();
  const juzNumber = Number(juzId);
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const { t, locale } = useTranslation();

  const viewModeOptions = useMemo(() => ([
    { value: "normal" as ViewMode, label: t.quranReader.viewModes.normal, icon: VIEW_MODE_ICONS.normal },
    { value: "wordByWord" as ViewMode, label: t.quranReader.viewModes.wordByWord, icon: VIEW_MODE_ICONS.wordByWord },
    { value: "mushaf" as ViewMode, label: t.quranReader.viewModes.mushaf, icon: VIEW_MODE_ICONS.mushaf },
  ]), [t]);
  const queryClient = useQueryClient();
  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const visitJuz = useReadingHistory((s) => s.visitJuz);
  const touchItem = useReadingListStore((s) => s.touchItem);
  useEffect(() => {
    visitJuz(juzNumber);
    touchItem("juz", juzNumber);
  }, [juzNumber, visitJuz, touchItem]);

  const { data } = useSuspenseQuery(versesByJuzQueryOptions(juzNumber));
  const translatedVerses = useTranslatedVerses(data.verses);
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

  const buildChapterAudio = useCallback(async (chId: number): Promise<ChapterAudioData> => {
    const qdcFile = await queryClient.fetchQuery(chapterAudioQueryOptions(reciterId, chId));
    return {
      audioUrl: qdcFile.audio_url,
      verseTimings: qdcFile.verse_timings.map((t) => ({
        verseKey: t.verse_key,
        from: t.timestamp_from,
        to: t.timestamp_to,
        segments: t.segments,
      })),
    };
  }, [queryClient, reciterId]);

  const handlePlayJuz = useCallback(async () => {
    if (isPlayingThisJuz) { togglePlayPause(); return; }
    if (!firstVerse || !firstChapterId) return;
    const audioData = await buildChapterAudio(firstChapterId);
    playVerse(firstChapterId, `Cüz ${juzNumber}`, firstVerse.verse_key, audioData);
  }, [isPlayingThisJuz, togglePlayPause, firstVerse, firstChapterId, buildChapterAudio, playVerse, juzNumber]);

  const handlePlayFromVerse = useCallback(async (verseKey: string) => {
    const chId = Number(verseKey.split(":")[0]);
    const audioData = await buildChapterAudio(chId);
    playVerse(chId, `Cüz ${juzNumber}`, verseKey, audioData);
  }, [buildChapterAudio, playVerse, juzNumber]);

  const hasPrev = juzNumber > 1;
  const hasNext = juzNumber < TOTAL_JUZ;

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      {/* Juz header, compact horizontal */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-[var(--theme-pill-bg)] px-4 py-3.5">
        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left: juz info */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group min-w-0 text-left transition-transform active:scale-[0.97]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[1.75rem] font-semibold tabular-nums leading-none text-[var(--theme-text)]">{juzNumber}</span>
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold text-[var(--theme-text)]">{t.common.juz} {juzNumber}</span>
                <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)]">
              {firstSurah && (
                <>
                  {getSurahName(firstSurah.id, firstSurah.translated_name.name, locale)}
                  {lastSurah && lastSurah.id !== firstSurah.id && `–${getSurahName(lastSurah.id, lastSurah.translated_name.name, locale)}`}
                  {" · "}
                </>
              )}
              {data.pagination.total_records} {t.quranReader.versesUnit} · {t.quranReader.pageAbbr}{pageStart}–{pageEnd}
            </p>
          </button>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handlePlayJuz}
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                {isPlayingThisJuz ? <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <path d="M8 5.14v14l11-7-11-7z" />}
              </svg>
              {isPlayingThisJuz ? t.quranReader.pause : t.quranReader.listen}
            </button>
            <AddToReadingListButton type="juz" id={juzNumber} />
          </div>
        </div>
      </div>

      {/* View mode controls + Reading toolbar, sticky band */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-2 sm:-mx-6 sm:px-2">
        <div className="flex items-center justify-between">
          {/* Left arrow: prev juz */}
          {hasPrev ? (
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber - 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.quranReader.prevJuz}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}

          {/* Center: unified toolbar (icon-only tabs + A ع) */}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex items-center rounded-xl bg-[var(--theme-pill-bg)] p-1">
              <SegmentedControl options={viewModeOptions} value={viewMode} onChange={setViewMode} iconOnlyMobile transparent />
              <div className="mx-0.5 h-4 w-px bg-[var(--theme-border)]" />
              <ReadingToolbar segmentStyle />
            </div>
          </div>

          {/* Right arrow: next juz */}
          {hasNext ? (
            <Link
              to="/juz/$juzId"
              params={{ juzId: String(juzNumber + 1) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.quranReader.nextJuz}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ) : (
            <span className="w-8 shrink-0" />
          )}
        </div>
      </div>

      <VerseList
        verses={translatedVerses}
        onPlayFromVerse={handlePlayFromVerse}
      />

      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to="/juz/$juzId"
            params={{ juzId: String(juzNumber - 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            ← {t.quranReader.prevJuz}
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link
            to="/juz/$juzId"
            params={{ juzId: String(juzNumber + 1) }}
            className="text-[15px] font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            {t.quranReader.nextJuz} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Juz picker overlay */}
      {pickerOpen && (
        <JuzPicker
          currentJuz={juzNumber}
          t={t}
          onSelect={(juz) => {
            setPickerOpen(false);
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
  t,
}: {
  currentJuz: number;
  onSelect: (juz: number) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>["t"];
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
            {t.quranReader.goToJuz}
          </h2>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            {t.common.close}
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
