/**
 * Sure gorünümü (liste modu) — tüm ayetleri sırayla gosterir.
 * Redesigned layout: top bar, chapter header, verse blocks with side actions,
 * right sidebar (TOC + font control + bookmarks), footer with nav.
 */

import { useSettingsStore } from "~/stores/settings.store";
import { useShallow } from "zustand/react/shallow";
import { useReadingStore } from "~/stores/reading.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useTajweed, useImlaei, translationSourcesQueryOptions, useSurahs, surahDataQueryOptions } from "~/hooks/useQuranQuery";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWbwData } from "~/hooks/useWbwData";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { AyahBlock } from "./AyahBlock";
import { SurahSkeleton } from "./SurahSkeleton";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { getSurahDescription } from "~/lib/surah-descriptions";
import { useTranslation } from "~/hooks/useTranslation";
import { Ornament } from "~/components/minimal-ui/Ornament";
import { MuIcons } from "~/components/minimal-ui/icons";
import { useAudioStore } from "~/stores/audio.store";
import { fetchChapterAudio, SLUG_TO_QDC_ID } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";

interface SurahViewProps {
  surahId: number;
  highlightAyah?: number;
}

export function SurahView({ surahId, highlightAyah }: SurahViewProps) {
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const showTajweed = useSettingsStore((s) => s.showTajweed);
  const translationSlugs = useSettingsStore(useShallow((s) => s.translationSlugs));
  const textStyle = useSettingsStore((s) => s.textStyle);
  const useBasic = textStyle === "basic";
  const isWbw = readingMode === "wbw";
  const isVerse = readingMode === "verse";
  const effectiveTajweed = showTajweed && !useBasic && !isWbw;
  const { t, locale } = useTranslation();
  const savePosition = useReadingStore((s) => s.savePosition);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);

  const { data } = useQuery({
    ...surahDataQueryOptions(surahId, translationSlugs),
    placeholderData: keepPreviousData,
  });
  const { data: tajweedData } = useTajweed(surahId, effectiveTajweed);
  const { data: imlaeiData } = useImlaei(surahId, useBasic);
  const { data: wbwData } = useWbwData(surahId, isWbw || isVerse, locale);
  const { data: translationSourceList } = useQuery({ ...translationSourcesQueryOptions(), enabled: translationSlugs.length > 1 });

  const translationNames = useMemo(() => {
    const map: Record<string, string> = {};
    if (translationSourceList) {
      for (const s of translationSourceList) map[s.slug] = s.name;
    }
    return map;
  }, [translationSourceList]);

  const firstPage = data?.ayahs[0]?.pageNumber ?? 0;
  useReadingTracker(firstPage);

  // Active verse tracking
  const [activeAyah, setActiveAyah] = useState(1);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const setAyahRef = useCallback((ayahNumber: number, el: HTMLDivElement | null) => {
    if (el) ayahRefs.current.set(ayahNumber, el);
    else ayahRefs.current.delete(ayahNumber);
  }, []);

  useEffect(() => {
    if (!data) return;

    savePosition({
      surahId,
      ayahNumber: 1,
      pageNumber: data.ayahs[0]?.pageNumber ?? 1,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number(e.target.getAttribute("data-ayah")))
          .filter((n) => !isNaN(n));

        if (visible.length === 0) return;
        const topAyah = Math.min(...visible);
        setActiveAyah(topAyah);
        const ayah = data.ayahs.find((a) => a.ayahNumber === topAyah);
        if (ayah) {
          savePosition({
            surahId,
            ayahNumber: topAyah,
            pageNumber: ayah.pageNumber,
          });
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    for (const el of ayahRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [surahId, data, savePosition]);

  // Scroll to highlighted ayah
  useEffect(() => {
    if (!highlightAyah || !data) return;
    let id: number;
    id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const el = ayahRefs.current.get(highlightAyah);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [highlightAyah, data]);

  const ayahList = data?.ayahs ?? [];

  const sharedProps = useMemo(() => ({
    surahId,
    useBasic,
    imlaeiData,
    effectiveTajweed,
    tajweedData,
    translationNames,
    showTranslation: showTranslation && !isWbw,
    showTajweed,
    highlightAyah,
    isWbw,
    isVerse,
    wbwData,
  }), [surahId, useBasic, imlaeiData, effectiveTajweed, tajweedData, translationNames, showTranslation, isWbw, isVerse, showTajweed, highlightAyah, wbwData]);

  const renderAyah = useCallback(
    (ayah: (typeof ayahList)[number]) => (
      <AyahBlock
        surahId={sharedProps.surahId}
        ayahNumber={ayah.ayahNumber}
        textUthmani={sharedProps.useBasic ? cleanImlaei(sharedProps.imlaeiData?.[`${sharedProps.surahId}:${ayah.ayahNumber}`] ?? ayah.textUthmani) : ayah.textUthmani}
        textTajweed={sharedProps.effectiveTajweed ? sharedProps.tajweedData?.[`${sharedProps.surahId}:${ayah.ayahNumber}`] : undefined}
        translation={ayah.translation}
        translations={ayah.translations}
        translationNames={sharedProps.translationNames}
        showTranslation={sharedProps.showTranslation}
        showTajweed={sharedProps.showTajweed}
        pageNumber={ayah.pageNumber}
        highlight={sharedProps.highlightAyah === ayah.ayahNumber}
        wbwWords={(sharedProps.isWbw || sharedProps.isVerse) ? sharedProps.wbwData?.get(`${sharedProps.surahId}:${ayah.ayahNumber}`) : undefined}
        sajdah={!!ayah.sajdah}
      />
    ),
    [sharedProps],
  );

  if (!data || !data.surah) {
    return <SurahSkeleton />;
  }

  const surah = data.surah;
  const surahName = getSurahName(surahId, locale) || surah.nameSimple;
  const surahMeaning = getSurahMeaning(surahId, locale);
  const surahDesc = getSurahDescription(surahId, locale);
  const typeLabel = surah.revelation === "makkah" ? "Mekki sure" : "Medeni sure";

  return (
    <>
      <div className="mu-reader" style={{ "--arabic-size": `${arabicFontSize}rem` } as React.CSSProperties}>
        {/* Top bar */}
        <div className="mu-reader-topbar">
          <Link to="/" className="mu-btn ghost small">
            {MuIcons.back}
            {t.reader.index}
          </Link>
          <span className="mu-chap-eyebrow" style={{ margin: 0 }}>
            Sure {surahId} · {activeAyah} / {surah.ayahCount}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="mu-v-act-btn" aria-label={t.reader.bookmark}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4h10v17l-5-3.5L7 21z" />
              </svg>
            </button>
            <button className="mu-v-act-btn" aria-label="Share">
              {MuIcons.share}
            </button>
          </div>
        </div>
        {/* Main content */}
        <div>
          {/* Chapter header */}
          <header className="mu-chap-head">
            <p className="mu-chap-eyebrow">
              {typeLabel} · {surah.ayahCount} ayet · Nuzul {surah.revelationOrder}
            </p>
            <div className="mu-chap-ar" dir="rtl">
              سُورَةُ {surah.nameArabic}
            </div>
            <h1 className="mu-chap-title">
              <span className="mu-chap-name">{surahName}</span>
              {surahMeaning && <span className="mu-chap-tr">{surahMeaning}</span>}
            </h1>
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <Ornament size={22} />
            </div>
            {surahDesc && (
              <p className="mu-chap-intro">{surahDesc}</p>
            )}
          </header>

          {/* Bismillah */}
          {surah.bismillahPre && (
            <p className="mu-bismillah" dir="rtl">
              بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </p>
          )}

          {/* Verses */}
          <div>
            {ayahList.map((ayah) => (
              <div
                key={ayah.ayahNumber}
                ref={(el) => setAyahRef(ayah.ayahNumber, el)}
                data-ayah={ayah.ayahNumber}
                className={`mu-verse${activeAyah === ayah.ayahNumber ? " active" : ""}`}
              >
                <VerseActions
                  surahId={surahId}
                  ayahNumber={ayah.ayahNumber}
                  pageNumber={ayah.pageNumber}
                />
                <div>
                  {renderAyah(ayah)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer className="mu-chap-foot">
            <Ornament size={22} />
            <p className="mu-chap-end">{t.reader.endOfSurah}</p>
            <div className="mu-chap-nav">
              <Link to="/" className="mu-btn ghost">
                {t.reader.backToIndex}
              </Link>
              {surahId < 114 && (
                <NextSurahButton currentSurahId={surahId} />
              )}
            </div>
          </footer>
        </div>

        {/* Right sidebar */}
        <SurahSidebar
          ayahList={ayahList}
          activeAyah={activeAyah}
          surahId={surahId}
          ayahRefs={ayahRefs}
        />
      </div>
    </>
  );
}

// -- Verse side actions (number + bookmark + play + copy) --

function VerseActions({ surahId, ayahNumber, pageNumber }: { surahId: number; ayahNumber: number; pageNumber: number }) {
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const playSurah = useAudioStore((s) => s.playSurah);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);

  const handlePlay = useCallback(async () => {
    const reciterId = SLUG_TO_QDC_ID[reciterSlug] ?? 7;
    const audioData = await fetchChapterAudio(reciterId, surahId);
    if (audioData) {
      playSurah(surahId, SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`, audioData, `${surahId}:${ayahNumber}`);
    }
  }, [surahId, ayahNumber, reciterSlug, playSurah]);

  return (
    <div className="mu-v-side">
      <div className="mu-v-num">
        <span>{ayahNumber}</span>
      </div>
      <div className="mu-v-actions">
        <button
          className={`mu-v-act-btn${isBookmarked ? " on" : ""}`}
          onClick={() => toggleBookmark({ surahId, ayahNumber, pageNumber })}
          aria-label="Bookmark"
        >
          <svg viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4h10v17l-5-3.5L7 21z" />
          </svg>
        </button>
        <button className="mu-v-act-btn" onClick={handlePlay} aria-label="Play">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button
          className="mu-v-act-btn"
          aria-label="Copy"
          onClick={() => {
            const el = document.querySelector(`[data-ayah="${ayahNumber}"]`);
            const text = el?.textContent ?? "";
            navigator.clipboard.writeText(text);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="1.5" />
            <path d="M5 15V5a1.5 1.5 0 011.5-1.5H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// -- Right sidebar --

interface SurahSidebarProps {
  ayahList: Array<{ ayahNumber: number; translation: string | null }>;
  activeAyah: number;
  surahId: number;
  ayahRefs: React.RefObject<Map<number, HTMLDivElement>>;
}

function SurahSidebar({ ayahList, activeAyah, surahId, ayahRefs }: SurahSidebarProps) {
  const { t } = useTranslation();
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const STEP = 0.15;
  const sizeInPx = Math.round(arabicFontSize * 16);

  const surahBookmarks = bookmarks.filter((b) => b.surahId === surahId);

  const scrollToAyah = useCallback((ayahNumber: number) => {
    const el = ayahRefs.current?.get(ayahNumber);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ayahRefs]);

  // Show max ~8 TOC items for short surahs, every Nth for long ones
  const tocItems = useMemo(() => {
    if (ayahList.length <= 10) return ayahList;
    const step = Math.ceil(ayahList.length / 8);
    const items = [];
    for (let i = 0; i < ayahList.length; i += step) {
      items.push(ayahList[i]);
    }
    return items;
  }, [ayahList]);

  return (
    <aside className="mu-rside">
      {/* Table of Contents */}
      <div className="mu-rside-block">
        <h3 className="mu-rside-label">{t.reader.toc}</h3>
        <ul className="mu-rside-toc">
          {tocItems.map((ayah) => (
            <li key={ayah.ayahNumber} className={activeAyah === ayah.ayahNumber ? "on" : ""}>
              <button onClick={() => scrollToAyah(ayah.ayahNumber)}>
                <span className="mu-rside-toc-num">
                  {String(ayah.ayahNumber).padStart(2, "0")}
                </span>
                <span className="mu-rside-toc-text">
                  {ayah.translation
                    ? ayah.translation.slice(0, 60) + (ayah.translation.length > 60 ? "..." : "")
                    : `Ayet ${ayah.ayahNumber}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Font size control */}
      <div className="mu-rside-block">
        <h3 className="mu-rside-label">{t.reader.fontType}</h3>
        <div className="mu-rside-fontctl">
          <button
            onClick={() => setArabicFontSize(arabicFontSize - STEP)}
            aria-label={t.reader.decreaseFont}
          >
            -
          </button>
          <div className="mu-rside-fontctl-preview" style={{ fontSize: `${arabicFontSize}rem` }}>
            <span dir="rtl">ا</span>
          </div>
          <button
            onClick={() => setArabicFontSize(arabicFontSize + STEP)}
            aria-label={t.reader.increaseFont}
          >
            +
          </button>
          <span className="mu-rside-fontctl-size">{sizeInPx}px</span>
        </div>
      </div>

      {/* Bookmarks */}
      <div className="mu-rside-block">
        <h3 className="mu-rside-label">{t.nav?.bookmarks ?? "Yer imleri"}</h3>
        {surahBookmarks.length > 0 ? (
          <ul className="mu-rside-toc">
            {surahBookmarks.map((b) => (
              <li key={b.ayahNumber}>
                <button onClick={() => scrollToAyah(b.ayahNumber)}>
                  <span className="mu-rside-toc-num">{b.ayahNumber}</span>
                  <span className="mu-rside-toc-text">Ayet {b.ayahNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mu-rside-hint">{t.reader.bookmarksHint}</p>
        )}
      </div>
    </aside>
  );
}

// -- Next surah button --

function NextSurahButton({ currentSurahId }: { currentSurahId: number }) {
  const { locale, t } = useTranslation();
  const { data: surahs } = useSurahs();
  const nextSurahId = currentSurahId + 1;
  const nextSurah = surahs.find((s) => s.id === nextSurahId);
  if (!nextSurah) return null;

  return (
    <Link
      to="/surah/$surahSlug"
      params={{ surahSlug: surahSlug(nextSurahId) }}
      search={{ ayah: undefined }}
      className="mu-btn primary"
    >
      {t.reader.nextSurah}
      {MuIcons.arrowRight}
    </Link>
  );
}
