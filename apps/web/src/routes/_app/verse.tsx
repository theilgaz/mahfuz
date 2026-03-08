import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { chapterQueryOptions } from "~/hooks/useChapters";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { Loading } from "~/components/ui/Loading";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { TranslationBlock } from "~/components/quran/TranslationBlock";
import { TOTAL_CHAPTERS } from "@mahfuz/shared/constants";

import type { ChapterAudioData } from "@mahfuz/audio-engine";

export const Route = createFileRoute("/_app/verse")({
  validateSearch: (search: Record<string, unknown>) => ({
    surah: Number(search.surah) || 1,
    verse: Number(search.verse) || 1,
  }),
  loaderDeps: ({ search }) => ({
    surah: search.surah,
    verse: search.verse,
  }),
  loader: ({ context, deps: { surah, verse } }) => {
    const verseKey = `${surah}:${verse}`;
    return Promise.all([
      context.queryClient.ensureQueryData(chapterQueryOptions(surah)),
      context.queryClient.ensureQueryData(verseByKeyQueryOptions(verseKey)),
    ]);
  },
  pendingComponent: () => <Loading text="Ayet yükleniyor..." />,
  head: ({ search }) => {
    const s = search as { surah: number; verse: number } | undefined;
    if (!s) return {};
    return {
      meta: [{ title: `${s.surah}:${s.verse} | Mahfuz` }],
    };
  },
  component: VerseReaderView,
});

/* ── Swipe hook (from $pageNumber.tsx pattern) ── */

