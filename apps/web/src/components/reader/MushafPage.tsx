/**
 * Mushaf sayfasi -- mushaf goruntuleri + mealler.
 */

import { useReadingStore } from "~/stores/reading.store";
import { usePageData, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import { useSettingsStore } from "~/stores/settings.store";
import { useShallow } from "zustand/react/shallow";
import { MushafSkeleton } from "./MushafSkeleton";
import { useReadingTracker } from "~/hooks/useReadingTracker";
import { useEffect, useMemo } from "react";
import { useLocaleStore } from "~/stores/locale.store";
import { useQuery } from "@tanstack/react-query";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { getSurahDescription } from "~/lib/surah-descriptions";

interface MushafPageProps {
  pageNumber: number;
  highlightAyah?: string;
  /** Render only translations (image handled by route) */
  translationsOnly?: boolean;
}

export function MushafPage({ pageNumber, highlightAyah, translationsOnly }: MushafPageProps) {
  const savePosition = useReadingStore((s) => s.savePosition);
  const { translationSlugs, translationFontSize } = useSettingsStore(
    useShallow((s) => ({
      translationSlugs: s.translationSlugs,
      translationFontSize: s.translationFontSize,
    }))
  );
  const locale = useLocaleStore((s) => s.locale);
  const { data: pageData } = usePageData(pageNumber, translationSlugs);

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

  // Multi-translation names
  const { data: translationSourceList } = useQuery({ ...translationSourcesQueryOptions(), enabled: translationSlugs.length > 1 });
  const translationNames = useMemo(() => {
    const map: Record<string, string> = {};
    if (translationSourceList) {
      for (const s of translationSourceList) map[s.slug] = s.name;
    }
    return map;
  }, [translationSourceList]);

  if (!pageData) {
    return <MushafSkeleton />;
  }

  return (
    <div className="mx-auto px-1.5 sm:px-3 pb-16" style={{ maxWidth: "min(100%, 600px)" }}>
      {pageData.surahGroups.map((group) => (
        <MushafTranslations
          key={`tr-${group.surah.id}`}
          surah={group.surah}
          ayahs={group.ayahs}
          translationNames={translationNames}
          surahName={getSurahName(group.surah.id, locale) || group.surah.nameSimple}
          surahMeaning={getSurahMeaning(group.surah.id, locale)}
          surahDesc={getSurahDescription(group.surah.id, locale)}
          isStart={group.isStart}
          isMultiSurah={pageData.surahGroups.length > 1}
          translationFontSize={translationFontSize}
          translationSlugs={translationSlugs}
          locale={locale}
        />
      ))}
    </div>
  );
}

// -- Meal listesi --

function MushafTranslations({ surah, ayahs, translationNames, surahName, surahMeaning, surahDesc, isStart, isMultiSurah, translationFontSize, translationSlugs, locale }: {
  surah: { id: number; nameArabic: string; nameSimple: string; revelation: string; ayahCount: number; revelationOrder: number };
  ayahs: Array<{ surahId: number; ayahNumber: number; translations: Record<string, string> }>;
  translationNames: Record<string, string>;
  surahName: string;
  surahMeaning: string;
  surahDesc?: string;
  isStart: boolean;
  isMultiSurah: boolean;
  translationFontSize: number;
  translationSlugs: string[];
  locale: string;
}) {
  const multiMode = translationSlugs.length > 1;
  const withTranslation = ayahs.filter((a) => Object.keys(a.translations).length > 0);
  if (withTranslation.length === 0) return null;

  const typeLabel = surah.revelation === "makkah" ? "Mekki sure" : "Medeni sure";

  // Surah header when surah starts on this page
  const surahHeader = isStart && (
    <div className="text-center py-4 border-b border-[var(--color-border)] mb-3">
      <p className="text-[var(--color-text-secondary)] text-[10px] font-mono uppercase tracking-widest mb-1">
        {typeLabel} · {surah.ayahCount} ayet · Nuzul {surah.revelationOrder}
      </p>
      <p className="text-base font-semibold text-[var(--color-text-primary)]">
        {surahName}
      </p>
      {surahMeaning && (
        <p className="text-sm italic text-[var(--color-accent)]">{surahMeaning}</p>
      )}
      {surahDesc && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed max-w-[56ch] mx-auto">
          {surahDesc}
        </p>
      )}
    </div>
  );

  // Multi-surah separator (when surah doesn't start on this page)
  const surahLabel = !isStart && isMultiSurah && (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold text-[var(--color-accent)]">{surahName}</span>
      <span className="text-sm text-[var(--color-accent)] opacity-60" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
        {surah.nameArabic}
      </span>
    </div>
  );

  if (!multiMode) {
    const slug = translationSlugs[0];
    return (
      <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2">
        {surahHeader}
        {surahLabel}
        {withTranslation.map((ayah) => {
          const text = ayah.translations[slug];
          if (!text) return null;
          return (
            <p key={`${ayah.surahId}:${ayah.ayahNumber}`} className="text-[var(--color-text-translation)] leading-[1.7]" style={{ fontSize: `${translationFontSize}rem` }}>
              <span className="text-[var(--color-text-secondary)] text-xs mr-1 font-medium">{ayah.ayahNumber}.</span>
              {text}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-4">
      {surahHeader}
      {surahLabel}
      {translationSlugs.map((slug) => {
        const verses = withTranslation.map((a) => ({ ...a, text: a.translations[slug] })).filter((a) => a.text);
        if (verses.length === 0) return null;
        return (
          <div key={slug}>
            <p className="text-[0.7rem] font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide">
              {translationNames[slug] ?? slug}
            </p>
            <div className="space-y-1">
              {verses.map((ayah) => (
                <p key={`${ayah.surahId}:${ayah.ayahNumber}:${slug}`} className="text-[var(--color-text-translation)] leading-[1.7]" style={{ fontSize: `${translationFontSize}rem` }}>
                  <span className="text-[var(--color-text-secondary)] text-xs mr-1 font-medium">{ayah.ayahNumber}.</span>
                  {ayah.text}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
