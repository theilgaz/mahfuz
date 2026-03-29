/**
 * Tek ayet bloğu — Arapça metin + meal + yer imi + eylem menüsü.
 */

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSettingsStore } from "~/stores/settings.store";
import { useAudioStore } from "~/stores/audio.store";
import { parseTajweed } from "~/lib/tajweed-parser";
import { splitWords } from "~/lib/split-words";
import { AyahActionMenu } from "./AyahActionMenu";
import { VerseEndMarker } from "~/components/quran/VerseEndMarker";
import { SajdahMarker } from "~/components/quran/SajdahMarker";
import type { WbwWord } from "~/hooks/useWbwData";

interface AyahBlockProps {
  surahId?: number;
  ayahNumber: number;
  textUthmani: string;
  textTajweed?: string;
  translation: string | null;
  /** Çoklu meal: slug → text */
  translations?: Record<string, string>;
  /** Çoklu meal adları: slug → kısa ad */
  translationNames?: Record<string, string>;
  showTranslation: boolean;
  showTajweed: boolean;
  pageNumber?: number;
  highlight?: boolean;
  wbwWords?: WbwWord[];
  sajdah?: boolean;
}

export function AyahBlock({
  surahId,
  ayahNumber,
  textUthmani,
  textTajweed,
  translation,
  translations,
  translationNames,
  showTranslation,
  showTajweed,
  pageNumber,
  highlight,
  wbwWords,
  sajdah,
}: AyahBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(highlight);

  const isBookmarked = useBookmarksStore((s) =>
    surahId ? s.isBookmarked(surahId, ayahNumber) : false,
  );
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const multiMode = translationSlugs.length > 1;
  const wbwTranslation = useSettingsStore((s) => s.wbwTranslation);
  const wbwTranslit = useSettingsStore((s) => s.wbwTranslit);

  // Audio word tracking
  const verseKey = surahId ? `${surahId}:${ayahNumber}` : null;
  const isPlaying = useAudioStore((s) =>
    s.playbackState === "playing" && s.currentVerseKey === verseKey,
  );
  const wordPosition = useAudioStore((s) =>
    s.currentVerseKey === verseKey ? s.wordPosition : null,
  );

  useEffect(() => {
    if (highlight && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // Auto-scroll to currently playing verse
  useEffect(() => {
    if (isPlaying && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);

  const hasHoverField = wbwTranslation === "hover" || wbwTranslit === "hover";

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuAnchor(rect);
    setMenuOpen(true);
  }, []);

  // Long press gesture for opening action menu
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [longPressActive, setLongPressActive] = useState(false);

  const openMenu = useCallback(() => {
    // Ayetin kendi rect'ini kullan — menü ayetin ortasında açılsın
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) setMenuAnchor(rect);
    setMenuOpen(true);
    setLongPressActive(false);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!surahId) return;
      e.preventDefault();
      openMenu();
    },
    [surahId, openMenu],
  );

  const longPressHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!surahId) return;
      // 200ms: visual hint (highlight + subtle vibrate)
      longPressHintTimer.current = setTimeout(() => {
        setLongPressActive(true);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 200);
      // 500ms: open menu
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        openMenu();
      }, 500);
    },
    [surahId, openMenu],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressHintTimer.current) {
      clearTimeout(longPressHintTimer.current);
      longPressHintTimer.current = null;
    }
    setLongPressActive(false);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (longPressHintTimer.current) clearTimeout(longPressHintTimer.current);
    };
  }, []);

  return (
    <div
      ref={blockRef}
      data-longpress={longPressActive || menuOpen ? "true" : undefined}
      className={`group py-3 border-b border-[var(--color-border)] last:border-b-0 relative transition-all duration-300 rounded-lg ${
        longPressActive || menuOpen
          ? "bg-[var(--color-accent)]/10 scale-[0.98] shadow-lg ring-1 ring-[var(--color-accent)]/20"
          : flash ? "bg-[var(--color-accent)]/10" : isPlaying ? "bg-[var(--color-accent)]/6" : ""
      }`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
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

      {/* Arapça metin — WBW / tecvid / normal */}
      {wbwWords && wbwWords.length > 0 ? (
        /* Kelime kelime mod */
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 py-2" dir="rtl">
          {wbwWords.map((w, i) => (
            <div
              key={w.position}
              className={`group/wbw flex flex-col items-center min-w-[3rem] rounded-lg px-1.5 py-1 transition-colors duration-150 ${
                hasHoverField ? "cursor-pointer" : "cursor-default"
              } ${
                wordPosition === w.position
                  ? "word-audio-active"
                  : "hover:bg-[var(--color-word-hover)]"
              }`}
            >
              <span className="pb-2" style={{ fontFamily: "var(--font-arabic)", fontSize: `${arabicFontSize}rem`, lineHeight: 2 }}>
                {w.textUthmani}
              </span>
              {w.transliteration && wbwTranslit !== "off" && (
                wbwTranslit === "hover" ? (
                  <span
                    className="text-center leading-tight mt-0.5"
                    style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.6, translationFontSize * 0.65)}rem` }}
                  >
                    <span className="group-hover/wbw:hidden text-[var(--color-border)] select-none">{"‒".repeat(Math.min(6, Math.max(2, Math.ceil(w.transliteration.length / 2))))}</span>
                    <span className="hidden group-hover/wbw:inline text-[var(--color-accent)] italic">{w.transliteration}</span>
                  </span>
                ) : (
                  <span
                    className="text-[var(--color-accent)] text-center leading-tight mt-0.5 italic"
                    style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.6, translationFontSize * 0.65)}rem` }}
                  >
                    {w.transliteration}
                  </span>
                )
              )}
              {w.translation && wbwTranslation !== "off" && (
                wbwTranslation === "hover" ? (
                  <span
                    className="text-center leading-tight mt-0.5"
                    style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.65, translationFontSize * 0.75)}rem` }}
                  >
                    <span className="group-hover/wbw:hidden text-[var(--color-border)] select-none">{"‒".repeat(Math.min(6, Math.max(2, Math.ceil(w.translation.length / 3))))}</span>
                    <span className="hidden group-hover/wbw:inline text-[var(--color-text-translation)]">{w.translation}</span>
                  </span>
                ) : (
                  <span
                    className="text-[var(--color-text-translation)] text-center leading-tight mt-0.5"
                    style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.65, translationFontSize * 0.75)}rem` }}
                  >
                    {w.translation}
                  </span>
                )
              )}
            </div>
          ))}
          <div className="flex items-center gap-1">
            <VerseEndMarker ayahNumber={ayahNumber} onClick={handleBadgeClick} variant="block" />
            {sajdah && <SajdahMarker />}
          </div>
        </div>
      ) : (
        /* Normal metin */
        <div className="leading-[2.8]" dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: `${arabicFontSize}rem`, textAlign: "justify" }}>
          {showTajweed && textTajweed
            ? parseTajweed(textTajweed, true)
            : splitWords(textUthmani).map((word, i) => (
                <span
                  key={i}
                  className={`inline rounded-sm px-[0.06em] transition-colors duration-150 cursor-default ${
                    wordPosition === i + 1
                      ? "word-audio-active"
                      : "hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)]"
                  }`}
                >
                  {word}{" "}
                </span>
              ))}
          <VerseEndMarker ayahNumber={ayahNumber} onClick={handleBadgeClick} variant="inline" size={32} />
          {sajdah && <SajdahMarker />}
        </div>
      )}

      {/* Meal — çoklu veya tekli */}
      {showTranslation && translations && multiMode ? (
        <div className="mt-2 space-y-1.5">
          {translationSlugs.map((slug) => {
            const text = translations[slug];
            if (!text) return null;
            return (
              <div key={slug}>
                <span
                  className="inline-block text-[0.6rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-0.5"
                >
                  {translationNames?.[slug] ?? slug}
                </span>
                <p
                  className="text-[var(--color-text-translation)] leading-[1.7]"
                  style={{ fontSize: `${translationFontSize}rem` }}
                >
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      ) : showTranslation && translation ? (
        <p
          className="mt-2 text-[var(--color-text-translation)] leading-[1.7]"
          style={{ fontSize: `${translationFontSize}rem` }}
        >
          <span className="text-[var(--color-text-secondary)] text-xs mr-1">{ayahNumber}.</span>
          {translation}
        </p>
      ) : null}

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
