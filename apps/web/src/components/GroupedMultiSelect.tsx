/**
 * Gruplandırılmış çoklu seçim dropdown'u — dile göre gruplanmış meal seçici.
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "~/hooks/useTranslation";

interface Option {
  value: string;
  label: string;
  group: string;
  /** Arama için ekstra metin */
  searchText?: string;
}

interface GroupedMultiSelectProps {
  options: Option[];
  values: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  /** Grup sırası (ilk eleman en üstte) */
  groupOrder?: string[];
}

export function GroupedMultiSelect({
  options,
  values,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsText,
  groupOrder = [],
}: GroupedMultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q) ||
          o.group.toLowerCase().includes(q) ||
          o.searchText?.toLowerCase().includes(q)
        );
      })
    : options;

  // Gruplandır
  const groups = new Map<string, Option[]>();
  for (const opt of filtered) {
    const list = groups.get(opt.group) ?? [];
    list.push(opt);
    groups.set(opt.group, list);
  }

  // Grupları sırala
  const sortedGroupKeys = [...groups.keys()].sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    const ra = ai >= 0 ? ai : groupOrder.length;
    const rb = bi >= 0 ? bi : groupOrder.length;
    return ra - rb || a.localeCompare(b);
  });

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Seçili meallerin kısa özetini göster
  const selectedLabels = values
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} +${selectedLabels.length - 1}`;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm transition-colors hover:border-[var(--color-accent)]"
      >
        <span className={selectedLabels.length > 0 ? "truncate" : "text-[var(--color-text-secondary)]"}>
          {displayText}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {values.length > 1 && (
            <span className="text-[0.65rem] bg-[var(--color-accent)]/15 text-[var(--color-accent)] px-1.5 py-0.5 rounded-full font-medium">
              {values.length}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          {/* Search input */}
          <div className="border-b border-[var(--color-border)] p-2">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] px-2.5 py-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="shrink-0 text-[var(--color-text-secondary)]"
              >
                <circle cx="6" cy="6" r="4" />
                <path d="M9.5 9.5L12 12" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
              />
            </div>
          </div>

          {/* Grouped options */}
          <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                {noResultsText || t.common.noResults}
              </p>
            ) : (
              sortedGroupKeys.map((groupKey) => (
                <div key={groupKey}>
                  {/* Grup başlığı */}
                  <div className="px-3 pt-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {groupKey}
                  </div>
                  {groups.get(groupKey)!.map((opt) => {
                    const isSelected = values.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "hover:bg-[var(--color-bg)]"
                        }`}
                      >
                        {/* Checkbox */}
                        <span
                          className={`flex shrink-0 items-center justify-center w-4 h-4 rounded border transition-colors ${
                            isSelected
                              ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                              : "border-[var(--color-border)]"
                          }`}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M2 5.5L4 7.5L8 3" />
                            </svg>
                          )}
                        </span>
                        <span className={isSelected ? "font-medium" : ""}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
