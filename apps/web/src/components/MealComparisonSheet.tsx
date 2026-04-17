/**
 * Meal Karşılaştırma — bir ayet için birden fazla mealin yan yana gösterimi.
 * Kullanım: <MealComparisonSheet surahId={2} ayahNumber={255} onClose={() => {}} />
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getTranslationSources, getTranslationsForVerse } from "~/lib/quran-service";
import { getAcikKuranTranslations, ACIK_KURAN_AUTHORS } from "~/lib/analyse-service";
import { useTranslation } from "~/hooks/useTranslation";

// Desteklenen mealciler (slug → görünen ad)
const SUPPORTED_TRANSLATORS: Record<string, { name: string; author: string; lang: string; era?: string }> = {
  // Türkçe
  "diyanet": { name: "Diyanet İşleri", author: "Diyanet İşleri Başkanlığı", lang: "TR" },
  "elmali-yeni": { name: "Elmalılı Hamdi Yazır", author: "Elmalılı M. Hamdi Yazır", lang: "TR", era: "1935" },
  "ali-fikri-yavuz": { name: "Ali Fikri Yavuz", author: "Ali Fikri Yavuz", lang: "TR" },
  "muhammed-esed": { name: "Muhammed Esed", author: "Muhammed Esed", lang: "TR" },
  "omer-nasuhi-bilmen": { name: "Ömer Nasuhi Bilmen", author: "Ömer Nasuhi Bilmen", lang: "TR" },
  "omer-celik": { name: "Ömer Çelik", author: "Ömer Çelik", lang: "TR" },
  // İngilizce
  "sahih-international": { name: "Sahih International", author: "Saheeh International", lang: "EN" },
  "pickthall-en": { name: "Pickthall", author: "Mohammad M. Pickthall", lang: "EN", era: "1930" },
  "haleem-en": { name: "Abdel Haleem", author: "M.A.S. Abdel Haleem", lang: "EN" },
  "yusufali-en": { name: "Yusuf Ali", author: "Abdullah Yusuf Ali", lang: "EN" },
};

const PREFERRED_TRANSLATOR_ORDER = [
  "omer-celik",
  "muhammed-esed",
  "diyanet",
  "elmali-yeni",
  "pickthall-en",
  "sahih-international",
  "yusufali-en",
];

interface Props {
  surahId: number;
  ayahNumber: number;
  ayahText: string;
  onClose: () => void;
  /** Sheet yerine doğrudan inline içerik olarak render et */
  inline?: boolean;
}

function useAvailableTranslators() {
  return useQuery(
    queryOptions({
      queryKey: ["translation-sources"],
      queryFn: () => getTranslationSources(),
      staleTime: Infinity,
    })
  );
}

function useVerseTranslations(surahId: number, ayahNumber: number, slugs: string[]) {
  return useQuery(
    queryOptions({
      queryKey: ["translations", "multi", surahId, ayahNumber, slugs],
      queryFn: () => getTranslationsForVerse({ data: { surahId, ayahNumber, sourceSlugs: slugs } }),
      staleTime: Infinity,
      enabled: slugs.length > 0,
    })
  );
}

