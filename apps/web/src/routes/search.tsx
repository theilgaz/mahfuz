/**
 * Arama route'u — /search
 * Unified search: ayet/meal + app-ici sayfalar
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchQuran, type SearchResult } from "~/lib/search-service";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { SettingsButton } from "~/components/SettingsButton";
import { surahSlug } from "~/lib/surah-slugs";
import { LatinRootSearch } from "~/components/LatinRootSearch";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
});

// ── App-ici aranabilir sayfalar ──────────────────────────

interface AppPage {
  id: string;
  keywords: string[];
  route: string;
  iconColor: string;
  icon: ReactNode;
}

const APP_PAGES: AppPage[] = [
  {
    id: "alifba",
    keywords: ["elif", "harf", "arapca", "alfabe", "letter", "arabic"],
    route: "/alifba",
    iconColor: "bg-orange-600 text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
  },
  {
    id: "qaida",
    keywords: ["okuma", "kural", "reading", "qaida", "kaide"],
    route: "/alifba",
    iconColor: "bg-orange-600 text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
  },
  {
    id: "tajweed",
    keywords: ["tecvid", "kural", "ihfa", "idgam", "tajweed", "ihfaa", "iklap"],
    route: "/tajweed",
    iconColor: "bg-orange-600 text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /><path d="M12 8v4l3 3" /></svg>,
  },
  {
    id: "games",
    keywords: ["oyun", "quiz", "game", "kelime", "dizme", "sure", "bilmece", "yarismak"],
    route: "/games",
    iconColor: "bg-orange-600 text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M7 10v4M5 12h4" /><path d="M17 10h.01M19 12h.01" /></svg>,
  },
  {
    id: "hatim",
    keywords: ["hatim", "grup", "cuz", "okuma", "group"],
    route: "/khatm",
    iconColor: "bg-[var(--color-accent)] text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    id: "bookmarks",
    keywords: ["yer imi", "kayit", "bookmark", "isaret", "favori"],
    route: "/bookmarks",
    iconColor: "bg-[var(--color-accent)] text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    id: "notes",
    keywords: ["not", "yazi", "note", "notlarim"],
    route: "/notes",
    iconColor: "bg-[var(--color-accent)] text-white",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    id: "discover",
    keywords: ["keşfet", "kök", "latin", "discover", "araştır"],
    route: "/discover",
    iconColor: "bg-[var(--color-text-secondary)]/15 text-[var(--color-text-primary)]",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" /></svg>,
  },
  {
    id: "premium",
    keywords: ["premium", "mursid", "plan", "abone", "subscribe"],
    route: "/premium",
    iconColor: "bg-[var(--color-text-secondary)]/15 text-[var(--color-text-primary)]",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
];

function matchAppPages(q: string, pageLabels: Record<string, string>): AppPage[] {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  return APP_PAGES.filter(
    (p) => {
      const label = pageLabels[p.id];
      return (label && label.toLowerCase().includes(lower)) || p.keywords.some((kw) => kw.includes(lower));
    },
  );
}

// ── Main ────────────────────────────────────────────────

function SearchPage() {
  const { t, locale } = useTranslation();
  const { q: initialQuery } = Route.useSearch();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery ?? "");
  const translationSlugs = useSettingsStore((s) => s.translationSlugs);
  const translationSlug = translationSlugs[0];
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

  const sp = t.search.pages;
  const appResults = useMemo(() => matchAppPages(query, sp as unknown as Record<string, string>), [query, sp]);
  const hasAnyResults = (results && results.length > 0) || appResults.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Arama kutusu */}
      <div className="relative mb-8">
        <label htmlFor="search-quran" className="sr-only">{t.a11y?.searchQuran ?? t.search.placeholder}</label>
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="5.5" />
          <path d="M12.5 12.5L16 16" />
        </svg>
        <input
          id="search-quran"
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={t.search.placeholder}
          autoFocus
          className="w-full pl-11 pr-4 py-3.5 rounded bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition-all"
        />
      </div>

      {/* Oneriler - arama bosken */}
      {!query && <SearchSuggestions onSelect={handleInput} locale={locale} t={t} />}

      {/* App sayfa sonuclari - anlik */}
      {appResults.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
            {t.search.features}
          </h3>
          <div>
            {appResults.map((page) => (
              <Link
                key={page.id}
                to={page.route as "/"}
                className="flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] active:scale-[0.98] transition-all"
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-[12px] shrink-0 ${page.iconColor}`}>
                  {page.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{(sp as any)[page.id] ?? page.id}</span>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{(sp as any)[`${page.id}Desc`] ?? ""}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[var(--color-text-secondary)]/50">
                  <path d="M5 3l4 4-4 4" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sonuclar */}
      <div aria-live="polite" aria-atomic="true">
        {isLoading && debouncedQuery.length >= 2 && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-8 animate-pulse">
            {t.common.searching}
          </p>
        )}

        {!isLoading && results && results.length === 0 && debouncedQuery.length >= 2 && appResults.length === 0 && (
          <div className="text-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mx-auto mb-3 text-[var(--color-text-secondary)]/30">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t.common.noResults}
            </p>
          </div>
        )}
      </div>

      {results && results.length > 0 && (
        <GroupedResults results={results as SearchResult[]} locale={locale} t={t} navigate={navigate} />
      )}
    </div>
  );
}

// ── Gruplandirmis sonuclar ──────────────────────────────

function GroupedResults({ results, locale, t, navigate }: {
  results: SearchResult[];
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
    const order = ["surah", "translation", "arabic"];
    return order.filter((k) => map[k]?.length).map((k) => ({ type: k, items: map[k] }));
  }, [results]);

  return (
    <section className="space-y-6" aria-label={`${results.length} ${t.common.results}`}>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {results.length} {t.common.results}
      </p>
      {groups.map((group) => (
        <section key={group.type}>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
            {group.type === "surah" ? t.search.groupSurah : group.type === "translation" ? t.search.groupTranslation : group.type === "arabic" ? t.search.groupArabic : group.type}
          </h3>
          <ul className="list-none p-0">
            {group.items.map((r) => (
              <li key={`${r.surahId}:${r.ayahNumber}`}>
                <ResultCard r={r} locale={locale} t={t} navigate={navigate} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

function ResultCard({ r, locale, t, navigate }: {
  r: SearchResult; locale: string; t: any; navigate: any;
}) {
  return (
    <button
      onClick={() => {
        navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(r.surahId) }, search: { ayah: r.ayahNumber } });
      }}
      className="block w-full text-left py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] active:scale-[0.99] transition-all"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{r.surahNameSimple}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
          {r.ayahNumber}
        </span>
        <span className="ml-auto text-[11px] text-[var(--color-text-secondary)]">
          {t.common.page} {r.pageNumber}
        </span>
      </div>
      <p className="text-base leading-[2.2] mb-2" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
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

// ── Populer sureler ve sik aranan kelimeler ─────────────

const POPULAR_SURAHS = [
  { id: 1, nameAr: "\u0627\u0644\u0641\u0627\u062a\u062d\u0629", nameSimple: "Al-Fatihah" },
  { id: 36, nameAr: "\u064a\u0633", nameSimple: "Ya-Sin" },
  { id: 67, nameAr: "\u0627\u0644\u0645\u0644\u0643", nameSimple: "Al-Mulk" },
  { id: 55, nameAr: "\u0627\u0644\u0631\u062d\u0645\u0646", nameSimple: "Ar-Rahman" },
  { id: 56, nameAr: "\u0627\u0644\u0648\u0627\u0642\u0639\u0629", nameSimple: "Al-Waqi'ah" },
  { id: 18, nameAr: "\u0627\u0644\u0643\u0647\u0641", nameSimple: "Al-Kahf" },
  { id: 112, nameAr: "\u0627\u0644\u0625\u062e\u0644\u0627\u0635", nameSimple: "Al-Ikhlas" },
  { id: 2, nameAr: "\u0627\u0644\u0628\u0642\u0631\u0629", nameSimple: "Al-Baqarah" },
  { id: 48, nameAr: "\u0627\u0644\u0641\u062a\u062d", nameSimple: "Al-Fath" },
  { id: 78, nameAr: "\u0627\u0644\u0646\u0628\u0623", nameSimple: "An-Naba" },
];

const SUGGESTED_KEYWORDS: Record<string, string[]> = {
  tr: ["rahmet", "sabır", "namaz", "tövbe", "cennet", "şükür", "adalet", "ihsan", "tevekkül", "hidayet"],
  en: ["mercy", "patience", "prayer", "repentance", "paradise", "grateful", "justice", "faith", "guidance", "forgiveness"],
};

function SearchSuggestions({ onSelect, locale, t }: { onSelect: (q: string) => void; locale: string; t: any }) {
  const keywords = SUGGESTED_KEYWORDS[locale] ?? SUGGESTED_KEYWORDS.tr;

  return (
    <div className="space-y-6">
      {/* Populer sureler */}
      <div>
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-3">
          {t.search.popularSurahs}
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SURAHS.map((s) => (
            <Link
              key={s.id}
              to="/surah/$surahSlug"
              params={{ surahSlug: surahSlug(s.id) }}
              className="flex items-center gap-2 px-3 py-2 rounded bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/8 active:scale-[0.97] text-xs transition-all"
            >
              <span dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: "0.85rem" }}>{s.nameAr}</span>
              <span className="text-[var(--color-text-secondary)]">{getSurahName(s.id, locale) || s.nameSimple}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Anahtar kelimeler */}
      <div>
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-3">
          {t.search.suggestedKeywords}
        </h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <button
              key={kw}
              onClick={() => onSelect(kw)}
              className="px-3 py-1.5 rounded-full bg-[var(--color-accent)]/8 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/15 active:scale-[0.97] text-xs font-medium transition-all"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Kök arama */}
      <div>
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-3">
          {t.hub.rootSearch}
        </h3>
        <LatinRootSearch />
      </div>
    </div>
  );
}
