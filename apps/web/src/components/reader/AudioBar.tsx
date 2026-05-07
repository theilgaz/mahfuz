/**
 * Minimal ses oynatıcı — ortada altta.
 * AudioEngine entegre: play/pause + ilerleme + hız kontrolü.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "@tanstack/react-router";
import { useAudioStore } from "~/stores/audio.store";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
const POSITION_STORAGE_KEY = "mahfuz:audioBarPosition";
const VIEWPORT_MARGIN = 8;

type Position = { x: number; y: number };

function loadSavedPosition(): Position | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function clampToViewport(pos: Position, width: number, height: number): Position {
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, pos.y), maxY),
  };
}

export function AudioBar() {
  const {
    playbackState,
    isVisible,
    currentVerseKey,
    currentTime,
    duration,
    chapterName,
    speed,
    togglePlayPause,
    stop,
    nextVerse,
    prevVerse,
    setSpeed,
  } = useAudioStore(
    useShallow((s) => ({
      playbackState: s.playbackState,
      isVisible: s.isVisible,
      currentVerseKey: s.currentVerseKey,
      currentTime: s.currentTime,
      duration: s.duration,
      chapterName: s.chapterName,
      speed: s.speed,
      togglePlayPause: s.togglePlayPause,
      stop: s.stop,
      nextVerse: s.nextVerse,
      prevVerse: s.prevVerse,
      setSpeed: s.setSpeed,
    }))
  );

  const [showSpeed, setShowSpeed] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Sürükle-bırak konum yönetimi
  const [position, setPosition] = useState<Position | null>(loadSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<{
    pointerStartX: number;
    pointerStartY: number;
    elementStartX: number;
    elementStartY: number;
  } | null>(null);

  useEffect(() => {
    if (!position) return;
    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch {
      /* ignore */
    }
  }, [position]);

  useEffect(() => {
    if (!position) return;
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      setPosition((prev) => (prev ? clampToViewport(prev, el.offsetWidth, el.offsetHeight) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [position]);

  const handleDragPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOriginRef.current = {
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      elementStartX: rect.left,
      elementStartY: rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleDragPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOriginRef.current;
    const el = containerRef.current;
    if (!origin || !el) return;
    const dx = e.clientX - origin.pointerStartX;
    const dy = e.clientY - origin.pointerStartY;
    setPosition(
      clampToViewport(
        { x: origin.elementStartX + dx, y: origin.elementStartY + dy },
        el.offsetWidth,
        el.offsetHeight,
      ),
    );
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOriginRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragOriginRef.current = null;
    setIsDragging(false);
  }, []);

  // Space → play/pause (skip when typing in inputs)
  useEffect(() => {
    if (!isVisible) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      togglePlayPause();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, togglePlayPause]);

  const handleVerseClick = useCallback(() => {
    if (!currentVerseKey) return;
    const [surahStr, verseStr] = currentVerseKey.split(":");
    const surahId = parseInt(surahStr, 10);
    if (!surahId || surahId < 1 || surahId > 114) return;
    const ayah = parseInt(verseStr, 10) || undefined;
    navigate({
      to: "/surah/$surahSlug",
      params: { surahSlug: surahSlug(surahId) },
      search: { ayah },
    });
  }, [currentVerseKey, navigate]);

  if (!isVisible) return null;

  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const verseDisplay = currentVerseKey
    ? (() => {
        const [surahStr, verseStr] = currentVerseKey.split(":");
        const surahId = parseInt(surahStr, 10);
        const name = SURAH_NAMES_TR[surahId] ?? chapterName ?? surahStr;
        return `${name} : ${verseStr}`;
      })()
    : chapterName ?? "";

  const stateLabel = isLoading ? "Loading" : isPlaying ? "Playing" : "Paused";

  const positioningClass = position
    ? "fixed z-30 w-[min(90vw,360px)]"
    : "fixed bottom-18 left-1/2 -translate-x-1/2 z-30 w-[min(90vw,360px)]";
  const positioningStyle = position ? { left: position.x, top: position.y } : undefined;

  return (
    <div
      ref={containerRef}
      className={positioningClass}
      style={positioningStyle}
      role="region"
      aria-label="Audio player"
    >
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {stateLabel} {verseDisplay} · {speed}x
      </div>
      <div
        className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2 ${
          isDragging ? "shadow-xl" : ""
        }`}
      >
        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-[var(--color-border)] overflow-hidden mb-2" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sürükleme tutamacı */}
          <div
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`shrink-0 -mx-1 px-1 py-1 select-none touch-none text-[var(--color-text-secondary)] opacity-50 hover:opacity-100 transition-opacity ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            role="button"
            aria-label="Oynatıcıyı taşı"
            title="Sürükleyerek taşı"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
              <circle cx="2" cy="3" r="1" />
              <circle cx="2" cy="7" r="1" />
              <circle cx="2" cy="11" r="1" />
              <circle cx="8" cy="3" r="1" />
              <circle cx="8" cy="7" r="1" />
              <circle cx="8" cy="11" r="1" />
            </svg>
          </div>

          {/* Ayet bilgisi — tıklanınca ilgili ayete git */}
          <button
            onClick={handleVerseClick}
            disabled={!currentVerseKey}
            className="text-xs text-[var(--color-text-secondary)] truncate flex-1 min-w-0 text-left hover:text-[var(--color-accent)] transition-colors disabled:hover:text-[var(--color-text-secondary)]"
          >
            {verseDisplay}
          </button>

          {/* Kontroller */}
          <div className="flex items-center gap-1">
            {/* Hız */}
            <button
              onClick={() => setShowSpeed(!showSpeed)}
              className="px-1.5 py-1 rounded-lg text-[10px] font-medium hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)]"
              aria-label={t.a11y.playbackSpeed}
            >
              {speed}x
            </button>

            {/* Önceki */}
            <button
              onClick={prevVerse}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors"
              aria-label={t.reader.prevVerse}
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
              aria-label={isPlaying ? t.a11y.pause : t.a11y.play}
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
              aria-label={t.reader.nextVerse}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M11 3v8H9.5V3H11zM3 3l5 4-5 4V3z" />
              </svg>
            </button>

            {/* Kapat */}
            <button
              onClick={stop}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)]"
              aria-label={t.common.close}
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
                aria-pressed={speed === s}
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