export function MealComparisonSheet({ surahId, ayahNumber, ayahText, onClose, inline = false }: Props) {
  const { t } = useTranslation();
  const { data: allSources } = useAvailableTranslators();

  // Available slugs that are both in DB and in our supported list, sorted by preferred order
  const availableSlugs = (allSources ?? [])
    .map((s) => s.slug)
    .filter((slug) => slug in SUPPORTED_TRANSLATORS)
    .sort((a, b) => {
      const ai = PREFERRED_TRANSLATOR_ORDER.indexOf(a);
      const bi = PREFERRED_TRANSLATOR_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    availableSlugs.slice(0, 3)
  );

  const [selectedAcikKuranIds, setSelectedAcikKuranIds] = useState<number[]>(
    ACIK_KURAN_AUTHORS.map((a) => a.id)
  );

  const { data: translations, isLoading } = useVerseTranslations(surahId, ayahNumber, selectedSlugs);

  const verseKey = `${surahId}:${ayahNumber}`;
  const { data: acikKuranData, isLoading: acikKuranLoading } = useQuery(
    queryOptions({
      queryKey: ["acik-kuran-translations", verseKey],
      queryFn: () => getAcikKuranTranslations({ data: verseKey }),
      staleTime: Infinity,
    })
  );

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 4
          ? [...prev, slug]
          : prev
    );
  }

  function toggleAcikKuranId(id: number) {
    setSelectedAcikKuranIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const filteredAcikKuran = (acikKuranData ?? []).filter((item) =>
    selectedAcikKuranIds.includes(item.authorId)
  );

  const content = (
    <div className={inline ? "space-y-4" : "overflow-y-auto flex-1 px-4 py-3 space-y-4"}>
          {/* Arapça metin */}
          <p
            className="text-right text-xl leading-loose text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border)]"
            style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
          >
            {ayahText}
          </p>

          {/* Mealci seçici (max 4) */}
          {availableSlugs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">{t.mealComparison.translatorsMax4}</p>
              <div className="flex flex-wrap gap-2">
                {availableSlugs.map((slug) => {
                  const info = SUPPORTED_TRANSLATORS[slug];
                  if (!info) return null;
                  const selected = selectedSlugs.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleSlug(slug)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                        selected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      <span className="text-[9px] font-bold mr-1 opacity-60">{info.lang}</span>
                      {info.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mealler */}
          {isLoading ? (
            <div className="space-y-3">
              {selectedSlugs.map((slug) => (
                <div key={slug} className="rounded border border-[var(--color-border)] p-3 animate-pulse">
                  <div className="h-3 w-24 rounded bg-[var(--color-border)] mb-2" />
                  <div className="h-4 w-full rounded bg-[var(--color-border)] mb-1" />
                  <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(translations ?? []).map((t) => {
                const info = SUPPORTED_TRANSLATORS[t.source?.slug ?? ""];
                return (
                  <div
                    key={t.sourceId}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {info?.lang ?? "TR"}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {info?.name ?? t.source?.name ?? "Meal"}
                      </span>
                      {info?.era && (
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{info.era}</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-translation)] leading-relaxed">
                      {t.text}
                    </p>
                  </div>
                );
              })}
              {(translations ?? []).length === 0 && selectedSlugs.length > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                  {t.mealComparison.notFoundInDb}
                </p>
              )}
            </div>
          )}

          {/* Farklı Yorumlar seçici */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">{t.mealComparison.alternativeViews}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/20">
                {t.mealComparison.alternative}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACIK_KURAN_AUTHORS.map((author) => {
                const selected = selectedAcikKuranIds.includes(author.id);
                return (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => toggleAcikKuranId(author.id)}
                    className={`relative pt-3 pb-1.5 px-3 rounded-lg border text-xs transition-colors ${
                      selected
                        ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span className="absolute top-0.5 right-1.5 text-[8px] font-bold opacity-60 leading-none">
                      {author.tag}
                    </span>
                    {author.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Farklı Yorumlar sonuçları */}
          {acikKuranLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded border border-[var(--color-border)] p-3 animate-pulse">
                  <div className="h-3 w-32 rounded bg-[var(--color-border)] mb-2" />
                  <div className="h-4 w-full rounded bg-[var(--color-border)] mb-1" />
                  <div className="h-4 w-2/3 rounded bg-[var(--color-border)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAcikKuran.map((ak) => (
                <div
                  key={ak.authorId}
                  className="rounded border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/5 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                      {ak.tag}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {ak.authorName}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      {ak.description}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {ak.text}
                  </p>
                  {ak.footnotes && ak.footnotes.length > 0 && (
                    <details className="mt-0.5">
                      <summary className="text-[10px] text-[var(--color-accent)] cursor-pointer select-none">
                        {ak.footnotes.length} {t.mealComparison.footnote}
                      </summary>
                      <div className="mt-1.5 space-y-1">
                        {ak.footnotes.map((fn) => (
                          <p key={fn.id} className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed pl-2 border-l border-[var(--color-border)]">
                            {fn.text}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
              {filteredAcikKuran.length === 0 && selectedAcikKuranIds.length > 0 && !acikKuranLoading && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-2">
                  {t.mealComparison.dataLoadFailed}
                </p>
              )}
            </div>
          )}

      <div className="h-4" />
    </div>
  );

  if (inline) return content;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center h-11 px-4 border-b border-[var(--color-border)] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-secondary)]"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4L7 10L13 16" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] ml-1">{t.mealComparison.title}</h2>
      </div>

      {content}
    </div>,
    document.body,
  );
}
