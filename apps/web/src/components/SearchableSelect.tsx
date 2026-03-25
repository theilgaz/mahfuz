/**
 * Searchable dropdown — tıklayınca açılır, yazarak filtrelenir.
 */

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  /** Arama için ekstra metin (dil, yazar vb.) */
  searchText?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsText,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q) ||
          o.searchText?.toLowerCase().includes(q)
        );
      })
    : options;

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

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm transition-colors hover:border-[var(--color-accent)]"
      >
        <span className={selected ? "" : "text-[var(--color-text-secondary)]"}>
          {selected?.label || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`shrink-0 text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
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

          {/* Options */}
          <div className="max-h-48 overflow-y-auto overscroll-contain p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                {noResultsText || "—"}
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    opt.value === value
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                      : "hover:bg-[var(--color-bg)]"
                  }`}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ml-auto shrink-0">
                      <path d="M3 7.5L5.5 10L11 4" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
