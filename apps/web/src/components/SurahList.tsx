/**
 * Sure listesi + yüzen cüz butonu.
 *
 * Sağ kenarda küçük bir "جز" butonu sabit durur.
 * Butona basınca panel açılır, cüz seçince ilgili sureye scroll eder.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";

// Cüz → ilk sure numarası (cüzün başladığı sure)
const JUZ_FIRST_SURAH: Record<number, number> = {
  1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
  11: 9, 12: 11, 13: 12, 14: 15, 15: 17, 16: 18, 17: 21, 18: 23,
  19: 25, 20: 27, 21: 29, 22: 33, 23: 36, 24: 39, 25: 41, 26: 46,
  27: 51, 28: 58, 29: 67, 30: 78,
};

const ALL_JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  revelation: string;
  ayahCount: number;
  pageStart: number;
}

interface SurahListProps {
  surahs: Surah[];
}

export function SurahList({ surahs }: SurahListProps) {
  const readingMode = useSettingsStore((s) => s.readingMode);
  const lastSurahId = useReadingStore((s) => s.lastPosition?.surahId ?? null);
  const { t, locale } = useTranslation();
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Cüz picker state
  const [juzOpen, setJuzOpen] = useState(false);
  const juzPanelRef = useRef<HTMLDivElement>(null);

  // Cüze scroll et
  const scrollToJuz = useCallback((juz: number) => {
    const surahId = JUZ_FIRST_SURAH[juz];
    if (!surahId) return;
    setJuzOpen(false);
    const el = itemRefs.current.get(surahId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

  return (
    <div className="relative">
      {/* Sure listesi */}
      <div className="space-y-0.5">
        {surahs.map((surah) => (
          <Link
            key={surah.id}
            ref={(el: HTMLAnchorElement | null) => {
              if (el) itemRefs.current.set(surah.id, el);
            }}
            to={readingMode === "page" ? "/page/$pageNumber" : "/surah/$surahSlug"}
            params={readingMode === "page" ? { pageNumber: String(surah.pageStart) } : { surahSlug: surahSlug(surah.id) }}
            search={{ ayah: undefined }}
            className="relative flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)] transition-colors overflow-hidden"
          >
            {/* Sure numarası + arka plan görseli */}
            <div className="relative w-12 h-12 shrink-0">
              <img
                src={surah.revelation === "makkah" ? "/images/kaaba.png" : "/images/nabawi.png"}
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-[0.18]"
              />
              <div className="absolute inset-0 flex items-center justify-center text-base text-[var(--color-text-secondary)] font-semibold">
                {surah.id}
                {surah.id === lastSurahId && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg)]" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{surah.nameSimple}</span>
                <span className="text-base shrink-0" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                  {surah.nameArabic}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="truncate">{getSurahName(surah.id, locale)}</span>
                <span className="shrink-0">&middot;</span>
                <span className="shrink-0">{surah.ayahCount} {t.surahList.verses}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Yüzen cüz butonu — sağ alt köşe (FAB) */}
      <div ref={juzPanelRef} className="fixed right-4 bottom-20 sm:bottom-6 z-20">
        {/* Genişleyen cüz paneli — butonun üstünde */}
        {juzOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-[180px] max-h-[60vh] overflow-y-auto rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-2">
            <p className="text-[10px] text-[var(--color-text-secondary)] px-1 pb-1.5 font-medium">{t.surahList.goToJuz}</p>
            <div className="grid grid-cols-5 gap-1">
              {ALL_JUZ.map((juz) => (
                <button
                  key={juz}
                  onClick={() => scrollToJuz(juz)}
                  className="h-8 rounded-lg text-xs font-medium hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                >
                  {juz}
                </button>
              ))}
            </div>
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
