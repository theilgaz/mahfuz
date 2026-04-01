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
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";

const ALL_JUZ = Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1);


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
      <div className="space-y-0.5">
        {filteredSurahs.map((surah) => (
          <Link
            key={surah.id}
            ref={(el: HTMLAnchorElement | null) => {
              if (el) itemRefs.current.set(surah.id, el);
            }}
            to={readingMode === "page" ? "/page/$pageNumber" : "/surah/$surahSlug"}
            params={readingMode === "page" ? { pageNumber: String(surah.pageStart) } : { surahSlug: surahSlug(surah.id) }}
            search={{ ayah: undefined }}
            preload="intent"
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)] transition-colors overflow-hidden ${
              highlightSurahId === surah.id ? "bg-[var(--color-accent)]/10 ring-2 ring-[var(--color-accent)]/30" : ""
            }`}
          >
            {/* Cami görseli */}
            <div className="relative shrink-0 w-12 h-12">
              <img
                src={surah.revelation === "makkah" ? "/images/kaaba.png" : "/images/nabawi.png"}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                className="w-full h-full object-contain transition-opacity duration-300 opacity-15 group-hover:opacity-90 group-active:opacity-90"
              />
              {surah.id === lastSurahId && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg)]" />
              )}
            </div>

            {/* İsim + meta */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <span className="text-sm font-medium truncate">
                <span className="mr-1.5">{surahListFilter === "nuzul" ? surah.revelationOrder : surah.id}.</span>{surah.nameSimple}</span>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="truncate">{getSurahName(surah.id, locale)}</span>
                <span className="shrink-0">&middot;</span>
                <span className="shrink-0">{surah.ayahCount} {t.surahList.verses}</span>
              </div>
            </div>

            {/* Arapça sure ismi */}
            <span className="shrink-0 self-center" dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: "34px", lineHeight: "normal" }}>
              {surah.nameArabic}
            </span>
          </Link>
        ))}
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
