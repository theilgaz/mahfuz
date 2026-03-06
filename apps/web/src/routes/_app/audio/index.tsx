import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { recitersQueryOptions, verseAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { useAudioStore } from "~/stores/useAudioStore";
import type { VerseAudioData } from "@mahfuz/audio-engine";

export const Route = createFileRoute("/_app/audio/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(recitersQueryOptions()),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]),
  component: AudioPage,
});

function AudioPage() {
  const { data: reciters } = useSuspenseQuery(recitersQueryOptions());
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const queryClient = useQueryClient();

  const reciterId = useAudioStore((s) => s.reciterId);
  const setReciter = useAudioStore((s) => s.setReciter);
  const playSurah = useAudioStore((s) => s.playSurah);

  const [reciterSearch, setReciterSearch] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");

  const filteredReciters = reciters.filter(
    (r) =>
      r.reciter_name.toLowerCase().includes(reciterSearch.toLowerCase()) ||
      r.translated_name.name.toLowerCase().includes(reciterSearch.toLowerCase()),
  );

  const filteredChapters = chapters.filter(
    (c) =>
      c.name_simple.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.translated_name.name.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.name_arabic.includes(chapterSearch),
  );

  const handleQuickPlay = useCallback(
    async (chapterId: number, chapterName: string) => {
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
      
      playSurah(chapterId, chapterName, audioData, versePageMap);
    },
    [queryClient, reciterId, playSurah],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-8 text-2xl font-bold text-[var(--theme-text)]">Dinleme</h1>

      {/* Reciter Selection */}
      <section className="mb-10">
        <h2 className="mb-4 text-[17px] font-semibold text-[var(--theme-text)]">
          Kari Secimi
        </h2>
        <input
          type="text"
          placeholder="Kari ara..."
          value={reciterSearch}
          onChange={(e) => setReciterSearch(e.target.value)}
          className="mb-4 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReciters.map((r) => {
            const isActive = r.id === reciterId;
            return (
              <button
                key={r.id}
                onClick={() => setReciter(r.id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  isActive
                    ? "border-primary-500/40 bg-primary-50/60 shadow-sm"
                    : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] hover:bg-[var(--theme-pill-bg)]"
                }`}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[13px] font-semibold text-primary-700">
                  {r.reciter_name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--theme-text)]">
                    {r.reciter_name}
                  </span>
                  {r.style && (
                    <span className="block truncate text-[11px] text-[var(--theme-text-tertiary)]">
                      {r.style.name}
                    </span>
                  )}
                </span>
                {isActive && (
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Play */}
      <section>
        <h2 className="mb-4 text-[17px] font-semibold text-[var(--theme-text)]">
          Hizli Dinle
        </h2>
        <input
          type="text"
          placeholder="Sure ara..."
          value={chapterSearch}
          onChange={(e) => setChapterSearch(e.target.value)}
          className="mb-4 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
        />
        <div className="space-y-1">
          {filteredChapters.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--theme-bg-primary)]"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[11px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
                {c.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-[var(--theme-text)]">
                  {c.translated_name.name}
                </span>
                <span className="block text-[11px] text-[var(--theme-text-tertiary)]">
                  {c.name_simple} · {c.verses_count} ayet
                </span>
              </span>
              <button
                onClick={() =>
                  handleQuickPlay(c.id, c.translated_name.name)
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white transition-transform hover:bg-primary-700 active:scale-95"
                aria-label={`${c.translated_name.name} dinle`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
