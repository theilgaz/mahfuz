import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { ChapterCard } from "~/components/quran";
import { Loading } from "~/components/ui/Loading";
import { SegmentedControl } from "~/components/ui/SegmentedControl";

export const Route = createFileRoute("/_app/surah/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(chaptersQueryOptions()),
  pendingComponent: () => <Loading text="Sureler yükleniyor..." />,
  component: SurahList,
});

type FilterType = "all" | "makkah" | "madinah";
type SortType = "mushaf" | "revelation";

function PngIcon({ src }: { src: string }) {
  return (
    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/90 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
      <img src={src} alt="" className="h-3 w-3 object-contain" />
    </span>
  );
}

const FILTER_OPTIONS = [
  { value: "all" as FilterType, label: "Tümü" },
  { value: "makkah" as FilterType, label: "Mekke", icon: <PngIcon src="/images/kaaba.png" /> },
  { value: "madinah" as FilterType, label: "Medine", icon: <PngIcon src="/images/nabawi.png" /> },
];

const SORT_OPTIONS = [
  { value: "mushaf" as SortType, label: "Tertip" },
  { value: "revelation" as SortType, label: "Nüzul" },
];

function SurahList() {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, _setSort] = useState<SortType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("surah-sort");
      if (saved === "mushaf" || saved === "revelation") return saved;
    }
    return "mushaf";
  });
  const setSort = useCallback((v: SortType) => {
    _setSort(v);
    localStorage.setItem("surah-sort", v);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = chapters.filter((ch) => {
      if (filter !== "all" && ch.revelation_place !== filter) return false;
      if (!q) return true;
      return (
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        ch.translated_name.name.toLowerCase().includes(q) ||
        String(ch.id).startsWith(q)
      );
    });
    if (sort === "revelation") {
      return [...result].sort((a, b) => a.revelation_order - b.revelation_order);
    }
    return result;
  }, [chapters, search, filter, sort]);

  const totalVerses = useMemo(
    () => filtered.reduce((sum, ch) => sum + ch.verses_count, 0),
    [filtered],
  );

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.02em] text-[var(--theme-text)]">
        Sureler
      </h1>

      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sure ara..."
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
        />
      </div>

      {/* Filter + Sort */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
      </div>

      {/* Stats */}
      <p className="mb-4 text-[13px] text-[var(--theme-text-tertiary)]">
        {filtered.length} sure · {totalVerses.toLocaleString("tr-TR")} ayet
        {filter !== "all" && (
          <span>
            {" "}
            ({filter === "makkah" ? "Mekke" : "Medine"})
          </span>
        )}
      </p>

      {/* Chapter list */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            Sonuç bulunamadı
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            Farklı bir arama terimi deneyin
          </p>
        </div>
      )}
    </div>
  );
}
