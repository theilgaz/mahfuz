/**
 * Mushaf sayfası — fiziksel Kur'an sayfası gibi akan metin.
 * Satır verisi mevcutsa gerçek Mushaf satır düzeni kullanılır.
 */

import { useShallow } from "zustand/react/shallow";
import { useSettingsStore, COLOR_PALETTES } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useAudioStore } from "~/stores/audio.store";
import { usePageData, useTajweed, useImlaei, useMushafLines, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import type { MushafPageLines } from "~/hooks/useQuranQuery";
import { useQuery } from "@tanstack/react-query";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { parseTajweed } from "~/lib/tajweed-parser";
import { splitWords } from "~/lib/split-words";
import { SurahHeader } from "./SurahHeader";
import { MushafLineView } from "./MushafLineView";
import { MushafSkeleton } from "./MushafSkeleton";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import { AyahActionMenu } from "./AyahActionMenu";
import { VerseEndMarker } from "~/components/quran/VerseEndMarker";
import { SajdahMarker } from "~/components/quran/SajdahMarker";

interface MushafPageProps {
  pageNumber: number;
  /** "surahId:ayahNumber" formatında highlight edilecek ayet */
  highlightAyah?: string;
}

export function MushafPage({ pageNumber, highlightAyah }: MushafPageProps) {
  const { showTranslation, showTajweed, translationSlugs, arabicFontSize, textStyle } = useSettingsStore(
    useShallow((s) => ({
      showTranslation: s.showTranslation,
      showTajweed: s.showTajweed,
      translationSlugs: s.translationSlugs,
      arabicFontSize: s.arabicFontSize,
      textStyle: s.textStyle,
    }))
  );
  const useBasic = textStyle === "basic";
  const effectiveTajweed = showTajweed && !useBasic;
  const savePosition = useReadingStore((s) => s.savePosition);
  const { data: pageData } = usePageData(pageNumber, translationSlugs);

  // Mushaf satır verisi (gerçek satır düzeni)
  const { data: lineData } = useMushafLines(pageNumber, true);

  // Sayfadaki benzersiz sure ID'leri
  const surahIds = useMemo(
    () => [...new Set(pageData?.surahGroups.map((g) => g.surah.id) ?? [])],
    [pageData],
  );

  // Her sure için tecvid verisini yükle (max 2-3 sure/sayfa)
  const tj0 = useTajweed(surahIds[0] ?? 1, effectiveTajweed && surahIds.length > 0);
  const tj1 = useTajweed(surahIds[1] ?? 1, effectiveTajweed && surahIds.length > 1);
  const tj2 = useTajweed(surahIds[2] ?? 1, effectiveTajweed && surahIds.length > 2);

  // Her sure için imlâî verisini yükle
  const im0 = useImlaei(surahIds[0] ?? 1, useBasic && surahIds.length > 0);
  const im1 = useImlaei(surahIds[1] ?? 1, useBasic && surahIds.length > 1);
  const im2 = useImlaei(surahIds[2] ?? 1, useBasic && surahIds.length > 2);

  // Tüm tecvid verilerini birleştir: verseKey → html
  const tajweedMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (tj0.data) Object.assign(map, tj0.data);
    if (tj1.data) Object.assign(map, tj1.data);
    if (tj2.data) Object.assign(map, tj2.data);
    return map;
  }, [tj0.data, tj1.data, tj2.data]);

  // Tüm imlâî verilerini birleştir: verseKey → text
  const imlaeiMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (im0.data) Object.assign(map, im0.data);
    if (im1.data) Object.assign(map, im1.data);
    if (im2.data) Object.assign(map, im2.data);
    return map;
  }, [im0.data, im1.data, im2.data]);

  // Çoklu meal adları: slug → kısa ad
  const { data: translationSourceList } = useQuery({ ...translationSourcesQueryOptions(), enabled: translationSlugs.length > 1 });
  const translationNames = useMemo(() => {
    const map: Record<string, string> = {};
    if (translationSourceList) {
      for (const s of translationSourceList) map[s.slug] = s.name;
    }
    return map;
  }, [translationSourceList]);

  useReadingTracker(pageNumber);

  useEffect(() => {
    if (pageData && pageData.surahGroups.length > 0) {
      const firstAyah = pageData.surahGroups[0].ayahs[0];
      savePosition({
        surahId: firstAyah.surahId,
        ayahNumber: firstAyah.ayahNumber,
        pageNumber,
      });
    }
  }, [pageNumber, pageData, savePosition]);

  if (!pageData) {
    return <MushafSkeleton />;
  }

  // lineData branch için sure geçiş satırlarını hesapla
  const surahTransitions = useMemo((): { lineIndex: number; group: typeof pageData.surahGroups[0] }[] => {
    if (!lineData || !pageData) return [];
    // Sayfanın ilk grubundan sonraki isStart=true grupların geçiş satırını bul
    const transitions: { lineIndex: number; group: typeof pageData.surahGroups[0] }[] = [];
    const groups = pageData.surahGroups;
    if (groups.length <= 1) return transitions;

    // Satırları tarayıp ayet numarasının büyükten 1'e döndüğü yeri bul
    let prevVerseNum: number | null = null;
    let transitionGroupIdx = 1; // ilk geçiş için groups[1]

    for (let li = 0; li < lineData.lines.length; li++) {
      const line = lineData.lines[li];
      for (const word of line.words) {
        if (word.c === "e") {
          // Arapça rakamları sayıya çevir
          const num = parseInt(
            word.t.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))),
            10,
          );
          if (!isNaN(num)) {
            if (prevVerseNum !== null && num === 1 && prevVerseNum > 1) {
              // Sure geçişi: bu satırın başında yeni sure
              const group = groups[transitionGroupIdx];
              if (group?.isStart) {
                transitions.push({ lineIndex: li, group });
                transitionGroupIdx++;
              }
            }
            prevVerseNum = num;
          }
        }
      }
    }
    return transitions;
  }, [lineData, pageData]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Mushaf metin */}
      <div className="pb-8">
        {lineData ? (
          <>
            {/* Gerçek Mushaf satır düzeni — sure geçişlerini satır noktasına enjekte et */}
            {(() => {
              const firstGroup = pageData.surahGroups[0];
              const segments: ReactNode[] = [];
              let prevLineIdx = 0;

              // Sayfanın ilk grubu isStart ise üste başlık göster
              if (firstGroup?.isStart) {
                segments.push(
                  <SurahHeader
                    key={`sh-first-${firstGroup.surah.id}`}
                    surahId={firstGroup.surah.id}
                    nameArabic={firstGroup.surah.nameArabic}
                    nameSimple={firstGroup.surah.nameSimple}
                    showBismillah={firstGroup.surah.bismillahPre ?? false}
                  />
                );
              }

              for (const { lineIndex, group } of surahTransitions) {
                // Geçişten önceki satırlar
                const beforeLines: MushafPageLines = { lines: lineData.lines.slice(prevLineIdx, lineIndex) };
                if (beforeLines.lines.length > 0) {
                  segments.push(
                    <MushafLineView key={`mlv-${prevLineIdx}`} lineData={beforeLines} arabicFontSize={arabicFontSize} />
                  );
                }
                // Sure ayraç başlığı
                segments.push(
                  <SurahHeader
                    key={`sh-${group.surah.id}`}
                    surahId={group.surah.id}
                    nameArabic={group.surah.nameArabic}
                    nameSimple={group.surah.nameSimple}
                    showBismillah={group.surah.bismillahPre ?? false}
                  />
                );
                prevLineIdx = lineIndex;
              }

              // Kalan satırlar
              const remainingLines: MushafPageLines = { lines: lineData.lines.slice(prevLineIdx) };
              if (remainingLines.lines.length > 0) {
                segments.push(
                  <MushafLineView key={`mlv-${prevLineIdx}-end`} lineData={remainingLines} arabicFontSize={arabicFontSize} />
                );
              }

              return segments;
            })()}
            {/* Meal bloğu */}
            {showTranslation &&
              pageData.surahGroups.map((group) => (
                <MushafTranslations key={`tr-${group.surah.id}`} ayahs={group.ayahs} translationNames={translationNames} />
              ))}
          </>
        ) : (
          /* Fallback: akan metin (satır verisi yüklenemezse) */
          pageData.surahGroups.map((group) => (
            <div key={group.surah.id}>
              {group.isStart && (
                <SurahHeader
                  surahId={group.surah.id}
                  nameArabic={group.surah.nameArabic}
                  nameSimple={group.surah.nameSimple}
                  showBismillah={group.surah.bismillahPre}
                />
              )}

              {/* Akan Arapça metin bloğu */}
              <div
                className="leading-[2.8] py-2"
                dir="rtl"
                style={{
                  fontFamily: "var(--font-arabic)",
                  fontSize: `${arabicFontSize}rem`,
                  textAlign: "justify",
                  textAlignLast: "center",
                }}
              >
                {group.ayahs.map((ayah) => {
                  const vk = `${ayah.surahId}:${ayah.ayahNumber}`;
                  return (
                    <MushafVerse
                      key={vk}
                      surahId={ayah.surahId}
                      ayahNumber={ayah.ayahNumber}
                      textUthmani={useBasic ? cleanImlaei(imlaeiMap[vk] ?? ayah.textUthmani) : ayah.textUthmani}
                      textTajweed={effectiveTajweed ? tajweedMap[vk] : undefined}
                      translation={ayah.translation}
                      pageNumber={pageNumber}
                      highlight={highlightAyah === vk}
                      sajdah={ayah.sajdah}
                    />
                  );
                })}
              </div>

              {showTranslation && (
                <MushafTranslations ayahs={group.ayahs} translationNames={translationNames} />
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

// ── Inline ayet (akan metin içinde) ─────────────────────

interface MushafVerseProps {
  surahId: number;
  ayahNumber: number;
  textUthmani: string;
  textTajweed?: string;
  translation: string | null;
  pageNumber: number;
  highlight?: boolean;
  sajdah?: boolean;
}

function MushafVerse({ surahId, ayahNumber, textUthmani, textTajweed, translation, pageNumber, highlight, sajdah }: MushafVerseProps) {
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const colorizeWords = useSettingsStore((s) => s.colorizeWords);
  const colorPaletteId = useSettingsStore((s) => s.colorPaletteId);
  const wordColors = colorizeWords ? COLOR_PALETTES[colorPaletteId].colors : null;
  const verseRef = useRef<HTMLSpanElement>(null);
  const [flash, setFlash] = useState(highlight);

  // Audio word tracking
  const verseKey = `${surahId}:${ayahNumber}`;
  const isPlaying = useAudioStore((s) =>
    s.playbackState === "playing" && s.currentVerseKey === verseKey,
  );
  const wordPosition = useAudioStore((s) =>
    s.currentVerseKey === verseKey ? s.wordPosition : null,
  );

  useEffect(() => {
    if (highlight && verseRef.current) {
      verseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // Auto-scroll to currently playing verse
  useEffect(() => {
    if (isPlaying && verseRef.current) {
      verseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuAnchor(rect);
    setMenuOpen(true);
  }, []);

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark({ surahId, ayahNumber, pageNumber });
  }, [toggleBookmark, surahId, ayahNumber, pageNumber]);

  return (
    <>
      {/* Ayet metni — tecvid aktifse renkli, değilse kelime hover */}
      <span
        ref={verseRef}
        className={`transition-colors duration-1000 ${flash ? "bg-[var(--color-accent)]/15 rounded" : ""}`}
      >
        {textTajweed && !colorizeWords
          ? parseTajweed(textTajweed, true)
          : splitWords(textUthmani).map((word, i) => {
              const isActive = wordPosition === i + 1;
              const wc = wordColors && !isActive ? wordColors[i % wordColors.length] : undefined;
              return (
                <span
                  key={i}
                  className={`inline rounded-sm px-[0.06em] transition-colors duration-150 cursor-default ${
                    isActive
                      ? "word-audio-active"
                      : wc
                        ? "hover:bg-[var(--color-word-hover)]"
                        : "hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)]"
                  }`}
                  style={wc ? { color: wc } : undefined}
                >
                  {word}{" "}
                </span>
              );
            })}
      </span>
      {/* Ayet numarası — dekoratif daire */}
      <VerseEndMarker ayahNumber={ayahNumber} onClick={handleBadgeClick} variant="inline" />
      {sajdah && <SajdahMarker />}
      {/* Yer imi göstergesi */}
      {isBookmarked && (
        <button
          onClick={handleBookmarkClick}
          className="inline-flex items-center justify-center w-4 h-4 text-[var(--color-accent)] align-middle -mr-1"
          aria-label="Yer imini kaldır"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z" />
          </svg>
        </button>
      )}

      {/* Eylem menüsü */}
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
    </>
  );
}

// ── Meal listesi (akan metnin altında) ──────────────────

function MushafTranslations({ ayahs, translationNames }: {
  ayahs: Array<{ surahId: number; ayahNumber: number; translations: Record<string, string> }>;
  translationNames: Record<string, string>;
}) {
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const multiMode = translationSlugs.length > 1;

  const withTranslation = ayahs.filter((a) => Object.keys(a.translations).length > 0);
  if (withTranslation.length === 0) return null;

  // Tekli meal — eskisi gibi düz liste
  if (!multiMode) {
    const slug = translationSlugs[0];
    return (
      <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
        {withTranslation.map((ayah) => {
          const text = ayah.translations[slug];
          if (!text) return null;
          return (
            <p
              key={`${ayah.surahId}:${ayah.ayahNumber}`}
              className="text-[var(--color-text-translation)] leading-[1.7]"
              style={{ fontSize: `${translationFontSize}rem` }}
            >
              <span className="text-[var(--color-text-secondary)] text-xs mr-1 font-medium">
                {ayah.ayahNumber}.
              </span>
              {text}
            </p>
          );
        })}
      </div>
    );
  }

  // Çoklu meal — kaynak bazlı gruplama
  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4">
      {translationSlugs.map((slug) => {
        const verses = withTranslation
          .map((a) => ({ ...a, text: a.translations[slug] }))
          .filter((a) => a.text);
        if (verses.length === 0) return null;
        return (
          <div key={slug}>
            <p className="text-[0.7rem] font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide">
              {translationNames[slug] ?? slug}
            </p>
            <div className="space-y-1">
              {verses.map((ayah) => (
                <p
                  key={`${ayah.surahId}:${ayah.ayahNumber}:${slug}`}
                  className="text-[var(--color-text-translation)] leading-[1.7]"
                  style={{ fontSize: `${translationFontSize}rem` }}
                >
                  <span className="text-[var(--color-text-secondary)] text-xs mr-1 font-medium">
                    {ayah.ayahNumber}.
                  </span>
                  {ayah.text}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
