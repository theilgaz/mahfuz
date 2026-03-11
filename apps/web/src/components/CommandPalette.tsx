import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { searchQueryOptions } from "~/hooks/useSearch";
import { TOTAL_PAGES, TOTAL_JUZ, TOTAL_CHAPTERS } from "@mahfuz/shared/constants";
import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { QUERY_KEYS } from "~/lib/query-keys";
import { getSurahName } from "~/lib/surah-name";

// Turkish character normalization for fuzzy matching
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

interface NavResult {
  type: "surah" | "page" | "juz" | "verse";
  label: string;
  sublabel: string;
  to: string;
  params: Record<string, string>;
  search?: Record<string, string>;
}

function parseStructuralResults(
  query: string,
  chapters: Chapter[],
  t: ReturnType<typeof useTranslation>["t"],
  locale: "tr" | "en",
): NavResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: NavResult[] = [];
  const qLower = q.toLowerCase();
  const qNorm = normalize(q);

  // Pattern: "N:N" → surah:verse (e.g. "33:35", "2:255")
  const colonMatch = q.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    const surahNum = Number(colonMatch[1]);
    const verseNum = Number(colonMatch[2]);
    const ch = chapters.find((c) => c.id === surahNum);
    if (ch && verseNum >= 1 && verseNum <= ch.verses_count) {
      results.push({
        type: "verse",
        label: `${getSurahName(ch.id, ch.translated_name.name, locale)} ${verseNum}`,
        sublabel: `${ch.name_simple} · ${surahNum}:${verseNum}`,
        to: "/surah/$surahId",
        params: { surahId: String(surahNum) },
        search: { verse: String(verseNum) },
      });
      return results;
    }
  }

  // Pattern: "cüz N" / "juz N" / "N. cüz"
  const juzMatch =
    qLower.match(/^(?:c[uü]z|juz)\s+(\d+)$/i) ||
    qLower.match(/^(\d+)\.\s*(?:c[uü]z|juz)$/i);
  if (juzMatch) {
    const n = Number(juzMatch[1]);
    if (n >= 1 && n <= TOTAL_JUZ) {
      results.push({
        type: "juz",
        label: `${t.common.juz} ${n}`,
        sublabel: `${n}. ${t.common.juz}`,
        to: "/juz/$juzId",
        params: { juzId: String(n) },
      });
      return results;
    }
  }

  // Pattern: "sayfa N" / "page N"
  const pageMatch = qLower.match(/^(?:sayfa|page)\s+(\d+)$/i);
  if (pageMatch) {
    const n = Number(pageMatch[1]);
    if (n >= 1 && n <= TOTAL_PAGES) {
      results.push({
        type: "page",
        label: `${t.common.page} ${n}`,
        sublabel: `${t.commandPalette.mushafPage} ${n}`,
        to: "/page/$pageNumber",
        params: { pageNumber: String(n) },
      });
      return results;
    }
  }

  // Pattern: "surah_name N" → specific verse
  // Try to match "name number" where name is a surah
  const verseMatch = q.match(/^(.+?)\s+(\d+)$/);
  if (verseMatch) {
    const namePart = normalize(verseMatch[1]);
    const verseNum = Number(verseMatch[2]);
    const matched = chapters.find(
      (ch) =>
        normalize(ch.name_simple) === namePart ||
        normalize(getSurahName(ch.id, ch.translated_name.name, locale)) === namePart ||
        ch.name_arabic === verseMatch[1].trim(),
    );
    if (matched && verseNum >= 1 && verseNum <= matched.verses_count) {
      results.push({
        type: "verse",
        label: `${getSurahName(matched.id, matched.translated_name.name, locale)} ${verseNum}`,
        sublabel: `${matched.name_simple} · ${matched.id}:${verseNum}`,
        to: "/surah/$surahId",
        params: { surahId: String(matched.id) },
        search: { verse: String(verseNum) },
      });
      // Also show the surah itself
      results.push({
        type: "surah",
        label: `${getSurahName(matched.id, matched.translated_name.name, locale)}`,
        sublabel: `${matched.id}. ${t.commandPalette.surahUnit} · ${matched.verses_count} ${t.common.verse}`,
        to: "/surah/$surahId",
        params: { surahId: String(matched.id) },
      });
      return results;
    }
  }

  // Pattern: pure number → surah X, page X, juz X
  const numMatch = q.match(/^(\d+)$/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= TOTAL_CHAPTERS) {
      const ch = chapters.find((c) => c.id === n);
      if (ch) {
        results.push({
          type: "surah",
          label: getSurahName(ch.id, ch.translated_name.name, locale),
          sublabel: `${ch.id}. ${t.commandPalette.surahUnit} · ${ch.name_simple} · ${ch.verses_count} ${t.common.verse}`,
          to: "/surah/$surahId",
          params: { surahId: String(n) },
        });
      }
    }
    if (n >= 1 && n <= TOTAL_PAGES) {
      results.push({
        type: "page",
        label: `${t.common.page} ${n}`,
        sublabel: `${t.commandPalette.mushafPage} ${n}`,
        to: "/page/$pageNumber",
        params: { pageNumber: String(n) },
      });
    }
    if (n >= 1 && n <= TOTAL_JUZ) {
      results.push({
        type: "juz",
        label: `${t.common.juz} ${n}`,
        sublabel: `${n}. ${t.common.juz}`,
        to: "/juz/$juzId",
        params: { juzId: String(n) },
      });
    }
    return results;
  }

  // Pattern: surah name search (fuzzy)
  const matchedChapters = chapters.filter((ch) => {
    const nameSimple = normalize(ch.name_simple);
    const nameTr = normalize(getSurahName(ch.id, ch.translated_name.name, locale));
    return (
      nameSimple.includes(qNorm) ||
      nameTr.includes(qNorm) ||
      ch.name_arabic.includes(q)
    );
  });
  for (const ch of matchedChapters.slice(0, 6)) {
    results.push({
      type: "surah",
      label: getSurahName(ch.id, ch.translated_name.name, locale),
      sublabel: `${ch.id}. ${t.commandPalette.surahUnit} · ${ch.name_simple} · ${ch.verses_count} ${t.common.verse}`,
      to: "/surah/$surahId",
      params: { surahId: String(ch.id) },
    });
  }

  return results;
}

