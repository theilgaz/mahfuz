/**
 * Tek ayet bloğu — Arapça metin + meal + yer imi + eylem menüsü.
 */

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSettingsStore } from "~/stores/settings.store";
import { parseTajweed } from "~/lib/tajweed-parser";
import { AyahActionMenu } from "./AyahActionMenu";

interface AyahBlockProps {
  surahId?: number;
  ayahNumber: number;
  textUthmani: string;
  textTajweed?: string;
  translation: string | null;
  showTranslation: boolean;
  showTajweed: boolean;
  pageNumber?: number;
  highlight?: boolean;
}

export function AyahBlock({
  surahId,
  ayahNumber,
  textUthmani,
  textTajweed,
  translation,
  showTranslation,
  showTajweed,
  pageNumber,
  highlight,
}: AyahBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(highlight);

  useEffect(() => {
    if (highlight && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);
  const isBookmarked = useBookmarksStore((s) =>
    surahId ? s.isBookmarked(surahId, ayahNumber) : false,
  );
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuAnchor(rect);
    setMenuOpen(true);
  }, []);

  return (
    <div
      ref={blockRef}
      className={`group py-3 border-b border-[var(--color-border)] last:border-b-0 relative transition-colors duration-1000 ${
        flash ? "bg-[var(--color-accent)]/10 rounded-lg" : ""
      }`}
    >
      {/* Yer imi butonu — hover'da görünür */}
      {surahId && (
        <button
          onClick={() =>
            toggleBookmark({
              surahId,
              ayahNumber,
              pageNumber: pageNumber ?? 1,
            })
          }
          className={`absolute top-2 left-1 p-1 rounded transition-opacity ${
            isBookmarked
              ? "opacity-100 text-[var(--color-accent)]"
              : "opacity-0 group-hover:opacity-60 text-[var(--color-text-secondary)]"
          }`}
          aria-label={isBookmarked ? "Yer imini kaldır" : "Yer imine ekle"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z" />
          </svg>
        </button>
      )}

      {/* Arapça metin — tecvid aktifse renkli, değilse kelime hover */}
      <div className="text-right leading-[2.8]" dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: `${arabicFontSize}rem` }}>
        {showTajweed && textTajweed
          ? parseTajweed(textTajweed, true)
          : textUthmani.split(/\s+/).map((word, i) => (
              <span
                key={i}
                className="inline-block rounded-sm px-[0.08em] transition-colors duration-150 hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)] cursor-default"
              >
                {word}
              </span>
            ))}
        <button
          onClick={handleBadgeClick}
          className="inline-flex items-center justify-center mr-1.5 w-8 h-8 rounded-full bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem" }}
          aria-label={`Ayet ${ayahNumber} eylemleri`}
        >
          {ayahNumber}
        </button>
      </div>

      {/* Meal */}
      {showTranslation && translation && (
        <p
          className="mt-2 text-[var(--color-text-translation)] leading-[1.7]"
          style={{ fontSize: `${translationFontSize}rem` }}
        >
          <span className="text-[var(--color-text-secondary)] text-xs mr-1">{ayahNumber}.</span>
          {translation}
        </p>
      )}

      {/* Eylem menüsü */}
      {surahId && (
        <AyahActionMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          textUthmani={textUthmani}
          translation={translation}
          surahId={surahId}
          ayahNumber={ayahNumber}
          pageNumber={pageNumber}
          anchorRect={menuAnchor}
        />
      )}
    </div>
  );
}
