import { useState, useEffect, useRef, useMemo } from "react";
import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

export function HeaderSurahPicker({
  currentChapterId,
  chapters,
  onSelect,
  onClose,
}: {
  currentChapterId: number;
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) ||
        String(ch.id).startsWith(q),
    );
  }, [chapters, search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to current surah on mount (only when not searching)
  useEffect(() => {
    if (!search) {
      requestAnimationFrame(() => {
        currentRef.current?.scrollIntoView({ block: "center" });
      });
    }
  }, [search]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // Use timeout so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full z-50 mt-1 w-80 animate-scale-in overflow-hidden rounded-xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)]"
    >
      {/* Search */}
      <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] px-3 py-2.5">
        <svg
          className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-tertiary)]"
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
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.surahPicker.placeholder}
          className="flex-1 bg-transparent text-[13px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none"
        />
      </div>

      {/* List */}
      <div className="max-h-[50vh] overflow-y-auto">
        {filtered.map((ch) => {
          const isCurrent = ch.id === currentChapterId;
          return (
            <button
              key={ch.id}
              ref={isCurrent ? currentRef : undefined}
              type="button"
              onClick={() => onSelect(ch.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                isCurrent
                  ? "bg-primary-600/10"
                  : "hover:bg-[var(--theme-hover-bg)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums ${
                  isCurrent
                    ? "bg-primary-600 text-white"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"
                }`}
              >
                {ch.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[var(--theme-text)]">
                    {getSurahName(ch.id, ch.translated_name.name, locale)}
                  </span>
                  <span className="text-[10px] text-[var(--theme-text-quaternary)]">
                    {ch.name_simple}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--theme-text-tertiary)]">
                  {ch.verses_count} {t.browse.versesCount}
                </span>
              </div>
              <span
                className="arabic-text shrink-0 text-sm text-[var(--theme-text-secondary)]"
                dir="rtl"
              >
                {ch.name_arabic}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px] text-[var(--theme-text-tertiary)]">
            {t.common.noResults}
          </p>
        )}
      </div>
    </div>
  );
}
