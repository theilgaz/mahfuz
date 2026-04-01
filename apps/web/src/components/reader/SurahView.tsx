/**
 * Sure görünümü (liste modu) — tüm ayetleri sırayla gösterir.
 * Üst bardan sure picker ile başka surelere geçilebilir.
 */

import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useSurahData, useTajweed, useImlaei, translationSourcesQueryOptions, useSurahs } from "~/hooks/useQuranQuery";
import { useQuery } from "@tanstack/react-query";
import { useWbwData } from "~/hooks/useWbwData";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AyahBlock } from "./AyahBlock";
import { SurahSkeleton } from "./SurahSkeleton";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";

interface SurahViewProps {
  surahId: number;
  highlightAyah?: number;
}

export function SurahView({ surahId, highlightAyah }: SurahViewProps) {
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showWbw = useSettingsStore((s) => s.showWbw);
  const showTajweed = useSettingsStore((s) => s.showTajweed);
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const textStyle = useSettingsStore((s) => s.textStyle);
  const useBasic = textStyle === "basic";
  const effectiveTajweed = showTajweed && !useBasic && !showWbw;
  const savePosition = useReadingStore((s) => s.savePosition);
  const { data } = useSurahData(surahId, translationSlugs);
  const { data: tajweedData } = useTajweed(surahId, effectiveTajweed);
  const { data: imlaeiData } = useImlaei(surahId, useBasic);
  const { data: wbwData } = useWbwData(surahId, showWbw);

  // Çoklu meal adları
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

  // highlightAyah varsa o ayete scroll et (double-rAF ensures paint is complete)
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

  if (!data) {
    return <SurahSkeleton />;
  }

  const { surah, ayahs: ayahList } = data;
  const useVirtual = ayahList.length >= 100;

  const renderAyah = useCallback(
    (ayah: (typeof ayahList)[number]) => (
      <AyahBlock
        surahId={surahId}
        ayahNumber={ayah.ayahNumber}
        textUthmani={useBasic ? cleanImlaei(imlaeiData?.[`${surahId}:${ayah.ayahNumber}`] ?? ayah.textUthmani) : ayah.textUthmani}
        textTajweed={effectiveTajweed ? tajweedData?.[`${surahId}:${ayah.ayahNumber}`] : undefined}
        translation={ayah.translation}
        translations={ayah.translations}
        translationNames={translationNames}
        showTranslation={showTranslation && !showWbw}
        showTajweed={showTajweed}
        pageNumber={ayah.pageNumber}
        highlight={highlightAyah === ayah.ayahNumber}
        wbwWords={showWbw ? wbwData?.get(`${surahId}:${ayah.ayahNumber}`) : undefined}
        sajdah={!!ayah.sajdah}
      />
    ),
    [surahId, useBasic, imlaeiData, effectiveTajweed, tajweedData, translationNames, showTranslation, showWbw, showTajweed, highlightAyah, wbwData],
  );

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Besmele */}
      {surah.bismillahPre && (
        <p
          className="pt-6 pb-4 text-center text-[var(--color-text-primary)]"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}
        >
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {useVirtual ? (
        <VirtualAyahList
          ayahs={ayahList}
          renderAyah={renderAyah}
          setAyahRef={setAyahRef}
          highlightAyah={highlightAyah}
        />
      ) : (
        <div className="pb-8">
          {ayahList.map((ayah) => (
            <div
              key={ayah.ayahNumber}
              ref={(el) => setAyahRef(ayah.ayahNumber, el)}
              data-ayah={ayah.ayahNumber}
            >
              {renderAyah(ayah)}
            </div>
          ))}
        </div>
      )}

      {surahId < 114 && <NextSurahCard currentSurahId={surahId} />}
    </div>
  );
}

// ── Sonraki Sure Kartı ───────────────────────────────────

function NextSurahCard({ currentSurahId }: { currentSurahId: number }) {
  const navigate = useNavigate();
  const { locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const nextSurahId = currentSurahId + 1;
  const nextSurah = surahs.find((s) => s.id === nextSurahId);
  if (!nextSurah) return null;

  const name = getSurahName(nextSurahId, locale) || nextSurah.nameSimple;

  return (
    <div className="mt-8 mb-4">
      <div className="h-px bg-[var(--color-border)] mb-6" />
      <button
        onClick={() =>
          navigate({
            to: "/surah/$surahSlug",
            params: { surahSlug: surahSlug(nextSurahId) },
            search: { ayah: undefined },
          })
        }
        className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] active:bg-[var(--color-accent)]/10 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs text-[var(--color-text-secondary)] mb-0.5">Sonraki Sure</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{nextSurahId}. {name}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">{nextSurah.ayahCount} ayet</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            dir="rtl"
            className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors"
            style={{ fontFamily: "var(--font-arabic)", fontSize: "28px", lineHeight: "normal" }}
          >
            {nextSurah.nameArabic}
          </span>
          <svg
            width="18" height="18" viewBox="0 0 18 18" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors"
          >
            <path d="M6 4l5 5-5 5" />
          </svg>
        </div>
      </button>
    </div>
  );
}

// ── Virtual scrolling for long surahs (100+ ayahs) ──────

const VIRTUAL_OVERSCAN = 5;
const ESTIMATED_AYAH_HEIGHT = 180;

interface VirtualAyahListProps {
  ayahs: Array<{ ayahNumber: number; [key: string]: unknown }>;
  renderAyah: (ayah: VirtualAyahListProps["ayahs"][number]) => ReactNode;
  setAyahRef: (ayahNumber: number, el: HTMLDivElement | null) => void;
  highlightAyah?: number;
}

function VirtualAyahList({ ayahs, renderAyah, setAyahRef, highlightAyah }: VirtualAyahListProps) {
  const virtualizer = useVirtualizer({
    count: ayahs.length,
    getScrollElement: () => document.documentElement,
    estimateSize: () => ESTIMATED_AYAH_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
  });

  // Scroll to highlighted ayah
  useEffect(() => {
    if (!highlightAyah) return;
    const idx = ayahs.findIndex((a) => a.ayahNumber === highlightAyah);
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" });
    }
  }, [highlightAyah, ayahs, virtualizer]);

  return (
    <div className="pb-8 relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const ayah = ayahs[virtualRow.index];
        return (
          <div
            key={ayah.ayahNumber}
            ref={(el) => {
              virtualizer.measureElement(el);
              setAyahRef(ayah.ayahNumber, el);
            }}
            data-index={virtualRow.index}
            data-ayah={ayah.ayahNumber}
            className="absolute left-0 right-0"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {renderAyah(ayah)}
          </div>
        );
      })}
    </div>
  );
}
