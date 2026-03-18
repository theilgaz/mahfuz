import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Verse, Word } from "@mahfuz/shared/types";
import { Bismillah } from "./Bismillah";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";

/** Surahs that do NOT get a Bismillah prefix */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface SelectedWord {
  wordId: number;
  verseKey: string;
  translation: string;
  transliteration: string;
}

interface TooltipInfo {
  translation: string;
  transliteration: string;
  rect: DOMRect;
}

interface MushafViewProps {
  verses: Verse[];
  showBismillah?: boolean;
}

export function MushafView({ verses, showBismillah = true }: MushafViewProps) {
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const mushafTooltipTextSize = usePreferencesStore((s) => s.mushafTooltipTextSize);
  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const setMushafShowTranslation = usePreferencesStore((s) => s.setMushafShowTranslation);
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const { t } = useTranslation();

  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasTranslations = mushafShowTranslation && verses.some((v) => v.translations && v.translations.length > 0);

  // Clear selection when clicking outside a word
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-mushaf-word]")) {
      setSelectedWord(null);
      setTooltip(null);
    }
  }, []);

  const handleWordHover = useCallback((info: TooltipInfo | null) => {
    setTooltip(info);
  }, []);

  const handleWordSelect = useCallback((word: SelectedWord | null, rect?: DOMRect) => {
    setSelectedWord(word);
    if (word && rect) {
      setTooltip({ translation: word.translation, transliteration: word.transliteration, rect });
    } else {
      setTooltip(null);
    }
  }, []);

  const toggleTranslation = useCallback(() => {
    setMushafShowTranslation(!mushafShowTranslation);
  }, [mushafShowTranslation, setMushafShowTranslation]);

  return (
    <div className="relative">
      {/* Meal toggle button */}
      <button
        type="button"
        onClick={toggleTranslation}
        className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] shadow-sm transition-colors hover:bg-[var(--theme-hover-bg)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mushafShowTranslation ? (
            <>
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </>
          )}
        </svg>
        {mushafShowTranslation ? t.toolbar.mushafHideMeal : t.toolbar.mushafShowMeal}
      </button>

      <div className="mushaf-spread" ref={containerRef} onClick={handleContainerClick}>
        {/* Arabic page — right on desktop, first on mobile */}
        <div className="mushaf-spread-page mushaf-spread-arabic">
          <ArabicPage
            verses={verses}
            showBismillah={showBismillah}
            colorizeWords={colorizeWords}
            colors={colors}
            fontSize={mushafArabicFontSize}
            selectedWord={selectedWord}
            onSelectWord={handleWordSelect}
            onHoverWord={handleWordHover}
          />
        </div>

        {/* Spine divider + Translation page — hidden when mushafShowTranslation is off */}
        {mushafShowTranslation && (
          <>
            <div className="mushaf-spread-spine" />
            <div className="mushaf-spread-page mushaf-spread-meal">
              {hasTranslations ? (
                <MealPage
                  verses={verses}
                  fontSize={mushafTranslationFontSize}
                  selectedWord={selectedWord}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6">
                  <p className="text-center text-[13px] text-[var(--theme-text-quaternary)]">
                    {selectedTranslations.length === 0
                      ? t.toolbar.mushafNoTranslation
                      : t.toolbar.mushafNote}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating tooltip — rendered via portal to avoid clipping */}
      {tooltip && (tooltip.translation || tooltip.transliteration) && (
        <MushafTooltip
          tooltip={tooltip}
          tooltipTextSize={mushafTooltipTextSize}
        />
      )}
    </div>
  );
}

/** Floating tooltip rendered via portal */
function MushafTooltip({ tooltip, tooltipTextSize }: { tooltip: TooltipInfo; tooltipTextSize: number }) {
  const { rect, translation, transliteration } = tooltip;

  // Position above the word, centered horizontally
  const top = rect.top - 8;
  const left = rect.left + rect.width / 2;

  return createPortal(
    <div
      className="mushaf-tooltip mushaf-tooltip-visible"
      style={{ top, left }}
    >
      {translation && (
        <span
          className="block font-medium text-[var(--theme-text)]"
          style={{ fontSize: `calc(13px * ${tooltipTextSize})` }}
        >
          {translation}
        </span>
      )}
      {transliteration && (
        <span
          className="block italic text-[var(--theme-text-tertiary)]"
          style={{ fontSize: `calc(11px * ${tooltipTextSize})` }}
        >
          {transliteration}
        </span>
      )}
    </div>,
    document.body,
  );
}

/** Arabic flowing text with verse markers (durak) — interactive words */
function ArabicPage({
  verses,
  showBismillah,
  colorizeWords,
  colors,
  fontSize,
  selectedWord,
  onSelectWord,
  onHoverWord,
}: {
  verses: Verse[];
  showBismillah: boolean;
  colorizeWords: boolean;
  colors: string[];
  fontSize: number;
  selectedWord: SelectedWord | null;
  onSelectWord: (word: SelectedWord | null, rect?: DOMRect) => void;
  onHoverWord: (info: TooltipInfo | null) => void;
}) {
  const handleWordClick = useCallback(
    (word: Word, verseKey: string, el: HTMLElement) => {
      if (selectedWord?.wordId === word.id) {
        onSelectWord(null);
      } else {
        const rect = el.getBoundingClientRect();
        onSelectWord({
          wordId: word.id,
          verseKey,
          translation: word.translation?.text ?? "",
          transliteration: word.transliteration?.text ?? "",
        }, rect);
      }
    },
    [selectedWord, onSelectWord],
  );

  const handleMouseEnter = useCallback(
    (word: Word, el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      onHoverWord({
        translation: word.translation?.text ?? "",
        transliteration: word.transliteration?.text ?? "",
        rect,
      });
    },
    [onHoverWord],
  );

  const handleMouseLeave = useCallback(() => {
    onHoverWord(null);
  }, [onHoverWord]);

  return (
    <p
      className="arabic-text text-justify leading-[2.8] text-[var(--mushaf-ink)]"
      style={{ fontSize: `calc(1.65rem * ${fontSize})` }}
      dir="rtl"
    >
      {verses.map((verse, idx) => {
        const surahId = Number(verse.verse_key.split(":")[0]);
        const needsBismillah =
          showBismillah &&
          verse.verse_number === 1 &&
          !NO_BISMILLAH_SURAHS.has(surahId);
        const words =
          verse.words?.filter((w) => w.char_type_name === "word") ?? [];
        const prevJuz = idx > 0 ? verses[idx - 1].juz_number : null;
        const isNewJuz = prevJuz !== null && verse.juz_number !== prevJuz;

        return (
          <span key={verse.id}>
            {isNewJuz && (
              <span className="mushaf-juz-marker" dir="rtl">
                الجزء {toArabicNumeral(verse.juz_number)}
              </span>
            )}
            {needsBismillah && (
              <span className="block w-full py-2 text-[1.5rem]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            )}
            {words.length > 0
              ? words.map((w, i) => {
                  const isSelected = selectedWord?.wordId === w.id;
                  return (
                    <span
                      key={w.id}
                      data-mushaf-word
                      className={`mushaf-word-interactive inline ${isSelected ? "mushaf-word-selected" : ""}`}
                      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWordClick(w, verse.verse_key, e.currentTarget);
                      }}
                      onMouseEnter={(e) => handleMouseEnter(w, e.currentTarget)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {w.text_uthmani}{" "}
                    </span>
                  );
                })
              : (
                  <>
                    {verse.text_uthmani}{" "}
                  </>
                )}
            <span className="mushaf-durak">
              {toArabicNumeral(verse.verse_number)}
            </span>
            {"  "}
          </span>
        );
      })}
    </p>
  );
}

/** Translation page — verse-by-verse meal text with highlighting */
function MealPage({
  verses,
  fontSize,
  selectedWord,
}: {
  verses: Verse[];
  fontSize: number;
  selectedWord: SelectedWord | null;
}) {
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted verse when selectedWord changes
  useEffect(() => {
    if (selectedWord && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedWord?.verseKey]);

  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {verses.map((verse, idx) => {
        const isHighlighted = selectedWord?.verseKey === verse.verse_key;
        const prevJuz = idx > 0 ? verses[idx - 1].juz_number : null;
        const isNewJuz = prevJuz !== null && verse.juz_number !== prevJuz;
        return (
          <div key={verse.id}>
            {isNewJuz && (
              <div className="mushaf-juz-marker mushaf-juz-marker--meal">
                {t.common.juz} {verse.juz_number}
              </div>
            )}
            <div
              ref={isHighlighted ? highlightedRef : undefined}
              className={isHighlighted ? "mushaf-verse-highlight" : ""}
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[10px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
                {verse.verse_number}
              </span>
              {verse.translations?.map((tr, i) => (
                <p
                  key={i}
                  className={`mt-1 font-sans leading-[1.8] text-[var(--theme-text-secondary)] ${isHighlighted && selectedWord?.translation ? "mushaf-word-match" : ""}`}
                  style={{ fontSize: `calc(15px * ${fontSize})` }}
                  dangerouslySetInnerHTML={{
                    __html:
                      isHighlighted && selectedWord?.translation
                        ? highlightTranslationWord(tr.text, selectedWord.translation)
                        : tr.text,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Highlight a word's translation within the meal text.
 * Case-insensitive, Turkish locale-aware. Wraps with <mark>.
 */
function highlightTranslationWord(html: string, word: string): string {
  if (!word || word.length < 2) return html;

  // Strip HTML tags for searching, but we need to work with the raw HTML
  // Simple approach: search in the text content and wrap matches
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const regex = new RegExp(`(${escaped})`, "gi");
    return html.replace(regex, "<mark>$1</mark>");
  } catch {
    return html;
  }
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}
