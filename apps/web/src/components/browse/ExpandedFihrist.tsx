import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { EXPANDED_TOPIC_INDEX } from "~/data/topic-index-expanded";
import type { TopicCategory } from "~/data/topic-index-expanded";
import type { TopicEntry } from "~/data/topic-index";
import type { Chapter } from "@mahfuz/shared/types";

interface ExpandedFihristProps {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[];
}

export function ExpandedFihrist({ open, onClose, chapters }: ExpandedFihristProps) {
  const [search, setSearch] = useState("");
  const [openTopic, setOpenTopic] = useState<string | null>(null); // "categoryId:topicIdx"
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearch("");
      setOpenTopic(null);
      setCollapsedCategories(new Set());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Scroll detail into view
  useEffect(() => {
    if (openTopic && detailRef.current) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [openTopic]);

  const toggleCategory = useCallback((id: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filtered categories based on search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return EXPANDED_TOPIC_INDEX;

    return EXPANDED_TOPIC_INDEX.map((cat) => ({
      ...cat,
      topics: cat.topics.filter((t) => t.topic.toLowerCase().includes(q)),
    })).filter((cat) => cat.topics.length > 0);
  }, [search]);

  // Count total topics
  const totalTopics = useMemo(
    () => filtered.reduce((sum, cat) => sum + cat.topics.length, 0),
    [filtered],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 mt-auto flex h-[92vh] w-full flex-col rounded-t-2xl bg-[var(--theme-bg-secondary)] shadow-modal animate-slide-up sm:mx-auto sm:my-auto sm:mt-auto sm:h-[85vh] sm:max-w-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 rounded-t-2xl bg-[var(--theme-bg-secondary)] px-5 pb-3 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[var(--theme-text)]">
              Konu Fihristi
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
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
              onChange={(e) => {
                setSearch(e.target.value);
                setOpenTopic(null);
              }}
              placeholder="Konu ara..."
              className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
            />
          </div>

          {/* Stats */}
          <p className="mt-2 text-[12px] text-[var(--theme-text-tertiary)]">
            {search ? `${totalTopics} sonuç` : `${filtered.length} kategori · ${totalTopics} konu`}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] text-[var(--theme-text-secondary)]">Sonuç bulunamadı</p>
              <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">Farklı bir arama terimi deneyin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  collapsed={collapsedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  openTopic={openTopic}
                  onSelectTopic={setOpenTopic}
                  detailRef={detailRef}
                  chapters={chapters}
                  onNavigate={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Category Section ── */

function CategorySection({
  category,
  collapsed,
  onToggle,
  openTopic,
  onSelectTopic,
  detailRef,
  chapters,
  onNavigate,
}: {
  category: TopicCategory;
  collapsed: boolean;
  onToggle: () => void;
  openTopic: string | null;
  onSelectTopic: (key: string | null) => void;
  detailRef: React.RefObject<HTMLDivElement | null>;
  chapters: Chapter[];
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--theme-hover-bg)]"
      >
        <span className="text-[20px] leading-none">{category.icon}</span>
        <div className="flex-1">
          <span className="text-[14px] font-semibold text-[var(--theme-text)]">
            {category.label}
          </span>
          <span className="ml-2 text-[12px] text-[var(--theme-text-tertiary)]">
            {category.topics.length} konu
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-[var(--theme-text-tertiary)] transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Topics Grid */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <TopicGridExpanded
            categoryId={category.id}
            topics={category.topics}
            openTopic={openTopic}
            onSelectTopic={onSelectTopic}
            detailRef={detailRef}
            chapters={chapters}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
}

/* ── Topic Grid (expanded version with inline detail) ── */

function TopicGridExpanded({
  categoryId,
  topics,
  openTopic,
  onSelectTopic,
  detailRef,
  chapters,
  onNavigate,
}: {
  categoryId: string;
  topics: TopicEntry[];
  openTopic: string | null;
  onSelectTopic: (key: string | null) => void;
  detailRef: React.RefObject<HTMLDivElement | null>;
  chapters: Chapter[];
  onNavigate: () => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(3);

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

  // Find which topic in this category is open
  const openIdx = openTopic?.startsWith(`${categoryId}:`)
    ? Number(openTopic.split(":")[1])
    : -1;

  const activeRow = openIdx >= 0 ? Math.floor(openIdx / cols) : -1;
  const insertAfterIndex = activeRow >= 0
    ? Math.min((activeRow + 1) * cols - 1, topics.length - 1)
    : -1;

  const elements: React.ReactNode[] = [];
  topics.forEach((entry, i) => {
    const key = `${categoryId}:${i}`;
    const isOpen = openIdx === i;

    elements.push(
      <button
        key={`card-${key}`}
        type="button"
        onClick={() => onSelectTopic(isOpen ? null : key)}
        className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${
          isOpen
            ? "bg-primary-600/10 ring-1 ring-primary-600/20"
            : "bg-[var(--theme-bg-secondary)] hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
        }`}
      >
        <span className="text-[22px] leading-none">{entry.icon}</span>
        <span
          className={`max-w-full px-1 text-center text-[10px] font-medium leading-tight ${
            isOpen ? "text-primary-700" : "text-[var(--theme-text-secondary)]"
          }`}
        >
          {entry.topic}
        </span>
      </button>,
    );

    // Insert detail panel after the last card in the active row
    if (i === insertAfterIndex && openIdx >= 0) {
      const topic = topics[openIdx];
      elements.push(
        <div
          key={`detail-${categoryId}`}
          ref={detailRef}
          className="relative col-span-full rounded-xl bg-[var(--theme-bg-secondary)] p-3"
          style={{ gridColumn: "1 / -1" }}
        >
          {/* Arrow pointer */}
          <div
            className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-[var(--theme-bg-secondary)]"
            style={{
              left: `calc(${((openIdx % cols) / cols) * 100}% + ${100 / cols / 2}%)`,
              transform: "translateX(-50%)",
            }}
          />
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[20px] leading-none">{topic.icon}</span>
            <div className="flex-1">
              <h3 className="text-[13px] font-semibold text-[var(--theme-text)]">
                {topic.topic}
              </h3>
              <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                {topic.refs.length} referans
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTopic(null)}
              className="rounded-lg p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label="Kapat"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Refs */}
          <div className="flex flex-wrap gap-1.5">
            {topic.refs.map((ref) => {
              const [surah, verseRange] = ref.split(":");
              const firstVerse = verseRange?.split("-")[0];
              const ch = chapters.find((c) => c.id === Number(surah));
              return (
                <Link
                  key={ref}
                  to="/surah/$surahId"
                  params={{ surahId: surah }}
                  search={{ verse: firstVerse ? Number(firstVerse) : undefined }}
                  onClick={onNavigate}
                  className="group flex items-center gap-1.5 rounded-lg bg-[var(--theme-bg-primary)] px-2.5 py-1 transition-colors hover:bg-primary-600/10"
                >
                  <span className="text-[11px] font-semibold tabular-nums text-primary-700">
                    {ref}
                  </span>
                  {ch && (
                    <span className="text-[10px] text-[var(--theme-text-tertiary)] group-hover:text-primary-600">
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
    <div ref={gridRef} className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
      {elements}
    </div>
  );
}
