/**
 * Arama route'u — /ara
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchQuran } from "~/lib/search-service";
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
  const translationSlug = useSettingsStore((s) => s.translationSlug);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const navigate = useNavigate();
  const debounceRef = useState<ReturnType<typeof setTimeout>>(null!);

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef[0]) clearTimeout(debounceRef[0]);
      debounceRef[0] = setTimeout(() => setDebouncedQuery(value), 400);
    },
    [debounceRef],
  );

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, translationSlug],
    queryFn: () =>
      searchQuran({ data: { query: debouncedQuery, translationSlug } }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Başlık + geri */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">{t.search.title}</h1>
        <div className="flex-1" />
        <SettingsButton />
      </div>

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

      {/* Sonuçlar */}
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

      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)]">
            {results.length} {t.common.results}
          </p>

          {results.map((r) => (
            <button
              key={`${r.surahId}:${r.ayahNumber}`}
              onClick={() => {
                if (readingMode === "list") {
                  navigate({
                    to: "/surah/$surahSlug",
                    params: { surahSlug: surahSlug(r.surahId) },
                    search: { ayah: r.ayahNumber },
                  });
                } else {
                  navigate({
                    to: "/page/$pageNumber",
                    params: { pageNumber: String(r.pageNumber) },
                    search: { ayah: `${r.surahId}:${r.ayahNumber}` },
                  });
                }
              }}
              className="block w-full text-left p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              {/* Kaynak bilgisi */}
              <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-text-secondary)]">
                <span>{getSurahName(r.surahId, locale)}</span>
                <span>&middot;</span>
                <span>{t.common.verse} {r.ayahNumber}</span>
                <span>&middot;</span>
                <span>{t.common.page} {r.pageNumber}</span>
              </div>

              {/* Arapça metin */}
              <p
                className="text-base leading-[2.2] mb-1.5"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {r.textUthmani}
              </p>

              {/* Meal */}
              {r.translation && (
                <p className="text-sm text-[var(--color-text-translation)] leading-relaxed line-clamp-2">
                  {r.translation}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
