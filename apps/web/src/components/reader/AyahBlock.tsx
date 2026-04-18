/**
 * Tek ayet bloğu — Arapça metin + meal + yer imi + eylem menüsü.
 */

import { memo, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSettingsStore, COLOR_PALETTES } from "~/stores/settings.store";
import { useAudioStore } from "~/stores/audio.store";
import { parseTajweed } from "~/lib/tajweed-parser";
import { splitWords } from "~/lib/split-words";
import { AyahActionMenu } from "./AyahActionMenu";
import { WordTooltip } from "./WordTooltip";
import { VerseEndMarker } from "~/components/quran/VerseEndMarker";
import { SajdahMarker } from "~/components/quran/SajdahMarker";
import type { WbwWord } from "~/hooks/useWbwData";
import { useTranslation } from "~/hooks/useTranslation";

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

export const AyahBlock = memo(function AyahBlock({
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
  const { t } = useTranslation();
  const blockRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(highlight);

  const isBookmarked = useBookmarksStore((s) =>
    surahId ? s.isBookmarked(surahId, ayahNumber) : false,
  );
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const { arabicFontSize, translationFontSize, translationSlugs, showTranslit, readingMode, colorizeWords, colorPaletteId } = useSettingsStore(
    useShallow((s) => ({
      arabicFontSize: s.arabicFontSize,
      translationFontSize: s.translationFontSize,
      translationSlugs: s.translationSlugs,
      showTranslit: s.showTranslit,
      readingMode: s.readingMode,
      colorizeWords: s.colorizeWords,
      colorPaletteId: s.colorPaletteId,
    }))
  );
  const multiMode = translationSlugs.length > 1;
  const wordColors = colorizeWords ? COLOR_PALETTES[colorPaletteId].colors : null;

  // WBW modunda: kelime kartları; diğer modlarda: tooltip
  const isWbwLayout = readingMode === "wbw" && wbwWords && wbwWords.length > 0;
  const hasTooltip = readingMode === "verse" && wbwWords && wbwWords.length > 0;

  // Tooltip state — verse modunda kelimeye tıklayınca
  const [tooltip, setTooltip] = useState<{ word: WbwWord; rect: DOMRect } | null>(null);

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

  // WBW modunda translit toggle; diğer modlarda hover yok
  const wbwTranslit = showTranslit ? "on" : "off";
  const wbwTranslation = "on"; // WBW modunda çeviri her zaman görünür

  // Tek menü açma fonksiyonu — her zaman ayetin rect'ini kullanır
  const [longPressActive, setLongPressActive] = useState(false);

  const openMenu = useCallback(() => {
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) setMenuAnchor(rect);
    setMenuOpen(true);
    setLongPressActive(false);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openMenu();
  }, [openMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!surahId) return;
      e.preventDefault();
      openMenu();
    },
    [surahId, openMenu],
  );

  // Keyboard fallback for long-press: Enter/Space opens verse menu
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!surahId) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
    },
    [surahId, openMenu],
  );

  // Long press gesture
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!surahId) return;
      longPressHintTimer.current = setTimeout(() => {
        setLongPressActive(true);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 200);
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
      className={`relative transition-all duration-300 ${
        longPressActive || menuOpen
          ? "bg-[var(--mu-accent-soft)]/50"
          : flash ? "bg-[var(--mu-accent-soft)]/50" : isPlaying ? "bg-[var(--mu-accent-soft)]/30" : ""
      }`}
      tabIndex={surahId ? 0 : undefined}
      role={surahId ? "button" : undefined}
      aria-label={surahId ? `${surahId}:${ayahNumber}` : undefined}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {/* Arapca metin -- WBW / tecvid / normal */}
      {isWbwLayout ? (
        /* Kelime kelime mod — kartlar */
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 py-2" dir="rtl">
          {wbwWords!.map((w, i) => (
            <div
              key={w.position}
              className={`group/wbw flex flex-col items-center min-w-[3rem] rounded-lg px-1.5 py-1 transition-colors duration-150 cursor-default ${
                wordPosition === w.position
                  ? "word-audio-active"
                  : "hover:text-[var(--color-word-hover-text)]"
              }`}
            >
              <span
                className="pb-2"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: `${arabicFontSize}rem`,
                  lineHeight: 2,
                  color: wordColors && wordPosition !== w.position ? wordColors[i % wordColors.length] : undefined,
                }}
              >
                {w.textUthmani}
              </span>
              {w.transliteration && wbwTranslit !== "off" && (
                <span
                  className="text-[var(--color-accent)] text-center leading-tight mt-0.5 italic"
                  style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.6, translationFontSize * 0.65)}rem` }}
                >
                  {w.transliteration}
                </span>
              )}
              {w.translation && (
                <span
                  className="text-[var(--color-text-translation)] text-center leading-tight mt-0.5"
                  style={{ fontFamily: "var(--font-ui)", fontSize: `${Math.max(0.65, translationFontSize * 0.75)}rem` }}
                >
                  {w.translation}
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-1">
            <VerseEndMarker ayahNumber={ayahNumber} onClick={handleBadgeClick} variant="block" />
            {sajdah && <SajdahMarker />}
          </div>
        </div>
      ) : (
        /* Normal metin -- verse modunda kelimeye tiklayinca WordTooltip */
        <div className="mu-v-ar relative" style={{ fontSize: `${arabicFontSize}rem` }}>
          {showTajweed && textTajweed && !colorizeWords
            ? parseTajweed(textTajweed, true)
            : splitWords(textUthmani).map((word, i) => {
                const isActive = wordPosition === i + 1;
                const wc = wordColors && !isActive ? wordColors[i % wordColors.length] : undefined;
                const wbwWord = hasTooltip ? wbwWords![i] : undefined;
                const isTooltipOpen = tooltip?.word === wbwWord;
                return (
                  <span
                    key={i}
                    className={`inline rounded-sm px-[0.06em] transition-colors duration-150 ${
                      hasTooltip ? "cursor-pointer" : "cursor-default"
                    } ${
                      isActive
                        ? "word-audio-active"
                        : isTooltipOpen
                          ? "bg-[var(--color-accent)]/15 text-[var(--color-text-primary)]"
                          : "hover:text-[var(--color-word-hover-text)]"
                    }`}
                    style={wc && !isTooltipOpen ? { color: wc } : undefined}
                    onClick={wbwWord ? (e) => {
                      e.stopPropagation();
                      if (isTooltipOpen) { setTooltip(null); return; }
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltip({ word: wbwWord, rect });
                    } : undefined}
                  >
                    {word}{" "}
                  </span>
                );
              })}
          <VerseEndMarker ayahNumber={ayahNumber} onClick={handleBadgeClick} variant="inline" size={32} />
          {sajdah && <SajdahMarker />}
        </div>
      )}
      {tooltip && (
        <WordTooltip
          word={tooltip.word}
          anchorRect={tooltip.rect}
          onClose={() => setTooltip(null)}
        />
      )}

      {/* Meal -- coklu veya tekli */}
      {showTranslation && translations && multiMode ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {translationSlugs.map((slug) => {
            const text = translations[slug];
            if (!text) return null;
            return (
              <div key={slug}>
                <span
                  className="mu-chap-eyebrow"
                  style={{ margin: 0, fontSize: 10, display: "inline-block", marginBottom: 2 }}
                >
                  {translationNames?.[slug] ?? slug}
                </span>
                <p className="mu-v-tr" style={{ fontSize: `${translationFontSize}rem` }}>
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      ) : showTranslation && translation ? (
        <p className="mu-v-tr" style={{ fontSize: `${translationFontSize}rem` }}>
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
});
