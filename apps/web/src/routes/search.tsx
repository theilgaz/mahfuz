/**
 * Arama route'u — /ara
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchQuran, type SearchResult } from "~/lib/search-service";
import { useSettingsStore } from "~/stores/settings.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsButton } from "~/components/SettingsButton";
import { surahSlug } from "~/lib/surah-slugs";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const translationSlug = translationSlugs[0];
  const readingMode = useSettingsStore((s) => s.readingMode);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedQuery(value), 400);
    },
    [],
  );

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, translationSlug],
    queryFn: () =>
      searchQuran({ data: { query: debouncedQuery, translationSlug } }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Arama kutusu */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        >
          <circle cx="8" cy="8" r="5.5" />
          <path d="M12.5 12.5L16 16" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={t.search.placeholder}
          autoFocus
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </div>

      {/* Öneriler — arama boşken */}
      {!query && <SearchSuggestions onSelect={handleInput} locale={locale} t={t} />}

      {/* Sonuçlar */}
      <div aria-live="polite" aria-atomic="true">
        {isLoading && debouncedQuery.length >= 2 && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
            {t.common.searching}
          </p>
        )}

        {results && results.length === 0 && debouncedQuery.length >= 2 && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
            {t.common.noResults}
          </p>
        )}
      </div>

      {results && results.length > 0 && (
        <GroupedResults results={results} readingMode={readingMode} locale={locale} t={t} navigate={navigate} />
      )}
    </div>
  );
}

// ── Gruplandırılmış sonuçlar ─────────────────────────────

const GROUP_LABELS: Record<string, { tr: string; en: string }> = {
  surah: { tr: "Sureler", en: "Surahs" },
  translation: { tr: "Meal Sonuçları", en: "Translation Results" },
  arabic: { tr: "Arapça Metin", en: "Arabic Text" },
};

function GroupedResults({ results, readingMode, locale, t, navigate }: {
  results: SearchResult[];
  readingMode: string;
  locale: string;
  t: any;
  navigate: any;
}) {
  const groups = useMemo(() => {
    const map: Record<string, SearchResult[]> = {};
    for (const r of results) {
      const type = r.matchType ?? "translation";
      (map[type] ??= []).push(r);
    }
    // Sıralama: surah → translation → arabic
    const order = ["surah", "translation", "arabic"];
    return order.filter((k) => map[k]?.length).map((k) => ({ type: k, items: map[k] }));
  }, [results]);

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--color-text-secondary)]">
        {results.length} {t.common.results}
      </p>
      {groups.map((group) => (
        <div key={group.type}>
          <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2">
            {GROUP_LABELS[group.type]?.[locale as "tr" | "en"] ?? GROUP_LABELS[group.type]?.tr ?? group.type}
          </h3>
          <div className="space-y-2">
            {group.items.map((r) => (
              <ResultCard key={`${r.surahId}:${r.ayahNumber}`} r={r} readingMode={readingMode} locale={locale} t={t} navigate={navigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ r, readingMode, locale, t, navigate }: {
  r: SearchResult; readingMode: string; locale: string; t: any; navigate: any;
}) {
  return (
    <button
      onClick={() => {
        if (readingMode === "list") {
          navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(r.surahId) }, search: { ayah: r.ayahNumber } });
        } else {
          navigate({ to: "/page/$pageNumber", params: { pageNumber: String(r.pageNumber) }, search: { ayah: `${r.surahId}:${r.ayahNumber}` } });
        }
      }}
      className="block w-full text-left p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
    >
      <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-text-secondary)]">
        <span>{r.surahNameSimple}</span>
        <span>&middot;</span>
        <span>{t.common.verse} {r.ayahNumber}</span>
        <span>&middot;</span>
        <span>{t.common.page} {r.pageNumber}</span>
      </div>
      <p className="text-base leading-[2.2] mb-1.5" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
        {r.textUthmani}
      </p>
      {r.translation && (
        <p className="text-sm text-[var(--color-text-translation)] leading-relaxed line-clamp-2">
          {r.translation}
        </p>
      )}
    </button>
  );
}

// ── Popüler sureler ve sık aranan kelimeler ──────────────

const POPULAR_SURAHS = [
  { id: 1, nameAr: "الفاتحة" },
  { id: 36, nameAr: "يس" },
  { id: 67, nameAr: "الملك" },
  { id: 55, nameAr: "الرحمن" },
  { id: 56, nameAr: "الواقعة" },
  { id: 18, nameAr: "الكهف" },
  { id: 112, nameAr: "الإخلاص" },
  { id: 2, nameAr: "البقرة" },
  { id: 48, nameAr: "الفتح" },
  { id: 78, nameAr: "النبأ" },
];

const SUGGESTED_KEYWORDS: Record<string, string[]> = {
  tr: ["rahmet", "sabır", "namaz", "tövbe", "cennet", "şükür", "adalet", "ihsan", "tevekkül", "hidayet"],
  en: ["mercy", "patience", "prayer", "repentance", "paradise", "grateful", "justice", "faith", "guidance", "forgiveness"],
};

function SearchSuggestions({ onSelect, locale, t }: { onSelect: (q: string) => void; locale: string; t: any }) {
  const keywords = SUGGESTED_KEYWORDS[locale] ?? SUGGESTED_KEYWORDS.tr;

  return (
    <div className="space-y-5">
      {/* Popüler sureler */}
      <div>
        <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2">
          {t.search.popularSurahs}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SURAHS.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(getSurahName(s.id, locale) || s.nameAr)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs transition-colors"
            >
              <span dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: "0.8rem" }}>{s.nameAr}</span>
              <span className="text-[var(--color-text-secondary)]">{getSurahName(s.id, locale)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Anahtar kelimeler */}
      <div>
        <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2">
          {t.search.suggestedKeywords}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <button
              key={kw}
              onClick={() => onSelect(kw)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