function useSwipeNavigation(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void },
) {
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 50;
    const MAX_VERTICAL_RATIO = 1.5;

    function onPointerDown(e: globalThis.PointerEvent) {
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

      if (elapsed > 500) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
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

/* ── Main Component ── */

function VerseReaderView() {
  const { surah, verse: verseNum } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surah));
  const verseKey = `${surah}:${verseNum}`;
  const { data: verse } = useSuspenseQuery(verseByKeyQueryOptions(verseKey));

  // Preferences
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });

  // Audio
  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerseAction = useAudioStore((s) => s.playVerse);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const playbackState = useAudioStore((s) => s.playbackState);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);

  const isCurrentVerse = currentVerseKey === verseKey;
  const isPlaying = isCurrentVerse && playbackState === "playing";
  const isPaused = isCurrentVerse && playbackState === "paused";
  const activeWordPos = isPlaying ? currentWordPosition : null;

  // Auto-advance: when audio engine moves to next verse, navigate to it
  useEffect(() => {
    if (!currentVerseKey || currentVerseKey === verseKey) return;
    // Audio moved to a different verse — follow it
    const [s, v] = currentVerseKey.split(":").map(Number);
    if (s && v && s === surah && playbackState === "playing") {
      navigate({ to: "/verse", search: { surah: s, verse: v } });
    }
  }, [currentVerseKey, verseKey, surah, playbackState, navigate]);

  // Multi-translation support
  const translatedVerses = useTranslatedVerses([verse]);
  const displayVerse = translatedVerses[0] ?? verse;

  // Navigation
  const totalVerses = chapter.verses_count;
  const hasPrev = verseNum > 1;
  const hasNext = verseNum < totalVerses;
  const [showEndPrompt, setShowEndPrompt] = useState(false);

  const goTo = useCallback(
    (s: number, v: number) => {
      setShowEndPrompt(false);
      navigate({ to: "/verse", search: { surah: s, verse: v } });
    },
    [navigate],
  );

  const goNext = useCallback(() => {
    if (hasNext) {
      goTo(surah, verseNum + 1);
    } else {
      setShowEndPrompt(true);
    }
  }, [hasNext, surah, verseNum, goTo]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      goTo(surah, verseNum - 1);
    }
  }, [hasPrev, surah, verseNum, goTo]);

  const goNextSurah = useCallback(() => {
    if (surah < TOTAL_CHAPTERS) {
      goTo(surah + 1, 1);
    }
  }, [surah, goTo]);

  const goBack = useCallback(() => {
    router.history.back();
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, goBack]);

  // Swipe
  const containerRef = useRef<HTMLDivElement>(null);
  useSwipeNavigation(containerRef, {
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  // Prefetch next verse
  useEffect(() => {
    if (hasNext) {
      queryClient.prefetchQuery(verseByKeyQueryOptions(`${surah}:${verseNum + 1}`));
    } else if (surah < TOTAL_CHAPTERS) {
      queryClient.prefetchQuery(chapterQueryOptions(surah + 1));
      queryClient.prefetchQuery(verseByKeyQueryOptions(`${surah + 1}:1`));
    }
  }, [surah, verseNum, hasNext, queryClient]);

  // Audio
  const fetchChapterAudio = useCallback(async (): Promise<ChapterAudioData> => {
    const qdcFile = await queryClient.fetchQuery(
      chapterAudioQueryOptions(reciterId, surah),
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
  }, [queryClient, reciterId, surah]);

  const handlePlayVerse = useCallback(async () => {
    if (isPlaying || isPaused) {
      togglePlayPause();
      return;
    }
    const audioData = await fetchChapterAudio();
    playVerseAction(surah, chapter.translated_name.name, verseKey, audioData);
  }, [isPlaying, isPaused, togglePlayPause, fetchChapterAudio, playVerseAction, surah, chapter.translated_name.name, verseKey]);

  const progress = Math.round((verseNum / totalVerses) * 100);

  return (
    <div
      ref={containerRef}
      className="flex min-h-[calc(100dvh-60px)] flex-col"
      style={{ touchAction: "pan-y" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          aria-label="Geri"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[var(--theme-text)]">
            {chapter.translated_name.name}
          </p>
        </div>
        <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
          {verseNum}/{totalVerses}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Verse card area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        {/* Arabic card */}
        <div className="w-full max-w-lg animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div dir="rtl" className="text-center">
            <p
              className="arabic-text leading-[2.6] text-[var(--theme-text)]"
              style={{ fontSize: `calc(2rem * ${normalArabicFontSize})` }}
            >
              {displayVerse.words
                ? displayVerse.words
                    .filter((w) => w.char_type_name === "word")
                    .map((w, i) => {
                      const isActiveWord =
                        activeWordPos !== null && w.position === activeWordPos;
                      return (
                        <span
                          key={w.id}
                          className={`word-highlight ${isActiveWord ? "active" : ""}`}
                          style={
                            colorizeWords && colors.length > 0
                              ? { color: isActiveWord ? undefined : colors[i % colors.length] }
                              : undefined
                          }
                        >
                          {w.text_uthmani}{" "}
                        </span>
                      );
                    })
                : displayVerse.text_uthmani}
            </p>
          </div>

          {/* Play button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePlayVerse}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isPlaying
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
              }`}
              aria-label={isPlaying ? "Duraklat" : "Ayeti dinle"}
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                {isPlaying ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5.14v14l11-7-11-7z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Translation */}
        {displayVerse.translations && displayVerse.translations.length > 0 && (
          <div className="mt-5 w-full max-w-lg animate-fade-in px-2">
            <TranslationBlock
              translations={displayVerse.translations}
              fontSize={normalTranslationFontSize}
            />
          </div>
        )}

        {/* End-of-surah prompt */}
        {showEndPrompt && (
          <div className="mt-6 w-full max-w-lg animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-5 text-center shadow-[var(--shadow-card)]">
            <p className="mb-3 text-[14px] font-medium text-[var(--theme-text)]">
              Sure bitti.
              {surah < TOTAL_CHAPTERS && " Sonraki sureye geçmek ister misiniz?"}
            </p>
            {surah < TOTAL_CHAPTERS && (
              <button
                onClick={goNextSurah}
                className="rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
              >
                Sonraki Sure
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-[var(--theme-border)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium transition-all disabled:opacity-30 bg-[var(--theme-hover-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Önceki
          </button>
          <button
            onClick={goBack}
            className="flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-medium text-primary-600 transition-all hover:bg-primary-600/10 active:scale-[0.97]"
          >
            Tamam
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext && showEndPrompt}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium transition-all disabled:opacity-30 bg-[var(--theme-hover-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
          >
            Sonraki
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
