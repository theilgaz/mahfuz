/**
 * Sure görünümü (liste modu) — tüm ayetleri sırayla gösterir.
 * Üst bardan sure picker ile başka surelere geçilebilir.
 */

import { useSettingsStore } from "~/stores/settings.store";
import { useReadingStore } from "~/stores/reading.store";
import { useSurahData, useTajweed, useImlaei, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import { useQuery } from "@tanstack/react-query";
import { useWbwData } from "~/hooks/useWbwData";
import { cleanImlaei } from "~/lib/strip-diacritics";
import { AyahBlock } from "./AyahBlock";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useRef, useCallback, useMemo } from "react";

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
      {/* Besmele (sure adı artık header'da) */}
      {surah.bismillahPre && (
        <p
          className="pt-6 pb-4 text-center text-[var(--color-text-primary)]"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}
        >
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

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
              translations={ayah.translations}
              translationNames={translationNames}
              showTranslation={showTranslation && !showWbw}
              showTajweed={showTajweed}
              pageNumber={ayah.pageNumber}
              highlight={highlightAyah === ayah.ayahNumber}
              wbwWords={showWbw ? wbwData?.get(`${surahId}:${ayah.ayahNumber}`) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
