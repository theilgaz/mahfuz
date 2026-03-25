/**
 * Minimal ses oynatıcı — ortada altta.
 * AudioEngine entegre: play/pause + ilerleme + hız kontrolü.
 */

import { useState } from "react";
import { useAudioStore } from "~/stores/audio.store";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

export function AudioBar() {
  const playbackState = useAudioStore((s) => s.playbackState);
  const isVisible = useAudioStore((s) => s.isVisible);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const chapterName = useAudioStore((s) => s.chapterName);
  const speed = useAudioStore((s) => s.speed);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const stop = useAudioStore((s) => s.stop);
  const nextVerse = useAudioStore((s) => s.nextVerse);
  const prevVerse = useAudioStore((s) => s.prevVerse);
  const setSpeed = useAudioStore((s) => s.setSpeed);

  const [showSpeed, setShowSpeed] = useState(false);

  if (!isVisible) return null;

  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const verseDisplay = currentVerseKey
    ? currentVerseKey.replace(":", " : ")
    : chapterName ?? "";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(90vw,360px)]">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg px-3 py-2">
        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-[var(--color-border)] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Ayet bilgisi */}
          <span className="text-xs text-[var(--color-text-secondary)] truncate flex-1 min-w-0">
            {verseDisplay}
          </span>

          {/* Kontroller */}
          <div className="flex items-center gap-1">
            {/* Hız */}
            <button
              onClick={() => setShowSpeed(!showSpeed)}
              className="px-1.5 py-1 rounded-lg text-[10px] font-medium hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)]"
              aria-label="Oynatma hızı"
            >
              {speed}x
            </button>

            {/* Önceki */}
            <button
              onClick={prevVerse}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors"
              aria-label="Önceki ayet"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 3v8h1.5V3H3zm8 0L6 7l5 4V3z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-9 h-9 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isLoading ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="animate-spin">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="20 12" />
                </svg>
              ) : isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="4" y="3" width="2.5" height="10" rx="0.5" />
                  <rect x="9.5" y="3" width="2.5" height="10" rx="0.5" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3L13 8L5 13V3Z" />
                </svg>
              )}
            </button>

            {/* Sonraki */}
            <button
              onClick={nextVerse}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors"
              aria-label="Sonraki ayet"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M11 3v8H9.5V3H11zM3 3l5 4-5 4V3z" />
              </svg>
            </button>

            {/* Kapat */}
            <button
              onClick={stop}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)]"
              aria-label="Kapat"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l6 6m0-6l-6 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hız seçici */}
        {showSpeed && (
          <div className="flex items-center justify-center gap-1 pt-2 mt-1 border-t border-[var(--color-border)]">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  setShowSpeed(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  speed === s
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
