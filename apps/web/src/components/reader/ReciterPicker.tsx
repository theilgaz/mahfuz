/**
 * Kâri Seç — full-screen modal.
 * Arama + WBW/tarz/memleket/ses filtreleri.
 * Üstte "Editör'ün Tercihi" featured kâriler, altında tüm liste.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useTranslation } from "~/hooks/useTranslation";

export type VoiceTag = "bas" | "tiz" | "yavas" | "hizli" | "melodik" | "klasik" | "teravih";

export interface ReciterRow {
  slug: string;
  name: string;
  nameArabic: string | null;
  country: string | null;
  style: string | null;
  source: string | null;
  featured: boolean;
  voiceTags: VoiceTag[];
}

interface Props {
  reciters: ReciterRow[];
  value: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
}

const ALL_VOICE_TAGS: VoiceTag[] = ["bas", "tiz", "yavas", "hizli", "melodik", "klasik", "teravih"];

export function ReciterPicker({ reciters, value, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const r = (t.settings as any) ?? {};
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [wbwOnly, setWbwOnly] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<VoiceTag | null>(null);

  useFocusTrap(containerRef, true, onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => { document.body.style.overflow = prev; };
  }, []);

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    reciters.forEach((rc) => rc.country && set.add(rc.country));
    return [...set].sort();
  }, [reciters]);

  const allStyles = useMemo(() => {
    const set = new Set<string>();
    reciters.forEach((rc) => rc.style && set.add(rc.style));
    return [...set].sort();
  }, [reciters]);

  const featured = useMemo(() => reciters.filter((rc) => rc.featured), [reciters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reciters.filter((rc) => {
      if (wbwOnly && rc.source === "self") return false;
      if (styleFilter && rc.style !== styleFilter) return false;
      if (countryFilter === "__unknown__") {
        if (rc.country) return false;
      } else if (countryFilter && rc.country !== countryFilter) {
        return false;
      }
      if (voiceFilter && !rc.voiceTags.includes(voiceFilter)) return false;
      if (q) {
        const hay = [rc.name, rc.nameArabic, rc.country, rc.slug].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reciters, search, wbwOnly, styleFilter, countryFilter, voiceFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ReciterRow[]>();
    const unknownLabel = r.reciterCountryUnknown ?? "Unspecified";
    filtered.forEach((rc) => {
      const key = rc.country || unknownLabel;
      const arr = groups.get(key) ?? [];
      arr.push(rc);
      groups.set(key, arr);
    });
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === unknownLabel) return 1;
      if (b === unknownLabel) return -1;
      return a.localeCompare(b);
    });
  }, [filtered, r.reciterCountryUnknown]);

  const hasActiveFilters = wbwOnly || styleFilter || countryFilter || voiceFilter || search;

  function styleLabel(s: string | null): string {
    if (!s) return "";
    if (s === "murattal") return r.reciterStyleMurattal ?? "Murattal";
    if (s === "mujawwad") return r.reciterStyleMujawwad ?? "Mujawwad";
    if (s === "muallim") return r.reciterStyleMuallim ?? "Muallim";
    return s;
  }

  function voiceLabel(v: VoiceTag): string {
    const map: Record<VoiceTag, string> = {
      bas: r.reciterVoiceBas ?? "Bass",
      tiz: r.reciterVoiceTiz ?? "Treble",
      yavas: r.reciterVoiceYavas ?? "Slow",
      hizli: r.reciterVoiceHizli ?? "Fast",
      melodik: r.reciterVoiceMelodik ?? "Melodic",
      klasik: r.reciterVoiceKlasik ?? "Classical",
      teravih: r.reciterVoiceTeravih ?? "Tarawih",
    };
    return map[v];
  }

  function clearFilters() {
    setSearch("");
    setWbwOnly(false);
    setStyleFilter(null);
    setCountryFilter(null);
    setVoiceFilter(null);
  }

  function pick(slug: string) {
    onSelect(slug);
    onClose();
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={r.reciterPickerTitle ?? "Choose Reciter"}
      className="fixed inset-0 z-[100] bg-[var(--color-bg)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="flex-1 text-base font-medium text-[var(--color-text-primary)]">
          {r.reciterPickerTitle ?? "Choose Reciter"}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4L14 14M14 4L4 14" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <input
          ref={inputRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={r.searchReciter ?? "Search reciter..."}
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-[var(--color-border)]">
        <div className="flex flex-wrap gap-2">
          <FilterToggle
            active={wbwOnly}
            onClick={() => setWbwOnly((v) => !v)}
            label={r.reciterFilterWbw ?? "Word-by-word sync"}
          />
          <FilterDropdown
            label={r.reciterFilterStyle ?? "Style"}
            value={styleFilter}
            displayValue={styleLabel(styleFilter)}
            options={allStyles.map((s) => ({ value: s, label: styleLabel(s) }))}
            onChange={setStyleFilter}
          />
          <FilterDropdown
            label={r.reciterFilterCountry ?? "Country"}
            value={countryFilter}
            displayValue={countryFilter === "__unknown__" ? (r.reciterCountryUnknown ?? "Unspecified") : countryFilter ?? ""}
            options={[
              ...allCountries.map((c) => ({ value: c, label: c })),
              { value: "__unknown__", label: r.reciterCountryUnknown ?? "Unspecified" },
            ]}
            onChange={setCountryFilter}
          />
          <FilterDropdown
            label={r.reciterFilterVoice ?? "Voice"}
            value={voiceFilter}
            displayValue={voiceFilter ? voiceLabel(voiceFilter) : ""}
            options={ALL_VOICE_TAGS.map((v) => ({ value: v, label: voiceLabel(v) }))}
            onChange={(v) => setVoiceFilter(v as VoiceTag | null)}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--color-accent)] underline px-2 py-1"
            >
              {r.reciterFilterClear ?? "Clear filters"}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-12">
        {/* Editor picks — only when no filters/search */}
        {!hasActiveFilters && featured.length > 0 && (
          <section className="px-4 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              {r.reciterPickerEditorPicks ?? "Editor's Picks"}
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {featured.map((rc) => (
                <ReciterCard
                  key={rc.slug}
                  reciter={rc}
                  isSelected={rc.slug === value}
                  onClick={() => pick(rc.slug)}
                  styleLabel={styleLabel}
                  voiceLabel={voiceLabel}
                />
              ))}
            </div>
          </section>
        )}

        {/* All reciters grouped by country */}
        <section className="px-4 pt-2">
          {!hasActiveFilters && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              {r.reciterPickerAll ?? "All Reciters"}
            </h3>
          )}
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
              {r.reciterEmpty ?? "No reciters match the filter."}
            </p>
          ) : (
            grouped.map(([country, rows]) => (
              <div key={country} className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">{country}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rows.map((rc) => (
                    <ReciterRowItem
                      key={rc.slug}
                      reciter={rc}
                      isSelected={rc.slug === value}
                      onClick={() => pick(rc.slug)}
                      styleLabel={styleLabel}
                      voiceLabel={voiceLabel}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function FilterToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] border-[var(--color-accent)]"
          : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterDropdown({
  label,
  value,
  displayValue,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  displayValue: string;
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = value != null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open]);

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
          active
            ? "bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] border-[var(--color-accent)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
        }`}
      >
        <span>{label}{active ? `: ${displayValue}` : ""}</span>
        {active ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear"
            onClick={clear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
                setOpen(false);
              }
            }}
            className="-mr-1 flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/20"
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2L8 8M8 2L2 8" />
            </svg>
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4L5 7L8 4" />
          </svg>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 top-full left-0 mt-1 min-w-[160px] max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg py-1"
        >
          {options.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  selected
                    ? "text-[var(--color-accent)] font-medium bg-[var(--color-surface)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReciterCard({
  reciter,
  isSelected,
  onClick,
  styleLabel,
  voiceLabel,
}: {
  reciter: ReciterRow;
  isSelected: boolean;
  onClick: () => void;
  styleLabel: (s: string | null) => string;
  voiceLabel: (v: VoiceTag) => string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={`text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
      }`}
    >
      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{reciter.name}</p>
      <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
        {[reciter.country, styleLabel(reciter.style)].filter(Boolean).join(" · ")}
      </p>
      {reciter.voiceTags.length > 0 && (
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 truncate">
          {reciter.voiceTags.map(voiceLabel).join(" · ")}
        </p>
      )}
    </button>
  );
}

function ReciterRowItem({
  reciter,
  isSelected,
  onClick,
  styleLabel,
  voiceLabel,
}: {
  reciter: ReciterRow;
  isSelected: boolean;
  onClick: () => void;
  styleLabel: (s: string | null) => string;
  voiceLabel: (v: VoiceTag) => string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
        isSelected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{reciter.name}</span>
          {reciter.nameArabic && (
            <span className="text-sm shrink-0 text-[var(--color-text-secondary)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
              {reciter.nameArabic}
            </span>
          )}
        </div>
        <span className="block text-[11px] text-[var(--color-text-secondary)] truncate">
          {[styleLabel(reciter.style), reciter.source === "self" ? "Sure" : "WBW", ...reciter.voiceTags.map(voiceLabel)].filter(Boolean).join(" · ")}
        </span>
      </div>
    </button>
  );
}
