/**
 * BookmarkRow — kompakt bookmark satırı, swipe-to-delete destekli.
 */

import { Link } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
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

const SWIPE_THRESHOLD = 80;

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

  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setSwiping(false);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // lock direction after 10px
    if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      locked.current = true;
      if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll
      setSwiping(true);
    }

    if (!swiping && !locked.current) return;
    if (dx > 0) return; // only swipe left

    setOffsetX(Math.max(dx, -SWIPE_THRESHOLD * 1.5));
  }, [swiping]);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
      removeBookmark(surahId, ayahNumber);
    } else {
      setOffsetX(0);
    }
    setSwiping(false);
  }, [offsetX, removeBookmark, surahId, ayahNumber]);

  const linkTo = readingMode !== "mushaf"
    ? { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(surahId) }, search: { ayah: ayahNumber } }
    : { to: "/page/$pageNumber" as const, params: { pageNumber: String(pageNumber) }, search: { ayah: undefined } };

  return (
    <div className="relative overflow-hidden group">
      {/* Delete zone behind */}
      {offsetX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white px-4"
          style={{ width: Math.abs(offsetX) }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 4.5h12M7 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4.5 4.5L5 15a1 1 0 001 1h6a1 1 0 001-1l.5-10.5" />
          </svg>
        </div>
      )}

      {/* Row content */}
      <div
        className="relative bg-[var(--color-bg)] transition-transform"
        style={{
          transform: offsetX ? `translateX(${offsetX}px)` : undefined,
          transition: swiping ? "none" : "transform 200ms ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link
          {...linkTo}
          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] group/row"
        >
          {/* Surah number badge */}
          <span className="w-7 h-7 rounded-md bg-[var(--color-surface)] flex items-center justify-center text-[11px] font-medium text-[var(--color-text-secondary)] shrink-0">
            {surahId}
          </span>

          {/* Name + verse + Arabic — linked highlight on hover */}
          <span className="flex-1 min-w-0 text-sm truncate">
            <span className="font-medium transition-colors group-has-[.ar-name:hover]/row:text-[var(--color-accent)]">{surahName}</span>
            <span className="text-[var(--color-text-secondary)]"> · {t.common.verse} {ayahNumber}</span>
          </span>

          {surahNameArabic && (
            <span className="ar-name text-sm shrink-0 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
              {surahNameArabic}
            </span>
          )}

          {/* Page pill */}
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
            {pageNumber}
          </span>
        </Link>

        {/* Desktop delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeBookmark(surahId, ayahNumber);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 shadow-sm transition-all opacity-0 group-hover:opacity-100"
          aria-label={t.reader.removeBookmark}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" />
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
