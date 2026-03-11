import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useAudioStore } from "~/stores/useAudioStore";
import {
  CURATED_RECITERS,
  FEATURED_RECITERS,
} from "@mahfuz/shared/constants";
import type { CuratedReciter } from "@mahfuz/shared/constants";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

export const Route = createFileRoute("/_app/audio/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(chaptersQueryOptions()),
  component: AudioPage,
});

function AudioPage() {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const queryClient = useQueryClient();
  const { locale } = useTranslation();

  const reciterId = useAudioStore((s) => s.reciterId);
  const setReciter = useAudioStore((s) => s.setReciter);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const [chapterSearch, setChapterSearch] = useState("");

  const selectedReciter = useMemo(
    () => CURATED_RECITERS.find((r) => r.id === reciterId),
    [reciterId],
  );

  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return chapters;
    const q = chapterSearch.toLowerCase();
    return chapters.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        getSurahName(c.id, c.translated_name.name, locale).toLowerCase().includes(q) ||
        c.name_arabic.includes(chapterSearch) ||
        String(c.id).startsWith(q),
    );
  }, [chapters, chapterSearch]);

  const handleQuickPlay = useCallback(
    async (chapterId: number, chapterName: string) => {
      // Toggle if already playing this surah
      if (
        audioChapterId === chapterId &&
        (playbackState === "playing" || playbackState === "loading")
      ) {
        togglePlayPause();
        return;
      }
      const qdcFile = await queryClient.fetchQuery(
        chapterAudioQueryOptions(reciterId, chapterId),
      );
      const audioData: ChapterAudioData = {
        audioUrl: qdcFile.audio_url,
        verseTimings: qdcFile.verse_timings.map((t) => ({
          verseKey: t.verse_key,
          from: t.timestamp_from,
          to: t.timestamp_to,
          segments: t.segments,
        })),
      };
      playSurah(chapterId, chapterName, audioData);
    },
    [queryClient, reciterId, playSurah, audioChapterId, playbackState, togglePlayPause],
  );

  // Reciter modal
  const [reciterOpen, setReciterOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      {/* Page header */}
      <h1 className="mb-8 text-[28px] font-bold tracking-tight text-[var(--theme-text)]">
        Dinleme
      </h1>

      {/* Active reciter card */}
      <section className="mb-8">
        <button
          type="button"
          onClick={() => setReciterOpen(true)}
          className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-5 py-4 text-left transition-all hover:border-primary-500/30 hover:shadow-sm"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[15px] font-bold text-primary-700">
            {selectedReciter?.name.charAt(0) ?? "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-tertiary)]">
              Kârî
            </span>
            <span className="block truncate text-[15px] font-semibold text-[var(--theme-text)]">
              {selectedReciter?.name ?? "Seçilmedi"}
            </span>
            <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
              {selectedReciter ? `${selectedReciter.country} · ${selectedReciter.style}` : ""}
            </span>
          </span>
          <svg
            className="h-4 w-4 flex-shrink-0 text-[var(--theme-text-quaternary)] transition-colors group-hover:text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* Sure listesi */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[var(--theme-text)]">
            Sureler
          </h2>
          <span className="text-[12px] text-[var(--theme-text-quaternary)]">
            {chapters.length} sure
          </span>
        </div>
        <input
          type="text"
          placeholder="Sure ara..."
          value={chapterSearch}
          onChange={(e) => setChapterSearch(e.target.value)}
          className="mb-3 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
        />
        <div className="divide-y divide-[var(--theme-border)]/60 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]">
          {filteredChapters.map((c) => {
            const isPlaying =
              audioChapterId === c.id &&
              (playbackState === "playing" || playbackState === "loading");
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                  isPlaying ? "bg-primary-50/40" : ""
                }`}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--theme-hover-bg)] text-[12px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
                  {c.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[var(--theme-text)]">
                      {getSurahName(c.id, c.translated_name.name, locale)}
                    </span>
                    <span className="arabic-text text-[13px] text-[var(--theme-text-tertiary)]" dir="rtl">
                      {c.name_arabic}
                    </span>
                  </span>
                  <span className="block text-[11px] text-[var(--theme-text-tertiary)]">
                    {c.name_simple} · {c.verses_count} ayet
                  </span>
                </span>
                <button
                  onClick={() => handleQuickPlay(c.id, getSurahName(c.id, c.translated_name.name, locale))}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all active:scale-95 ${
                    isPlaying
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-primary-600 hover:text-white"
                  }`}
                  aria-label={`${getSurahName(c.id, c.translated_name.name, locale)} ${isPlaying ? "durakla" : "dinle"}`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    {isPlaying ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      <path d="M8 5.14v14l11-7-11-7z" />
                    )}
                  </svg>
                </button>
              </div>
            );
          })}
          {filteredChapters.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-tertiary)]">
              Sonuç bulunamadı.
            </p>
          )}
        </div>
      </section>

      {/* Reciter picker overlay */}
      {reciterOpen && (
        <ReciterPicker
          currentId={reciterId}
          onSelect={(id) => {
            setReciter(id);
            setReciterOpen(false);
          }}
          onClose={() => setReciterOpen(false)}
        />
      )}
    </div>
  );
}

/* ---- Reciter Picker Overlay ---- */

function ReciterPicker({
  currentId,
  onSelect,
  onClose,
}: {
  currentId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const nonFeatured = useMemo(
    () => CURATED_RECITERS.filter((r) => !r.featured),
    [],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return CURATED_RECITERS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-2xl bg-[var(--theme-bg-primary)] p-5 shadow-modal sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[var(--theme-text)]">
            Kârî Seçimi
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          placeholder="Kârî ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
        />

        <div className="max-h-[50vh] overflow-y-auto">
          {filtered ? (
            filtered.length > 0 ? (
              <div className="space-y-0.5">
                {filtered.map((r) => (
                  <ReciterRow
                    key={`${r.id}-${r.style}`}
                    reciter={r}
                    isActive={r.id === currentId}
                    isFeatured={r.featured}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[var(--theme-text-tertiary)]">
                Sonuç bulunamadı.
              </p>
            )
          ) : (
            <>
              <div className="mb-3">
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                  Öne Çıkanlar
                </p>
                <div className="space-y-0.5">
                  {FEATURED_RECITERS.map((r) => (
                    <ReciterRow
                      key={`${r.id}-${r.style}`}
                      reciter={r}
                      isActive={r.id === currentId}
                      isFeatured
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                  Tüm Kârîler
                </p>
                <div className="space-y-0.5">
                  {nonFeatured.map((r) => (
                    <ReciterRow
                      key={`${r.id}-${r.style}`}
                      reciter={r}
                      isActive={r.id === currentId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReciterRow({
  reciter,
  isActive,
  isFeatured,
  onSelect,
}: {
  reciter: CuratedReciter;
  isActive: boolean;
  isFeatured?: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      onClick={() => onSelect(reciter.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-primary-600/10 text-primary-700"
          : isFeatured
            ? "border border-primary-500/20 bg-primary-50/30 text-[var(--theme-text)] hover:bg-primary-50/60"
            : "text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)]"
      }`}
    >
      <span className="flex-1">
        <span className="block text-[14px] font-medium">
          {reciter.name}
        </span>
        <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
          {reciter.country} · {reciter.style}
        </span>
      </span>
      {isActive ? (
        <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : isFeatured ? (
        <svg className="h-4 w-4 flex-shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : null}
    </button>
  );
}
