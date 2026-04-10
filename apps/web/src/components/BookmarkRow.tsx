/**
 * BookmarkRow — swipe-to-reveal delete (iOS Mail style) + desktop hover button.
 *
 * Mobile: swipe left → red "Delete" button snaps open → tap to confirm.
 * Desktop: hover → trash icon appears on the right.
 */

import { Link } from "@tanstack/react-router";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSettingsStore } from "~/stores/settings.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { surahSlug } from "~/lib/surah-slugs";
import { useTranslation } from "~/hooks/useTranslation";

interface BookmarkRowProps {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
  surahName: string;
  surahNameArabic?: string;
  showDivider?: boolean;
}

// How far to swipe before snapping the delete button open
const REVEAL_THRESHOLD = 56;
// Width of the revealed delete zone
const DELETE_ZONE_WIDTH = 80;

export function BookmarkRow({
  surahId,
  ayahNumber,
  pageNumber,
  surahName,
  surahNameArabic,
  showDivider = true,
}: BookmarkRowProps) {
  const { t } = useTranslation();
  const readingMode = useSettingsStore((s) => s.readingMode);
  const removeBookmark = useBookmarksStore((s) => s.removeBookmark);

  // "idle" | "dragging" | "revealed" | "deleting"
  const [phase, setPhase] = useState<"idle" | "dragging" | "revealed" | "deleting">("idle");
  const [dragX, setDragX] = useState(0); // px offset while dragging (negative = left)

  const startX = useRef(0);
  const startY = useRef(0);
  const dirLocked = useRef<"h" | "v" | null>(null);

  // ── Swipe handlers ────────────────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dirLocked.current = null;

    // If already revealed, a new drag should close first
    if (phase === "revealed") {
      setPhase("idle");
      setDragX(0);
    }
  }, [phase]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (phase === "revealed" || phase === "deleting") return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction after 8px movement
    if (!dirLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      dirLocked.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }

    if (dirLocked.current === "v") return; // let scroll happen
    if (dx > 4) return; // only allow left swipe

    e.preventDefault(); // block scroll during horizontal drag
    setPhase("dragging");
    // Clamp: max reveal is slightly beyond the delete zone for spring feel
    setDragX(Math.max(dx, -(DELETE_ZONE_WIDTH * 1.25)));
  }, [phase]);

  const onTouchEnd = useCallback(() => {
    if (phase !== "dragging") return;

    if (Math.abs(dragX) >= REVEAL_THRESHOLD) {
      // Snap open to reveal the delete button
      setDragX(-DELETE_ZONE_WIDTH);
      setPhase("revealed");
    } else {
      // Spring back
      setDragX(0);
      setPhase("idle");
    }
  }, [phase, dragX]);

  // Close if user taps outside while revealed
  const onRowClick = useCallback(() => {
    if (phase === "revealed") {
      setDragX(0);
      setPhase("idle");
    }
  }, [phase]);

  const handleDelete = useCallback(() => {
    setPhase("deleting");
    // Brief visual delay so the red flash is perceptible
    setTimeout(() => removeBookmark(surahId, ayahNumber), 180);
  }, [removeBookmark, surahId, ayahNumber]);

  // Close this row if another row opens (global tap handling is done per-row via onRowClick)
  useEffect(() => {
    if (phase !== "revealed") return;
    const close = () => {
      setDragX(0);
      setPhase("idle");
    };
    // Delay so the same touch that opened it doesn't immediately close it
    const id = setTimeout(() => window.addEventListener("touchstart", close, { once: true }), 50);
    return () => {
      clearTimeout(id);
      window.removeEventListener("touchstart", close);
    };
  }, [phase]);

  // ── Link destination ─────────────────────────────────────

  const linkTo = readingMode !== "mushaf"
    ? { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(surahId) }, search: { ayah: ayahNumber } }
    : { to: "/page/$pageNumber" as const, params: { pageNumber: String(pageNumber) }, search: { ayah: undefined } };

  const currentOffset = phase === "revealed" ? -DELETE_ZONE_WIDTH
    : phase === "dragging" ? dragX
    : 0;

  const isTransitioning = phase !== "dragging"; // animate when snapping, not while dragging

  return (
    <div
      className="relative overflow-hidden group"
      style={{ opacity: phase === "deleting" ? 0 : 1, transition: phase === "deleting" ? "opacity 150ms ease" : undefined }}
    >
      {/* ── Delete zone (always rendered, revealed by sliding row away) ── */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_ZONE_WIDTH }}
        aria-hidden="true"
      >
        <button
          onTouchEnd={(e) => { e.stopPropagation(); handleDelete(); }}
          onClick={handleDelete}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-white active:bg-red-600 transition-colors"
          aria-label={t.reader.removeBookmark}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">{t.reader.removeBookmark}</span>
        </button>
      </div>

      {/* ── Row content (slides left to reveal delete zone) ── */}
      <div
        className="relative bg-[var(--color-bg)]"
        style={{
          transform: currentOffset ? `translateX(${currentOffset}px)` : undefined,
          transition: isTransitioning ? "transform 220ms cubic-bezier(0.25,1,0.5,1)" : "none",
          willChange: "transform",
          touchAction: "pan-y", // allow vertical scroll, we handle horizontal ourselves
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onRowClick}
      >
        <Link
          {...linkTo}
          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] group/row"
          onClick={(e) => { if (phase === "revealed") e.preventDefault(); }}
        >
          {/* Surah number badge */}
          <span className="w-7 h-7 rounded-md bg-[var(--color-surface)] flex items-center justify-center text-[11px] font-medium text-[var(--color-text-secondary)] shrink-0">
            {surahId}
          </span>

          {/* Name + verse */}
          <span className="flex-1 min-w-0 text-sm truncate">
            <span className="font-medium">{surahName}</span>
            <span className="text-[var(--color-text-secondary)]"> · {t.common.verse} {ayahNumber}</span>
          </span>

          {surahNameArabic && (
            <span className="text-sm shrink-0 text-[var(--color-text-secondary)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
              {surahNameArabic}
            </span>
          )}

          {/* Page pill */}
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
            {pageNumber}
          </span>
        </Link>

        {/* Desktop-only delete button (hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 shadow-sm transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center"
          aria-label={t.reader.removeBookmark}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      </div>

      {/* Bottom divider */}
      {showDivider && (
        <div className="ml-12 border-b border-[var(--color-border)]/50" />
      )}
    </div>
  );
}
