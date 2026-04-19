/**
 * Sure listesi + yuzen cuz butonu.
 * Liste (varsayilan) ve grid gorunumu arasi gecis.
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { JUZ_FIRST_SURAH, JUZ_FIRST_PAGE, TOTAL_JUZ } from "@mahfuz/shared";
import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";

const ALL_JUZ = Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1);

/** Nuzul'a gore cami gorseli: Mekki -> Kaaba, Medeni -> Nabawi */
const MOSQUE_SRC: Record<string, string> = {
  makkah: "/images/kaaba.png",
  madinah: "/images/nabawi.png",
};

const CURATED_COLLECTIONS = {
  prayer: { surahIds: [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] },
  popular: { surahIds: [36, 48, 55, 56, 67, 18] },
  amma: { surahIds: Array.from({ length: 37 }, (_, i) => 78 + i) },
  tabaraka: { surahIds: Array.from({ length: 11 }, (_, i) => 67 + i) },
} as const;

type CollectionKey = keyof typeof CURATED_COLLECTIONS;

interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  revelation: string;
  revelationOrder: number;
  ayahCount: number;
  pageStart: number;
}

interface SurahListProps {
  surahs: Surah[];
}

export function SurahList({ surahs }: SurahListProps) {
  const surahListFilter = useSettingsStore((s) => s.surahListFilter);
  const setSurahListFilter = useSettingsStore((s) => s.setSurahListFilter);
  const lastSurahId = useReadingStore((s) => s.lastPosition?.surahId ?? null);
  const { t, locale } = useTranslation();
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredSurahs = useMemo(() => {
    if (surahListFilter === "nuzul") {
      return [...surahs].sort((a, b) => a.revelationOrder - b.revelationOrder);
    }
    if (surahListFilter === "all") return surahs;
    return surahs.filter((s) => s.revelation === surahListFilter);
  }, [surahs, surahListFilter]);

  const didScrollRef = useRef(false);
  useEffect(() => {
    if (didScrollRef.current || !lastSurahId) return;
    const el = itemRefs.current.get(lastSurahId);
    if (!el) return;
    didScrollRef.current = true;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "instant", block: "center" });
    });
  }, [lastSurahId]);

  const [juzOpen, setJuzOpen] = useState(false);
  const [highlightSurahId, setHighlightSurahId] = useState<number | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionKey | null>(null);
  const juzPanelRef = useRef<HTMLDivElement>(null);

  const handleJuzSurah = useCallback((juz: number) => {
    setJuzOpen(false);
    const surahId = JUZ_FIRST_SURAH[juz];
    if (!surahId) return;
    setHighlightSurahId(surahId);
    const el = itemRefs.current.get(surahId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightSurahId(null), 2000);
  }, []);

  useEffect(() => {
    if (!juzOpen) return;
    function handleClick(e: MouseEvent) {
      if (juzPanelRef.current && !juzPanelRef.current.contains(e.target as Node)) {
        setJuzOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [juzOpen]);

  const filterChips: Array<{ key: typeof surahListFilter; label: string; icon?: string }> = [
    { key: "all", label: t.surahList.filterAll },
    { key: "makkah", label: t.surahList.filterMakki, icon: "/images/kaaba.png" },
    { key: "madinah", label: t.surahList.filterMadani, icon: "/images/nabawi.png" },
    { key: "nuzul", label: t.surahList.filterNuzul },
  ];

  const linkProps = useCallback((surah: Surah) => ({
    to: "/surah/$surahSlug" as const,
    params: { surahSlug: surahSlug(surah.id) },
    search: { ayah: undefined },
    preload: "intent" as const,
  }), []);

  const displayNumber = useCallback((surah: Surah) =>
    surahListFilter === "nuzul" ? surah.revelationOrder : surah.id
  , [surahListFilter]);

  return (
    <div className="relative">
      {/* Filtre + gorunum toggle */}
      <div className="flex items-center gap-2 mb-3">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setSurahListFilter(chip.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              surahListFilter === chip.key
                ? "bg-[var(--color-accent)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            {chip.icon && (
              <img src={chip.icon} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
            )}
            {chip.label}
          </button>
        ))}

        <div className="ml-auto flex items-center border border-[var(--color-border)] rounded overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)]"}`}
            aria-label="Liste"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="3" x2="15" y2="3" /><line x1="1" y1="8" x2="15" y2="8" /><line x1="1" y1="13" x2="15" y2="13" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)]"}`}
            aria-label="Grid"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="5.5" height="5.5" rx="1" /><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
              <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" /><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Liste gorunumu */}
      {viewMode === "list" ? (
        <div>
          {filteredSurahs.map((surah) => {
            const isLast = surah.id === lastSurahId;
            const isHighlighted = highlightSurahId === surah.id;
            return (
              <div
                key={surah.id}
                ref={(el: HTMLDivElement | null) => {
                  if (el) itemRefs.current.set(surah.id, el);
                }}
              >
                <Link
                  {...linkProps(surah)}
                  className={`flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]
                    ${isLast ? "border-l-2 border-l-[var(--color-accent)]" : ""}
                    ${isHighlighted ? "bg-[var(--color-accent)]/5" : ""}`}
                >
                  {/* Numara */}
                  <span className="w-8 h-8 rounded-md border border-[var(--color-border)] flex items-center justify-center text-xs font-medium tabular-nums text-[var(--color-text-secondary)] shrink-0">
                    {displayNumber(surah)}
                  </span>

                  {/* Sure adi + meta */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {surah.nameSimple}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {getSurahMeaning(surah.id, locale)}
                      <span className="opacity-50"> · </span>
                      {surah.ayahCount} {t.surahList.verses}
                    </span>
                  </div>

                  {/* Arapca isim + nuzul cami gorseli */}
                  <span
                    className="relative shrink-0 flex items-center justify-center overflow-hidden rounded h-14 pl-2"
                    dir="rtl"
                  >
                    <img
                      src={MOSQUE_SRC[surah.revelation] || MOSQUE_SRC.makkah}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute top-0 h-full w-auto object-contain opacity-[0.12]"
                      style={{ right: surah.revelation === "makkah" ? "-8%" : "-11%" }}
                    />
                    <span
                      className="relative text-lg text-[var(--color-text-primary)] font-normal whitespace-nowrap"
                      style={{ fontFamily: "'Readex Pro', var(--font-arabic)" }}
                    >
                      سُورَةُ {surah.nameArabic}
                    </span>
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid gorunumu */
        <div className="grid grid-cols-3 md:grid-cols-4 border-l border-t border-[var(--color-border)]">
          {filteredSurahs.map((surah) => {
            const isLast = surah.id === lastSurahId;
            const isHighlighted = highlightSurahId === surah.id;
            return (
              <div
                key={surah.id}
                ref={(el: HTMLDivElement | null) => {
                  if (el) itemRefs.current.set(surah.id, el);
                }}
              >
                <Link
                  {...linkProps(surah)}
                  className={`relative flex flex-col items-center gap-1 p-3 bg-[var(--color-bg)] transition-colors hover:bg-[var(--color-surface)] h-full overflow-hidden border-r border-b border-[var(--color-border)]
                    ${isLast ? "ring-1 ring-inset ring-[var(--color-accent)]" : ""}
                    ${isHighlighted ? "bg-[var(--color-accent)]/5" : ""}`}
                >
                  <img
                    src={MOSQUE_SRC[surah.revelation] || MOSQUE_SRC.makkah}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute h-full w-auto object-contain opacity-[0.07]"
                    style={{ right: surah.revelation === "makkah" ? "-15%" : "-18%" }}
                  />
                  <span className="relative text-xs tabular-nums text-[var(--color-text-secondary)]">
                    {displayNumber(surah)}
                  </span>
                  <span
                    className="relative text-base text-[var(--color-text-primary)] font-normal"
                    dir="rtl"
                    style={{ fontFamily: "'Readex Pro', var(--font-arabic)" }}
                  >
                    {surah.nameArabic}
                  </span>
                  <span className="relative text-[10px] font-medium text-[var(--color-text-primary)] truncate max-w-full">
                    {getSurahName(surah.id, locale)}
                  </span>
                  <span className="relative text-[10px] text-[var(--color-text-secondary)]">
                    {surah.ayahCount} {t.surahList.verses}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Cuz FAB */}
      <div ref={juzPanelRef} className="fixed right-4 bottom-20 z-20">
        {juzOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-[280px] max-h-[60vh] flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)] rounded">
            <div className="overflow-y-auto flex-1 py-1">
              {activeCollection ? (
                CURATED_COLLECTIONS[activeCollection].surahIds.map((surahId) => {
                  const surah = surahs.find((s) => s.id === surahId);
                  if (!surah) return null;
                  return (
                    <div key={surahId} className="flex items-center hover:bg-[var(--color-surface)] transition-colors">
                      <Link
                        to="/surah/$surahSlug"
                        params={{ surahSlug: surahSlug(surah.id) }}
                        search={{ ayah: undefined }}
                        onClick={() => setJuzOpen(false)}
                        className="flex items-center gap-2 flex-1 px-3 py-2 text-left"
                      >
                        <span className="w-5 text-[11px] font-semibold text-[var(--color-text-secondary)] text-right shrink-0">{surahId}</span>
                        <span className="text-xs truncate flex-1">{getSurahName(surahId, locale) || surah.nameSimple}</span>
                        <span className="text-xs shrink-0" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                          {surah.nameArabic}
                        </span>
                      </Link>
                    </div>
                  );
                })
              ) : (
                ALL_JUZ.map((juz) => {
                  const surahId = JUZ_FIRST_SURAH[juz];
                  const surah = surahId ? surahs.find((s) => s.id === surahId) : undefined;
                  const page = JUZ_FIRST_PAGE[juz];
                  return (
                    <div key={juz} className="flex items-center hover:bg-[var(--color-surface)] transition-colors">
                      <button
                        onClick={() => handleJuzSurah(juz)}
                        className="flex items-center gap-2 w-1/2 px-3 py-2 text-left"
                      >
                        <span className="w-5 text-[11px] font-semibold text-[var(--color-text-secondary)] text-right shrink-0">{juz}</span>
                        <span className="text-xs truncate">{getSurahName(surahId!, locale) || surah?.nameSimple || ""}</span>
                      </button>
                      <Link
                        to="/page/$pageNumber"
                        params={{ pageNumber: String(page) }}
                        search={{ ayah: undefined }}
                        onClick={() => setJuzOpen(false)}
                        className="flex items-center justify-end w-1/2 px-3 py-2 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {t.common.page} {page}
                      </Link>
                    </div>
                  );
                })
              )}
            </div>

            {/* Koleksiyon chip'leri */}
            <div className="grid grid-cols-2 gap-1.5 px-2.5 py-2 border-t border-[var(--color-border)] shrink-0">
              {(
                [
                  { key: "prayer" as CollectionKey, label: t.surahList.curatedPrayer },
                  { key: "popular" as CollectionKey, label: t.surahList.curatedPopular },
                  { key: "amma" as CollectionKey, label: t.surahList.curatedAmma },
                  { key: "tabaraka" as CollectionKey, label: t.surahList.curatedTabaraka },
                ] as const
              ).map(({ key, label }) => {
                const isSelected = activeCollection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCollection(isSelected ? null : key)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded text-[11px] font-medium transition-colors ${
                      isSelected
                        ? "bg-[var(--color-accent)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6L5 8.5L9.5 3.5" />
                      </svg>
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuz butonu */}
        <button
          onClick={() => { setJuzOpen(!juzOpen); if (juzOpen) setActiveCollection(null); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${
            juzOpen ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-accent)]/80 text-white hover:bg-[var(--color-accent)]"
          }`}
          aria-label={t.surahList.goToJuz}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6C4 6 6 5 12 8C18 5 20 6 20 6L20 18C20 18 18 17 12 20C6 17 4 18 4 18Z" />
            <path d="M12 8L12 20" />
          </svg>
        </button>
      </div>
    </div>
  );
}
