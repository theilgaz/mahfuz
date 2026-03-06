import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioStore } from "~/stores/useAudioStore";
import { ProgressLine } from "./ProgressLine";
import { ReciterModal } from "./ReciterModal";
import { verseAudioQueryOptions } from "~/hooks/useAudio";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import type { PlaybackSpeed, RepeatMode } from "@mahfuz/shared/types";
import type { VerseAudioData } from "@mahfuz/audio-engine";

const SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: "none", label: "Yok" },
  { value: "verse", label: "Ayet" },
  { value: "surah", label: "Sure" },
];

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function AudioBar() {
  const isVisible = useAudioStore((s) => s.isVisible);
  const isExpanded = useAudioStore((s) => s.isExpanded);
  const playbackState = useAudioStore((s) => s.playbackState);
  const chapterName = useAudioStore((s) => s.chapterName);
  const chapterId = useAudioStore((s) => s.chapterId);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const speed = useAudioStore((s) => s.speed);
  const repeatMode = useAudioStore((s) => s.repeatMode);
  const volume = useAudioStore((s) => s.volume);
  const isMuted = useAudioStore((s) => s.isMuted);

  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const nextVerse = useAudioStore((s) => s.nextVerse);
  const prevVerse = useAudioStore((s) => s.prevVerse);
  const seekTo = useAudioStore((s) => s.seekTo);
  const stop = useAudioStore((s) => s.stop);
  const setSpeed = useAudioStore((s) => s.setSpeed);
  const setRepeatMode = useAudioStore((s) => s.setRepeatMode);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const setExpanded = useAudioStore((s) => s.setExpanded);
  const setReciter = useAudioStore((s) => s.setReciter);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playVerse = useAudioStore((s) => s.playVerse);

  const queryClient = useQueryClient();
  const [reciterModalOpen, setReciterModalOpen] = useState(false);

  const handleReciterSelect = useCallback(
    async (newReciterId: number) => {
      setReciter(newReciterId);

      // If actively playing, refetch audio with new reciter and restart
      const { playbackState: ps, chapterId, chapterName: cn, currentVerseKey: vk } =
        useAudioStore.getState();
      if (!chapterId || !cn || ps === "idle" || ps === "ended") return;

      try {
        const [audioFiles, chapterVerses] = await Promise.all([
          queryClient.fetchQuery(verseAudioQueryOptions(newReciterId, chapterId)),
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
        
        if (vk) {
          playVerse(chapterId, cn, vk, audioData, versePageMap);
        } else {
          playSurah(chapterId, cn, audioData, versePageMap);
        }
      } catch (err) {
        console.error("[AudioBar] Failed to change reciter:", err);
      }
    },
    [queryClient, setReciter, playVerse, playSurah],
  );

  if (!isVisible) return null;

  const isPlaying = playbackState === "playing";
  const verseLabel = currentVerseKey
    ? currentVerseKey === "bismillah"
      ? "Bismillahirrahmanirrahim"
      : `Ayet ${currentVerseKey.split(":")[1]}`
    : "";

  return (
    <>
      {/* Expanded overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />
          <div className="relative z-10 w-full max-w-md animate-slide-up rounded-t-2xl bg-[var(--theme-bg-primary)] p-6 shadow-modal sm:rounded-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-[var(--theme-text)]">
                  {chapterName}
                </p>
                <p className="text-[12px] text-[var(--theme-text-tertiary)]">{verseLabel}</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="rounded-full p-1 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                aria-label="Kucult"
              >
                <ChevronDownIcon />
              </button>
            </div>

            {/* Seek bar */}
            <ProgressLine
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-[var(--theme-text-tertiary)]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Main controls */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <button
                onClick={prevVerse}
                className="rounded-full p-2 text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                aria-label="Onceki ayet"
              >
                <PrevIcon />
              </button>
              <button
                onClick={togglePlayPause}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform active:scale-95"
                aria-label={isPlaying ? "Duraklat" : "Oynat"}
              >
                {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              <button
                onClick={nextVerse}
                className="rounded-full p-2 text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                aria-label="Sonraki ayet"
              >
                <NextIcon />
              </button>
            </div>

            {/* Speed */}
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                Hiz
              </p>
              <div className="flex gap-1.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors ${
                      speed === s
                        ? "speed-btn-active bg-primary-600 text-white"
                        : "bg-[var(--theme-speed-inactive-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-speed-inactive-hover)]"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat */}
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                Tekrar
              </p>
              <div className="flex gap-1.5">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRepeatMode(opt.value)}
                    className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors ${
                      repeatMode === opt.value
                        ? "bg-primary-600 text-white"
                        : "bg-[var(--theme-speed-inactive-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-speed-inactive-hover)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text)]"
                aria-label={isMuted ? "Sesi ac" : "Sessiz"}
              >
                {isMuted ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="audio-volume-slider h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
              />
            </div>

            {/* Reciter button */}
            <button
              onClick={() => setReciterModalOpen(true)}
              className="mt-4 w-full rounded-xl bg-[var(--theme-speed-inactive-bg)] px-4 py-2.5 text-left text-[13px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-speed-inactive-hover)]"
            >
              Kari Degistir
            </button>

            {/* Stop */}
            <button
              onClick={stop}
              className="mt-3 w-full rounded-xl px-4 py-2 text-center text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              Durdur
            </button>
          </div>
        </div>
      )}

      {/* Collapsed bar */}
      <div className="audio-bar-in fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 z-20 bg-[var(--theme-bg-primary)] shadow-sm lg:static lg:z-10 lg:shadow-none">
        {/* Thin progress line */}
        <ProgressLine
          currentTime={currentTime}
          duration={duration}
          onSeek={seekTo}
          thin
        />

        <div className="border-t border-[var(--theme-border)] px-3 py-2">
          <div className="flex items-center gap-3">
            {/* Info — tap to navigate to surah */}
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(chapterId) }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-[13px] font-medium text-[var(--theme-text)]">
                {chapterName}
              </p>
              <p className="truncate text-[11px] text-[var(--theme-text-tertiary)]">
                {verseLabel}
              </p>
            </Link>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={prevVerse}
                className="rounded-full p-1.5 text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                aria-label="Onceki ayet"
              >
                <PrevIcon size={16} />
              </button>
              <button
                onClick={togglePlayPause}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white transition-transform active:scale-95"
                aria-label={isPlaying ? "Duraklat" : "Oynat"}
              >
                {isPlaying ? (
                  <PauseIcon size={16} />
                ) : (
                  <PlayIcon size={16} />
                )}
              </button>
              <button
                onClick={nextVerse}
                className="rounded-full p-1.5 text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                aria-label="Sonraki ayet"
              >
                <NextIcon size={16} />
              </button>
            </div>

            {/* Expand */}
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Genislet"
            >
              <ChevronUpIcon />
            </button>
          </div>
        </div>
      </div>

      <ReciterModal
        open={reciterModalOpen}
        onClose={() => setReciterModalOpen(false)}
        onSelect={handleReciterSelect}
      />
    </>
  );
}

// --- Inline SVG Icons ---

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function PrevIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function NextIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M16 18h2V6h-2v12zM5.5 12l8.5 6V6l-8.5 6z" transform="scale(-1, 1) translate(-24, 0)" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    </svg>
  );
}
