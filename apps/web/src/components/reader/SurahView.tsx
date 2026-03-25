/**
 * Sure görünümü (liste modu) — tüm ayetleri sırayla gösterir.
 * Üst bardan sure picker ile başka surelere geçilebilir.
 */

import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useSurahData, useSurahs, useTajweed, useImlaei } from "~/hooks/useQuranQuery";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { AyahBlock } from "./AyahBlock";
import { SurahHeader } from "./SurahHeader";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";

const TOTAL_CHAPTERS = 114;

interface SurahViewProps {
  surahId: number;
  highlightAyah?: number;
}

export function SurahView({ surahId, highlightAyah }: SurahViewProps) {
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajweed = useSettingsStore((s) => s.showTajweed);
  const translationSlug = useSettingsStore((s) => s.translationSlug);
  const textStyle = useSettingsStore((s) => s.textStyle);
  const useBasic = textStyle === "basic";
  const effectiveTajweed = showTajweed && !useBasic;
  const savePosition = useReadingStore((s) => s.savePosition);
  const { data } = useSurahData(surahId, translationSlug);
  const { data: tajweedData } = useTajweed(surahId, effectiveTajweed);
  const { data: imlaeiData } = useImlaei(surahId, useBasic);

  const firstPage = data?.ayahs[0]?.pageNumber ?? 0;
  useReadingTracker(firstPage);

  // Scroll'da görünen ayeti takip et
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const setAyahRef = useCallback((ayahNumber: number, el: HTMLDivElement | null) => {
    if (el) ayahRefs.current.set(ayahNumber, el);
    else ayahRefs.current.delete(ayahNumber);
  }, []);

  useEffect(() => {
    if (!data) return;

    // Sayfa ilk açıldığında ilk ayeti kaydet
    savePosition({
      surahId,
      ayahNumber: 1,
      pageNumber: data.ayahs[0]?.pageNumber ?? 1,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        // Ekranın üst yarısında görünen en küçük ayet numarası
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number(e.target.getAttribute("data-ayah")))
          .filter((n) => !isNaN(n));

        if (visible.length === 0) return;
        const topAyah = Math.min(...visible);
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

    // Observer'a tüm ayet elementlerini ekle
    for (const el of ayahRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [surahId, data, savePosition]);

  // highlightAyah varsa o ayete scroll et
  useEffect(() => {
    if (!highlightAyah || !data) return;
    // DOM'un render olması için kısa gecikme
    const timer = setTimeout(() => {
      const el = ayahRefs.current.get(highlightAyah);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [highlightAyah, data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[var(--color-text-secondary)]">
        Sure bulunamadı
      </div>
    );
  }

  const { surah, ayahs } = data;

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Navigasyon — ok + sure picker */}
      <div className="flex items-center justify-between px-4 py-2">
        {surahId > 1 ? (
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: surahSlug(surahId - 1) }} search={{ ayah: undefined }}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5L7 10L12 15" />
            </svg>
          </Link>
        ) : <div className="w-9" />}

        <SurahPicker currentSurahId={surahId} />

        {surahId < TOTAL_CHAPTERS ? (
          <Link
            to="/surah/$surahSlug"
            params={{ surahSlug: surahSlug(surahId + 1) }} search={{ ayah: undefined }}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 5L13 10L8 15" />
            </svg>
          </Link>
        ) : <div className="w-9" />}
      </div>

      <SurahHeader
        surahId={surah.id}
        nameArabic={surah.nameArabic}
        nameSimple={surah.nameSimple}
        showBismillah={surah.bismillahPre}
      />

      <div className="pb-8">
        {ayahs.map((ayah) => (
          <div
            key={ayah.ayahNumber}
            ref={(el) => setAyahRef(ayah.ayahNumber, el)}
            data-ayah={ayah.ayahNumber}
          >
            <AyahBlock
              surahId={surahId}
              ayahNumber={ayah.ayahNumber}
              textUthmani={useBasic ? cleanImlaei(imlaeiData?.[`${surahId}:${ayah.ayahNumber}`] ?? ayah.textUthmani) : ayah.textUthmani}
              textTajweed={effectiveTajweed ? tajweedData?.[`${surahId}:${ayah.ayahNumber}`] : undefined}
              translation={ayah.translation}
              showTranslation={showTranslation}
              showTajweed={showTajweed}
              pageNumber={ayah.pageNumber}
              highlight={highlightAyah === ayah.ayahNumber}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sure Picker ─────────────────────────────────────────

function SurahPicker({ currentSurahId }: { currentSurahId: number }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();
  const { data: surahs } = useSurahs();

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Açılınca inputa fokus + aktif sureye scroll
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => {
        inputRef.current?.focus();
        activeRef.current?.scrollIntoView({ block: "center" });
      }, 50);
    }
  }, [open]);

  const filtered = surahs.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.nameSimple.toLowerCase().includes(q) ||
      s.nameTranslation.toLowerCase().includes(q) ||
      String(s.id) === q
    );
  });

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-colors"
      >
        <span className="text-sm text-[var(--color-text-secondary)]">
          {currentSurahId} / {TOTAL_CHAPTERS}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d={open ? "M3 7L6 4L9 7" : "M3 5L6 8L9 5"} />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 max-h-[60vh] rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Arama */}
          <div className="p-2 border-b border-[var(--color-border)]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sure ara..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1">
            {filtered.map((surah) => {
              const isActive = surah.id === currentSurahId;
              return (
                <Link
                  key={surah.id}
                  ref={isActive ? activeRef : undefined}
                  to="/surah/$surahSlug"
                  params={{ surahSlug: surahSlug(surah.id) }} search={{ ayah: undefined }}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] shrink-0">
                    {surah.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{surah.nameSimple}</span>
                      <span className="text-sm shrink-0" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                        {surah.nameArabic}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {surah.ayahCount} ayet
                    </span>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-[var(--color-text-secondary)] py-6">
                Sonuç bulunamadı
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