function TypeIcon({ type }: { type: NavResult["type"] }) {
  const cls = "h-[18px] w-[18px] text-[var(--theme-text-tertiary)]";
  switch (type) {
    case "surah":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "page":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "juz":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25" />
        </svg>
      );
    case "verse":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
  }
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get chapters from cache (already loaded by layout)
  const chapters = queryClient.getQueryData<Chapter[]>(QUERY_KEYS.chapters()) ?? [];

  // Structural (instant) results
  const navResults = useMemo(
    () => parseStructuralResults(query, chapters, t, locale),
    [query, chapters, t, locale],
  );

  // Debounce for API search
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Only do API search when no structural results or query looks like text
  const shouldSearch =
    debouncedQuery.length >= 2 && navResults.length === 0;
  const { data: searchData, isLoading: searchLoading } = useQuery(
    searchQueryOptions(shouldSearch ? debouncedQuery : ""),
  );

  // Total items for keyboard navigation
  const searchResults = searchData?.results ?? [];
  const totalItems = navResults.length + searchResults.length;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (index: number) => {
      if (index < navResults.length) {
        const item = navResults[index];
        onClose();
        navigate({ to: item.to, params: item.params, search: item.search as any });
      } else {
        const searchIdx = index - navResults.length;
        const result = searchResults[searchIdx];
        if (result) {
          const [surahId, verseNum] = result.verse_key.split(":");
          onClose();
          navigate({
            to: "/surah/$surahId",
            params: { surahId },
            search: { verse: verseNum },
          });
        }
      }
    },
    [navResults, searchResults, navigate, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1 < totalItems ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 >= 0 ? i - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (totalItems > 0) handleSelect(selectedIndex);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [totalItems, selectedIndex, handleSelect, onClose],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm sm:px-6 sm:pt-[12vh]"
      onClick={handleBackdropClick}
    >
      <div
        className="flex w-full max-h-[100dvh] flex-col overflow-hidden bg-[var(--theme-bg-primary)] sm:max-w-[600px] sm:max-h-[70vh] sm:rounded-2xl sm:shadow-[var(--shadow-modal)] sm:border sm:border-[var(--theme-border)]"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3">
          <svg
            className="h-[18px] w-[18px] shrink-0 text-[var(--theme-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.commandPalette.placeholder}
            className="flex-1 bg-transparent text-[16px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-full p-0.5 text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <kbd className="hidden rounded-md bg-[var(--theme-hover-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-quaternary)] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {/* Empty state */}
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[var(--theme-text-tertiary)]">
                {t.commandPalette.emptyDesc}
              </p>
              <div className="mx-auto mt-3 flex max-w-[320px] flex-wrap justify-center gap-1.5">
                {["fatiha", "bakara 255", "33:35", "5", "cüz 29", "sayfa 300"].map(
                  (ex) => (
                    <button
                      key={ex}
                      onClick={() => setQuery(ex)}
                      className="rounded-lg bg-[var(--theme-hover-bg)] px-2.5 py-1 text-[12px] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
                    >
                      {ex}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Structural nav results */}
          {navResults.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)]">
                {t.commandPalette.quickNav}
              </p>
              {navResults.map((item, i) => (
                <button
                  key={`${item.type}-${item.to}-${JSON.stringify(item.params)}-${item.search?.verse ?? ""}`}
                  data-index={i}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedIndex === i
                      ? "bg-primary-600/10"
                      : "hover:bg-[var(--theme-hover-bg)]"
                  }`}
                >
                  <TypeIcon type={item.type} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-[var(--theme-text)]">
                      {item.label}
                    </span>
                    <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                      {item.sublabel}
                    </p>
                  </div>
                  {selectedIndex === i && (
                    <kbd className="hidden rounded-md bg-[var(--theme-hover-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-quaternary)] sm:inline-block">
                      Enter
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* API search results */}
          {shouldSearch && searchLoading && (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">
              {t.commandPalette.searching}
            </p>
          )}

          {searchResults.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)]">
                {t.commandPalette.verseResults} · {searchData!.total_results} {t.commandPalette.results}
              </p>
              {searchResults.map((result, i) => {
                const idx = navResults.length + i;
                return (
                  <button
                    key={result.verse_id}
                    data-index={idx}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`block w-full px-4 py-3 text-left transition-colors ${
                      selectedIndex === idx
                        ? "bg-primary-600/10"
                        : "hover:bg-[var(--theme-hover-bg)]"
                    }`}
                  >
                    <span className="mb-1 inline-block text-[12px] font-medium text-primary-600">
                      {result.verse_key}
                    </span>
                    <p
                      className="arabic-text text-base leading-relaxed text-[var(--theme-text)]"
                      dir="rtl"
                    >
                      {result.text}
                    </p>
                    {result.translations?.[0] && (
                      <p
                        className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]"
                        dangerouslySetInnerHTML={{
                          __html: result.translations[0].text,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.trim() &&
            navResults.length === 0 &&
            !searchLoading &&
            shouldSearch &&
            searchResults.length === 0 && (
              <p className="px-4 py-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">
                {t.common.noResults}
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
