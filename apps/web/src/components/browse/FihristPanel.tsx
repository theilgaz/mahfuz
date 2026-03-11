import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { TOPIC_INDEX } from "~/data/topic-index";
import { ExpandedFihrist } from "./ExpandedFihrist";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

type PlaceFilter = "all" | "makkah" | "madinah";
type JuzFilter = "all" | string;

function PngIcon({ src }: { src: string }) {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/90 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
      <img src={src} alt="" className="h-2.5 w-2.5 object-contain" />
    </span>
  );
}

export function FihristPanel({ initialTopic }: { initialTopic?: number }) {
  const { t, locale } = useTranslation();

  const PLACE_OPTIONS = useMemo(() => [
    { value: "all" as PlaceFilter, label: t.browse.all },
    { value: "makkah" as PlaceFilter, label: t.browse.makkah, icon: <PngIcon src="/images/kaaba.png" /> },
    { value: "madinah" as PlaceFilter, label: t.browse.madinah, icon: <PngIcon src="/images/nabawi.png" /> },
  ], [t]);

  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all");
  const [juzFilter, setJuzFilter] = useState<JuzFilter>("all");
  const [openTopic, setOpenTopic] = useState<number | null>(initialTopic ?? null);
  const [showExpanded, setShowExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return chapters.filter((ch) => {
      if (placeFilter !== "all" && ch.revelation_place !== placeFilter) return false;
      if (juzFilter !== "all") {
        const juz = Number(juzFilter);
        const startJuz = Math.ceil(ch.pages[0] / 20);
        const endJuz = Math.ceil(ch.pages[1] / 20);
        if (juz < startJuz || juz > endJuz) return false;
      }
      if (!q) return true;
      return (
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) ||
        String(ch.id).startsWith(q)
      );
    });
  }, [chapters, search, placeFilter, juzFilter]);

  return (
    <>
      {/* Konu Bazlı İndeks */}
      <section className="mb-8">
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--theme-text)]">
          {t.browse.topics}
        </h2>
        <TopicGrid
          openTopic={openTopic}
          onSelect={(i) => setOpenTopic(openTopic === i ? null : i)}
          chapters={chapters}
        />

        {/* Daha Fazla Button */}
        <button
          type="button"
          onClick={() => setShowExpanded(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-bg-primary)] px-4 py-3 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] active:scale-[0.99]"
        >
          <span>{t.browse.exploreTopics}</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <ExpandedFihrist
          open={showExpanded}
          onClose={() => setShowExpanded(false)}
          chapters={chapters}
        />
      </section>

      {/* Sure Listesi */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--theme-text)]">
          {t.browse.surahList}
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.browse.searchFull}
            className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
          />
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SegmentedControl options={PLACE_OPTIONS} value={placeFilter} onChange={setPlaceFilter} />
          <JuzPicker value={juzFilter} onChange={setJuzFilter} />
        </div>

        {/* Stats */}
        <p className="mb-3 text-[13px] text-[var(--theme-text-tertiary)]">
          {filtered.length} {t.common.surah.toLowerCase()}
          {placeFilter !== "all" && (
            <span> · {placeFilter === "makkah" ? t.browse.makkah : t.browse.madinah}</span>
          )}
          {juzFilter !== "all" && <span> · {t.common.juz} {juzFilter}</span>}
        </p>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-xl bg-[var(--theme-bg-primary)]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-[11px] font-medium uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">{t.common.surah}</th>
                  <th className="px-3 py-2.5">{t.browse.meaning}</th>
                  <th className="px-3 py-2.5">{t.browse.place}</th>
                  <th className="px-3 py-2.5 text-right">{t.common.verse}</th>
                  <th className="hidden px-3 py-2.5 text-right sm:table-cell">{t.common.juz}</th>
                  <th className="hidden px-3 py-2.5 text-right sm:table-cell">{t.common.page}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {filtered.map((ch) => (
                  <tr key={ch.id} className="transition-colors hover:bg-[var(--theme-hover-bg)]">
                    <td className="px-3 py-2 tabular-nums text-[var(--theme-text-tertiary)]">{ch.id}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/surah/$surahId"
                        params={{ surahId: String(ch.id) }}
                        className="font-medium text-[var(--theme-text)] hover:text-primary-600"
                      >
                        {ch.name_simple}
                        <span className="arabic-text ml-2 text-[14px] text-[var(--theme-text-secondary)]">
                          {ch.name_arabic}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--theme-text-secondary)]">{getSurahName(ch.id, ch.translated_name.name, locale)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 text-[var(--theme-text-tertiary)]">
                        {ch.revelation_place === "makkah" ? t.browse.makkah : t.browse.madinah}
                        <img
                          src={ch.revelation_place === "makkah" ? "/images/kaaba.png" : "/images/nabawi.png"}
                          alt=""
                          className="h-3.5 w-3.5 object-contain"
                        />
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--theme-text-secondary)]">{ch.verses_count}</td>
                    <td className="hidden px-3 py-2 text-right tabular-nums text-[var(--theme-text-tertiary)] sm:table-cell">
                      {ch.pages[0] === ch.pages[1]
                        ? `${Math.ceil(ch.pages[0] / 20)}`
                        : `${Math.ceil(ch.pages[0] / 20)}–${Math.ceil(ch.pages[1] / 20)}`}
                    </td>
                    <td className="hidden px-3 py-2 text-right tabular-nums text-[var(--theme-text-tertiary)] sm:table-cell">
                      {ch.pages[0] === ch.pages[1] ? ch.pages[0] : `${ch.pages[0]}–${ch.pages[1]}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[15px] text-[var(--theme-text-secondary)]">{t.common.noResults}</p>
            <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">{t.browse.noResultsHint}</p>
          </div>
        )}
      </section>
    </>
  );
}

/* Juz Picker */

function JuzPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
          value !== "all"
            ? "bg-primary-600/10 text-primary-700"
            : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
        }`}
      >
        {value === "all" ? t.common.juz : `${t.common.juz} ${value}`}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-[232px] rounded-2xl bg-[var(--theme-bg-primary)] p-3 shadow-[var(--shadow-modal)]">
          <button
            type="button"
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`mb-2 w-full rounded-lg py-2 text-[13px] font-medium transition-colors ${
              value === "all"
                ? "bg-primary-600/10 text-primary-700"
                : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
            }`}
          >
            {t.browse.all}
          </button>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 30 }, (_, i) => {
              const n = String(i + 1);
              const active = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { onChange(n); setOpen(false); }}
                  className={`flex aspect-square items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-colors ${
                    active
                      ? "bg-primary-600 text-white"
                      : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Topic Grid with inline row expansion */

import type { Chapter } from "@mahfuz/shared/types";

function TopicGrid({
  openTopic,
  onSelect,
  chapters,
}: {
  openTopic: number | null;
  onSelect: (i: number) => void;
  chapters: Chapter[];
}) {
  const { t } = useTranslation();
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(3);

  // Detect actual column count from grid layout
  const detectCols = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const c = style.gridTemplateColumns.split(" ").length;
    if (c !== cols) setCols(c);
  }, [cols]);

  useEffect(() => {
    detectCols();
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(detectCols);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detectCols]);

  // Auto-scroll detail into view
  useEffect(() => {
    if (openTopic !== null && detailRef.current) {
      // Small delay so DOM settles
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [openTopic]);

  // Calculate which row the active topic is in and where to insert the detail
  const activeRow = openTopic !== null ? Math.floor(openTopic / cols) : -1;
  const insertAfterIndex = activeRow >= 0
    ? Math.min((activeRow + 1) * cols - 1, TOPIC_INDEX.length - 1)
    : -1;

  // Build elements: cards + inline detail panel
  const elements: React.ReactNode[] = [];
  TOPIC_INDEX.forEach((entry, i) => {
    const isOpen = openTopic === i;
    elements.push(
      <button
        key={`card-${i}`}
        type="button"
        onClick={() => onSelect(i)}
        className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
          isOpen
            ? "bg-primary-600/10 ring-1 ring-primary-600/20"
            : "bg-[var(--theme-bg-primary)] hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
        }`}
      >
        <span className="text-[24px] leading-none">{entry.icon}</span>
        <span
          className={`max-w-full px-1 text-center text-[11px] font-medium leading-tight ${
            isOpen ? "text-primary-700" : "text-[var(--theme-text-secondary)]"
          }`}
        >
          {entry.topic}
        </span>
      </button>,
    );

    // Insert detail panel after the last card in the active row
    if (i === insertAfterIndex && openTopic !== null) {
      const topic = TOPIC_INDEX[openTopic];
      elements.push(
        <div
          key="detail"
          ref={detailRef}
          className="relative col-span-full rounded-2xl bg-[var(--theme-bg-primary)] p-4"
          style={{ gridColumn: "1 / -1" }}
        >
          {/* Arrow pointer */}
          <div
            className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-[var(--theme-bg-primary)]"
            style={{
              left: `calc(${((openTopic % cols) / cols) * 100}% + ${100 / cols / 2}%)`,
              transform: "translateX(-50%)",
            }}
          />
          {/* Header */}
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[22px] leading-none">{topic.icon}</span>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[var(--theme-text)]">
                {topic.topic}
              </h3>
              <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                {topic.refs.length} {t.browse.reference}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelect(openTopic)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Refs */}
          <div className="flex flex-wrap gap-2">
            {topic.refs.map((ref) => {
              const [surah, verseRange] = ref.split(":");
              const firstVerse = verseRange?.split("-")[0];
              const ch = chapters.find((c) => c.id === Number(surah));
              return (
                <Link
                  key={ref}
                  to="/surah/$surahId"
                  params={{ surahId: surah }}
                  search={{ topic: openTopic!, verse: firstVerse ? Number(firstVerse) : undefined }}
                  className="group flex items-center gap-2 rounded-lg bg-[var(--theme-hover-bg)] px-3 py-1.5 transition-colors hover:bg-primary-600/10"
                >
                  <span className="text-[12px] font-semibold tabular-nums text-primary-700">
                    {ref}
                  </span>
                  {ch && (
                    <span className="text-[11px] text-[var(--theme-text-tertiary)] group-hover:text-primary-600">
                      {ch.name_simple}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>,
      );
    }
  });

  return (
    <div ref={gridRef} className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {elements}
    </div>
  );
}
