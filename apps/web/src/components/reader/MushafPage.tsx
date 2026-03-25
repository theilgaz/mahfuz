/**
 * Mushaf sayfası — fiziksel Kur'an sayfası gibi akan metin.
 * Ayetler bitişik akıyor, ayet numaraları inline badge olarak gösteriliyor.
 */

import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { usePageData, useTajweed, useImlaei } from "~/hooks/useQuranQuery";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { parseTajweed } from "~/lib/tajweed-parser";
import { SurahHeader } from "./SurahHeader";
import { PageNav } from "./PageNav";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { AyahActionMenu } from "./AyahActionMenu";
import { useTranslation } from "~/hooks/useTranslation";

interface MushafPageProps {
  pageNumber: number;
  /** "surahId:ayahNumber" formatında highlight edilecek ayet */
  highlightAyah?: string;
}

export function MushafPage({ pageNumber, highlightAyah }: MushafPageProps) {
  const { showTranslation, showTajweed, translationSlug, arabicFontSize, textStyle } = useSettingsStore();
  const { t } = useTranslation();
  const useBasic = textStyle === "basic";
  const effectiveTajweed = showTajweed && !useBasic;
  const savePosition = useReadingStore((s) => s.savePosition);
  const { data: pageData } = usePageData(pageNumber, translationSlug);

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
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[var(--color-text-secondary)]">
        Sayfa bulunamadı
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <PageNav pageNumber={pageNumber} enableSwipe />

      {/* Cüz bilgisi */}
      <div className="text-center text-xs text-[var(--color-text-secondary)] py-1">
        {pageData.juzNumber}. {t.common.juz}
      </div>

      {/* Mushaf akan metin */}
      <div className="pb-8">
        {pageData.surahGroups.map((group) => (
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
              className="text-right leading-[2.8] text-justify py-2"
              dir="rtl"
              style={{
                fontFamily: "var(--font-arabic)",
                fontSize: `${arabicFontSize}rem`,
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
                  />
                );
              })}
            </div>

            {/* Meal bloğu — akan metnin altında, ayet ayet */}
            {showTranslation && (
              <MushafTranslations ayahs={group.ayahs} />
            )}
          </div>
        ))}
      </div>

      <PageNav pageNumber={pageNumber} />
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
}

function MushafVerse({ surahId, ayahNumber, textUthmani, textTajweed, translation, pageNumber, highlight }: MushafVerseProps) {
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const verseRef = useRef<HTMLSpanElement>(null);
  const [flash, setFlash] = useState(highlight);

  useEffect(() => {
    if (highlight && verseRef.current) {
      verseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

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
        {textTajweed
          ? parseTajweed(textTajweed, true)
          : textUthmani.split(/\s+/).map((word, i) => (
              <span
                key={i}
                className="inline rounded-sm px-[0.06em] transition-colors duration-150 hover:bg-[var(--color-word-hover)] hover:text-[var(--color-word-hover-text)] cursor-default"
              >
                {word}{" "}
              </span>
            ))}
      </span>
      {/* Ayet numarası badge */}
      <button
        onClick={handleBadgeClick}
        className="inline-flex items-center justify-center mx-1 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors cursor-pointer align-middle"
        style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem" }}
        aria-label={`Ayet ${ayahNumber}`}
      >
        {ayahNumber}
      </button>
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

function MushafTranslations({ ayahs }: {
  ayahs: Array<{ surahId: number; ayahNumber: number; translation: string | null }>;
}) {
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);

  const withTranslation = ayahs.filter((a) => a.translation);
  if (withTranslation.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
      {withTranslation.map((ayah) => (
        <p
          key={`${ayah.surahId}:${ayah.ayahNumber}:tr`}
          className="text-[var(--color-text-translation)] leading-[1.7]"
          style={{ fontSize: `${translationFontSize}rem` }}
        >
          <span className="text-[var(--color-text-secondary)] text-xs mr-1 font-medium">
            {ayah.ayahNumber}.
          </span>
          {ayah.translation}
        </p>
      ))}
    </div>
  );
}
