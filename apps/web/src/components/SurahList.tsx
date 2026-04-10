/**
 * Sure listesi + yüzen cüz butonu.
 *
 * Sağ kenarda küçük bir "جز" butonu sabit durur.
 * Butona basınca panel açılır, cüz seçince ilgili sureye scroll eder.
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { JUZ_FIRST_SURAH, JUZ_FIRST_PAGE, TOTAL_JUZ } from "@mahfuz/shared";
import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { SURAH_MEANINGS_TR } from "~/lib/surah-names-tr";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";

const ALL_JUZ = Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1);

// 12-bump scalloped badge path (100×100 viewBox, center 50,50)
// Peaks at outerR=46, valleys at innerR=36 — quadratic bezier for smooth bumps
const CARD_CLIP = "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)";

const BADGE_PATH =
  "M59.3,15.2 Q73,10.2 75.5,24.5 Q89.8,27 84.8,40.7 Q96,50 84.8,59.3 Q89.8,73 75.5,75.5 Q73,89.8 59.3,84.8 Q50,96 40.7,84.8 Q27,89.8 24.5,75.5 Q10.2,73 15.2,59.3 Q4,50 15.2,40.7 Q10.2,27 24.5,24.5 Q27,10.2 40.7,15.2 Q50,4 59.3,15.2Z";


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
  const readingMode = useSettingsStore((s) => s.readingMode);
  const surahListFilter = useSettingsStore((s) => s.surahListFilter);
  const setSurahListFilter = useSettingsStore((s) => s.setSurahListFilter);
  const lastSurahId = useReadingStore((s) => s.lastPosition?.surahId ?? null);
  const { t, locale } = useTranslation();
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Filter + sort
  const filteredSurahs = useMemo(() => {
    if (surahListFilter === "nuzul") {
      return [...surahs].sort((a, b) => a.revelationOrder - b.revelationOrder);
    }
    if (surahListFilter === "all") return surahs;
    return surahs.filter((s) => s.revelation === surahListFilter);
  }, [surahs, surahListFilter]);

  // Cüz picker state
  // İlk açılışta son okunan sureye scroll et
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
  const juzPanelRef = useRef<HTMLDivElement>(null);

  // Cüzün suresine scroll + highlight
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

  // Dışarı tıklayınca kapat
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

  const filterChips: Array<{ key: typeof surahListFilter; label: string }> = [
    { key: "all", label: t.surahList.filterAll },
    { key: "makkah", label: t.surahList.filterMakki },
    { key: "madinah", label: t.surahList.filterMadani },
    { key: "nuzul", label: t.surahList.filterNuzul },
  ];

  return (
    <div className="relative">
      {/* Filtre chip'leri */}
      <div className="flex items-center gap-2 mb-3">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setSurahListFilter(chip.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              surahListFilter === chip.key
                ? "bg-[var(--color-accent)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Sure listesi */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {filteredSurahs.map((surah) => {
          const isLast = surah.id === lastSurahId;
          const isHighlighted = highlightSurahId === surah.id;
          return (
            <div
              key={surah.id}
              ref={(el: HTMLDivElement | null) => {
                if (el) itemRefs.current.set(surah.id, el);
              }}
              className={`group p-[1.5px] transition-all shadow-sm
                ${isLast
                  ? "bg-[var(--color-accent)]/20"
                  : isHighlighted
                    ? "bg-[var(--color-accent)]/20"
                    : "bg-[var(--color-border)] hover:bg-[var(--color-accent)]/30 hover:shadow-md"
                }`}
              style={{ clipPath: CARD_CLIP }}
            >
            <Link
              to={readingMode === "mushaf" ? "/page/$pageNumber" : "/surah/$surahSlug"}
              params={readingMode === "mushaf" ? { pageNumber: String(surah.pageStart) } : { surahSlug: surahSlug(surah.id) }}
              search={{ ayah: undefined }}
              preload="intent"
              className={`relative flex flex-col items-center gap-2 px-3 pt-4 pb-3 md:gap-3 md:px-4 md:pt-5 md:pb-3 transition-all overflow-hidden w-full h-full
                ${isLast
                  ? "bg-[var(--color-accent)]/8"
                  : isHighlighted
                    ? "bg-[var(--color-accent)]/10"
                    : "bg-[var(--color-surface)] active:scale-[0.99]"
                }`}
              style={{ clipPath: CARD_CLIP }}
            >
              {/* Scalloped badge */}
              <div
                className={`relative shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-colors duration-200
                  ${isLast || isHighlighted
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-border)] group-hover:text-[var(--color-accent)]/70"
                  }`}
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <defs>
                    <clipPath id={`clip-${surah.id}`}>
                      <path d={BADGE_PATH} />
                    </clipPath>
                    <linearGradient id={`bg-${surah.id}`} x1="25%" y1="15%" x2="75%" y2="85%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
                    </linearGradient>
                    {isLast && (
                      <filter id={`outline-${surah.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="expanded" />
                        <feFlood floodColor="rgba(255,255,255,0.9)" result="color" />
                        <feComposite in="color" in2="expanded" operator="in" result="outline" />
                        <feMerge>
                          <feMergeNode in="outline" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    )}
                  </defs>
                  <path d={BADGE_PATH} fill="currentColor" />
                  <image
                    href={surah.revelation === "makkah" ? "/images/kaaba.png" : "/images/nabawi.png"}
                    x={surah.revelation === "makkah" ? "18" : "14"} y={surah.revelation === "makkah" ? "34" : "22"} width={surah.revelation === "makkah" ? "64" : "72"} height={surah.revelation === "makkah" ? "64" : "72"}
                    clipPath={`url(#clip-${surah.id})`}
                    opacity="0.7"
                    preserveAspectRatio="xMidYMid meet"
                    filter={isLast ? `url(#outline-${surah.id})` : undefined}
                  />
                  <path d={BADGE_PATH} fill={`url(#bg-${surah.id})`} />
                  <path d={BADGE_PATH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="4" />
                </svg>
                <span className="relative z-10 text-[11px] font-black tabular-nums leading-none text-white drop-shadow-sm">
                  {String(surahListFilter === "nuzul" ? surah.revelationOrder : surah.id).padStart(2, "0")}
                </span>
              </div>

              {/* Sure ismi */}
              <span className="text-sm font-semibold truncate md:text-base text-[var(--color-text-primary)]">
                {getSurahName(surah.id, locale)}
              </span>

              {/* Accent cizgi + altinda meta ve Arapca label */}
              <div className="mt-auto relative w-full flex flex-col">
                <div className="border-t-2 border-[var(--color-accent)]" style={{ marginLeft: "-12px", marginRight: "-12px" }} />
                <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center justify-center gap-1 md:justify-start md:flex-col md:items-start md:gap-0.5 pt-1.5 md:pt-2 min-w-0">
                    <span className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] truncate">{locale === "tr" ? SURAH_MEANINGS_TR[surah.id] : surah.nameSimple}</span>
                    <span className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] shrink-0 md:hidden opacity-50">&middot;</span>
                    <span className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] shrink-0">{surah.ayahCount} {t.surahList.verses}</span>
                  </div>
                  <span
                    className="flex items-center justify-center bg-[var(--color-accent)] text-white py-1 md:py-1.5 leading-none w-full md:w-28 md:mr-2.5 shrink-0"
                    dir="rtl"
                    style={{
                      fontFamily: "'Readex Pro', var(--font-arabic)",
                      fontSize: "14px",
                      fontWeight: 700,
                      clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
                    }}
                  >
                    {surah.nameArabic}
                  </span>
                </div>
              </div>

            </Link>
            </div>
          );
        })}
      </div>

      {/* Yüzen cüz butonu — sağ alt köşe (FAB) */}
      <div ref={juzPanelRef} className="fixed right-4 bottom-20 z-20">
        {/* Genişleyen cüz paneli — butonun üstünde */}
        {juzOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-[260px] max-h-[60vh] overflow-y-auto rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-1">
            {ALL_JUZ.map((juz) => {
              const surahId = JUZ_FIRST_SURAH[juz];
              const surah = surahId ? surahs.find((s) => s.id === surahId) : undefined;
              const page = JUZ_FIRST_PAGE[juz];
              return (
                <div key={juz} className="flex items-center hover:bg-[var(--color-bg)] transition-colors">
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
                    onClick={() => setJuzOpen(false)}
                    className="flex items-center justify-end w-1/2 px-3 py-2 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {t.common.page} {page}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Ana buton */}
        <button
          onClick={() => setJuzOpen(!juzOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shadow-lg transition-all ${
            juzOpen
              ? "bg-[var(--color-accent)] text-white scale-110"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:shadow-xl"
          }`}
          aria-label={t.surahList.goToJuz}
        >
          جز
        </button>
      </div>
    </div>
  );
}
