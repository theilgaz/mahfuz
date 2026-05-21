/**
 * Sure görünümü (liste modu) -- tüm ayetleri sırayla gösterir.
 * Redesigned layout: top bar, chapter header, verse blocks with side actions,
 * right sidebar (TOC + font control + bookmarks), footer with nav.
 */

import { useSettingsStore, type ReadingMode } from "~/stores/settings.store";
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
import { useSwipeNav } from "~/hooks/useSwipeNav";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { Ornament } from "~/components/minimal-ui/Ornament";
import { MuIcons } from "~/components/minimal-ui/icons";
import { useAudioStore } from "~/stores/audio.store";
import { fetchChapterAudioForSlug } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import { OrnamentalMushafView } from "./OrnamentalMushafView";

interface SurahViewProps {
  surahId: number;
  highlightAyah?: number;
}

export function SurahView({ surahId, highlightAyah }: SurahViewProps) {
  const { showTranslation, readingMode, setReadingMode, showTajweed, translationSlugs, textStyle, arabicFontSize } = useSettingsStore(
    useShallow((s) => ({
      showTranslation: s.showTranslation,
      readingMode: s.readingMode,
      setReadingMode: s.setReadingMode,
      showTajweed: s.showTajweed,
      translationSlugs: s.translationSlugs,
      textStyle: s.textStyle,
      arabicFontSize: s.arabicFontSize,
    }))
  );
  const useBasic = textStyle === "basic";
  const isWbw = readingMode === "wbw";
  const isVerse = readingMode === "verse";
  const isMushaf = readingMode === "mushaf";
  const isMeal = readingMode === "meal";
  const primaryMode: "ayet" | "mushaf" = isMushaf || isMeal ? "mushaf" : "ayet";
  const effectiveTajweed = showTajweed && !useBasic;

  const flipSubMode = useCallback(() => {
    if (primaryMode === "ayet") setReadingMode(isWbw ? "verse" : "wbw");
    else setReadingMode(isMeal ? "mushaf" : "meal");
  }, [primaryMode, isWbw, isMeal, setReadingMode]);
  const { t, locale } = useTranslation();
  const savePosition = useReadingStore((s) => s.savePosition);

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

  // Container ref for scoped swipe gestures
  const containerRef = useRef<HTMLDivElement | null>(null);
  useSwipeNav({
    target: containerRef,
    onSwipeLeft: flipSubMode,
    onSwipeRight: flipSubMode,
  });

  // Active verse tracking
  const [activeAyah, setActiveAyah] = useState(1);
  const ayahRefs = useRef<Map<number, HTMLElement>>(new Map());
  const setAyahRef = useCallback((ayahNumber: number, el: HTMLElement | null) => {
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

    // Defer observation to next frame so callback refs are set after render
    const rafId = requestAnimationFrame(() => {
      for (const el of ayahRefs.current.values()) {
        observer.observe(el);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [surahId, data, readingMode, savePosition]);

  // Scroll to highlighted ayah
  useEffect(() => {
    if (!highlightAyah || !data) return;
    let id: number;
    id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const el = ayahRefs.current.get(highlightAyah);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("mu-flash");
        setTimeout(() => el.classList.remove("mu-flash"), 3000);
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

  const { audioPlaybackState, audioChapterId, playSurahFn, togglePlayPause } = useAudioStore(
    useShallow((s) => ({
      audioPlaybackState: s.playbackState,
      audioChapterId: s.chapterId,
      playSurahFn: s.playSurah,
      togglePlayPause: s.togglePlayPause,
    }))
  );
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const [audioLoading, setAudioLoading] = useState(false);

  const isThisSurahPlaying = audioChapterId === surahId && (audioPlaybackState === "playing" || audioPlaybackState === "paused");
  const isPlaying = audioChapterId === surahId && audioPlaybackState === "playing";

  const handleTopbarPlay = useCallback(async () => {
    if (isThisSurahPlaying) {
      togglePlayPause();
      return;
    }
    setAudioLoading(true);
    try {
      const audioData = await fetchChapterAudioForSlug(reciterSlug, surahId);
      if (audioData) {
        playSurahFn(surahId, SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`, audioData);
      }
    } finally {
      setAudioLoading(false);
    }
  }, [surahId, reciterSlug, isThisSurahPlaying, togglePlayPause, playSurahFn]);

  if (!data || !data.surah) {
    return <SurahSkeleton />;
  }

  const surah = data.surah;
  const surahName = getSurahName(surahId, locale) || surah.nameSimple;
  const surahMeaning = getSurahMeaning(surahId, locale);

  const progressPct = surah.ayahCount > 0 ? (activeAyah / surah.ayahCount) * 100 : 0;

  return (
    <>
      {/* Top bar - outside grid for sticky */}
      <div className="mu-reader-topbar" style={{ flexDirection: "column", gap: 0, padding: "12px 0 0", borderBottom: "none" }}>
          {/* Row 1: back + name + (mushaf: mode seg | other: bookmark/share) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 0 6px" }}>
            {/* Left: back */}
            <Link to="/" className="mu-icon-btn sm" aria-label={t.reader.index} style={{ color: "var(--mu-ink-3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Center: play + surah name + counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, justifyContent: "center" }}>
              <button
                onClick={handleTopbarPlay}
                disabled={audioLoading}
                className="mu-topbar-play"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {audioLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mu-spin">
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                ) : isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <span style={{ fontFamily: "var(--mu-ff-display)", fontSize: 16, fontWeight: 500, color: "var(--mu-ink)", whiteSpace: "nowrap" }}>
                {surahName}
              </span>
              <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--mu-muted)", textTransform: "uppercase" }}>
                {activeAyah} / {surah.ayahCount}
              </span>
            </div>

            {/* Right: view mode dropdown (Ayet / Mushaf groups, 4 modes) */}
            <ViewModeMenu mode={readingMode} onSelect={setReadingMode} t={t} />
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 2, background: "var(--mu-line)", borderRadius: 1 }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--mu-accent)", borderRadius: 1, transition: "width 0.3s ease" }} />
          </div>
        </div>
      <div ref={containerRef} className={`mu-reader${primaryMode === "mushaf" ? " mu-reader--mushaf" : ""}`} style={{ "--arabic-size": `${arabicFontSize}rem` } as React.CSSProperties}>
        {/* Main content */}
        <div>
          {isMushaf ? (
            <>
              <OrnamentalMushafView
                surahId={surahId}
                nameArabic={surah.nameArabic}
                nameMeaning={surahMeaning}
                bismillahPre={surah.bismillahPre}
                ayahs={ayahList}
                onAyahRef={setAyahRef}
              />
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
            </>
          ) : isMeal ? (
            <>
              <header className="mu-chap-head mu-chap-head--mini">
                <div className="mu-chap-ar" dir="rtl">{surah.nameArabic}</div>
                {surahMeaning && <span className="mu-chap-tr">{surahMeaning}</span>}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                  <Ornament size={18} />
                </div>
              </header>
              <ol className="mu-meal-list">
                {ayahList.map((ayah) => (
                  <li
                    key={ayah.ayahNumber}
                    ref={(el) => setAyahRef(ayah.ayahNumber, el)}
                    data-ayah={ayah.ayahNumber}
                    className={`mu-meal-item${activeAyah === ayah.ayahNumber ? " active" : ""}`}
                  >
                    <span className="mu-meal-num">{ayah.ayahNumber}</span>
                    <p className="mu-meal-text">{ayah.translation ?? ""}</p>
                  </li>
                ))}
              </ol>
              <footer className="mu-chap-foot">
                <Ornament size={22} />
                <p className="mu-chap-end">{t.reader.endOfSurah}</p>
                <div className="mu-chap-nav">
                  <Link to="/" className="mu-btn ghost">
                    {t.reader.backToIndex}
                  </Link>
                  {surahId < 114 && <NextSurahButton currentSurahId={surahId} />}
                </div>
              </footer>
            </>
          ) : (
            <>
              {/* Chapter header — minimal: Arabic name + meaning */}
              <header className="mu-chap-head mu-chap-head--mini">
                <div className="mu-chap-ar" dir="rtl">{surah.nameArabic}</div>
                {surahMeaning && <span className="mu-chap-tr">{surahMeaning}</span>}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                  <Ornament size={18} />
                </div>
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
            </>
          )}
        </div>

        {/* Right sidebar — hidden in Mushaf primary mode (mushaf + meal) */}
        {primaryMode === "ayet" && (
          <SurahSidebar
            ayahList={ayahList}
            activeAyah={activeAyah}
            surahId={surahId}
            ayahRefs={ayahRefs}
          />
        )}
      </div>
    </>
  );
}

// -- View mode menu: single button + grouped dropdown (Ayet / Mushaf × 2 sub-modes) --

function ViewModeMenu({
  mode,
  onSelect,
  t,
}: {
  mode: ReadingMode;
  onSelect: (m: ReadingMode) => void;
  t: any;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const labels: Record<ReadingMode, string> = {
    verse: t.settings.modeVerse,
    wbw: t.settings.modeWbw,
    mushaf: "Mushaf",
    meal: "Meal",
  };

  const groups: { heading: string; items: { mode: ReadingMode; label: string }[] }[] = [
    { heading: "Ayet", items: [
      { mode: "verse", label: labels.verse },
      { mode: "wbw", label: labels.wbw },
    ]},
    { heading: "Mushaf", items: [
      { mode: "mushaf", label: labels.mushaf },
      { mode: "meal", label: labels.meal },
    ]},
  ];

  return (
    <div ref={wrapRef} className="mu-view-menu">
      <button
        type="button"
        className="mu-view-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.settings.readingMode}: ${labels[mode]}`}
      >
        <span className="mu-view-menu-btn-text">{labels[mode]}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4L5 7L8 4" />
        </svg>
      </button>
      {open && (
        <div role="listbox" className="mu-view-menu-pop">
          {groups.map((g) => (
            <div key={g.heading} className="mu-view-menu-group">
              <p className="mu-view-menu-heading">{g.heading}</p>
              {g.items.map((it) => {
                const active = it.mode === mode;
                return (
                  <button
                    key={it.mode}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelect(it.mode);
                      setOpen(false);
                    }}
                    className={`mu-view-menu-item${active ? " on" : ""}`}
                  >
                    <span className="mu-view-menu-check" aria-hidden="true">
                      {active ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 6.5L5 9L9.5 3.5" />
                        </svg>
                      ) : null}
                    </span>
                    <span>{it.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Verse side actions (number + bookmark + play + copy) --

function VerseActions({ surahId, ayahNumber, pageNumber }: { surahId: number; ayahNumber: number; pageNumber: number }) {
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const { playSurah, currentChapterId, engine } = useAudioStore(
    useShallow((s) => ({ playSurah: s.playSurah, currentChapterId: s.chapterId, engine: s.engine }))
  );
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);

  const handlePlay = useCallback(async () => {
    const verseKey = `${surahId}:${ayahNumber}`;
    if (currentChapterId === surahId && engine) {
      engine.playByKey(verseKey);
      return;
    }
    const audioData = await fetchChapterAudioForSlug(reciterSlug, surahId);
    if (audioData) {
      playSurah(surahId, SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`, audioData, verseKey);
    }
  }, [surahId, ayahNumber, currentChapterId, engine, reciterSlug, playSurah]);

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
  ayahRefs: React.RefObject<Map<number, HTMLElement>>;
}

const FONT_PRESETS = [
  { id: "small", size: 1.5 },
  { id: "medium", size: 1.8 },
  { id: "large", size: 3.0 },
] as const;

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
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("mu-flash");
    setTimeout(() => el.classList.remove("mu-flash"), 3000);
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
          {tocItems.map((ayah, i) => {
            const next = tocItems[i + 1]?.ayahNumber ?? Infinity;
            const isActive = activeAyah >= ayah.ayahNumber && activeAyah < next;
            return (
            <li key={ayah.ayahNumber} className={isActive ? "on" : ""}>
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
            );
          })}
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
          <div className="mu-rside-fontctl-preview">
            <span dir="rtl" style={{ fontSize: `${Math.min(arabicFontSize, 2.2)}rem` }}>ع</span>
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
                  <span className="mu-rside-toc-text">
                    {(() => {
                      const ayah = ayahList.find((a) => a.ayahNumber === b.ayahNumber);
                      const tr = ayah?.translation;
                      return tr ? tr.slice(0, 60) + (tr.length > 60 ? "..." : "") : `Ayet ${b.ayahNumber}`;
                    })()}
                  </span>
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
