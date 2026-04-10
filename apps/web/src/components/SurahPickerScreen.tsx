/**
 * Oyun başlangıcında sure seçim ekranı.
 * Tüm sure bazlı oyunlarda paylaşılır; seçim localStorage'a kaydedilir.
 */

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSurahs } from "~/lib/quran-service";
import { useSurahSelectionStore } from "~/stores/surahSelection.store";
import { useHifzStore } from "~/stores/hifz.store";
import { FixedBottomBar } from "~/components/FixedBottomBar";
import { useTranslation } from "~/hooks/useTranslation";

const PRESET_RANGES = [
  { key: "last10",    range: [105, 114] },
  { key: "duhaToNas", range: [93,  114] },
  { key: "amme",      range: [78,  114] },
  { key: "tabaraka",  range: [67,   77] },
] as const;

interface Props {
  gameTitle: string;
  backTo?: string;
  onStart: (surahIds: number[]) => void;
}

export function SurahPickerScreen({ gameTitle, backTo = "/games", onStart }: Props) {
  const { t } = useTranslation();
  const savedIds = useSurahSelectionStore((s) => s.selectedSurahIds);
  const saveIds = useSurahSelectionStore((s) => s.setSelectedSurahIds);
  const memorized = useHifzStore((s) => s.memorized);

  const memorizedSurahIds = Object.entries(memorized)
    .filter(([, verses]) => verses.length > 0)
    .map(([id]) => Number(id));

  const [selected, setSelected] = useState<Set<number>>(new Set(savedIds));
  const [search, setSearch] = useState("");

  const { data: surahs = [], isLoading } = useQuery({
    queryKey: ["quran", "surahs"],
    queryFn: () => getSurahs(),
    staleTime: Infinity,
  });

  const filtered = surahs.filter(
    (s) =>
      s.nameSimple.toLowerCase().includes(search.toLowerCase()) ||
      s.nameArabic.includes(search) ||
      String(s.id).includes(search)
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(surahs.map((s) => s.id)));
  const clearAll = () => setSelected(new Set());

  const applyPreset = (range: readonly [number, number]) => {
    const [from, to] = range;
    setSelected(new Set(surahs.filter((s) => s.id >= from && s.id <= to).map((s) => s.id)));
    setSearch("");
  };

  const PRESETS = [
    { key: "last10",    label: t.surahPicker.presetLast10,    range: [105, 114] },
    { key: "duhaToNas", label: t.surahPicker.presetDuhaToNas, range: [93,  114] },
    { key: "amme",      label: t.surahPicker.presetAmme,      range: [78,  114] },
    { key: "tabaraka",  label: t.surahPicker.presetTabaraka,  range: [67,   77] },
  ] as const;

  const activePreset = PRESET_RANGES.find(({ range: [from, to] }) => {
    const ids = surahs.filter((s) => s.id >= from && s.id <= to).map((s) => s.id);
    return ids.length > 0 && ids.every((id) => selected.has(id)) && selected.size === ids.length;
  });

  const applyEzberim = () => {
    setSelected(new Set(memorizedSurahIds));
    setSearch("");
  };

  const handleStart = () => {
    const ids = [...selected];
    saveIds(ids);
    onStart(ids);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-36">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link to={backTo as "/games"} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{gameTitle}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.surahPicker.subtitle}</p>
        </div>
        <div className="w-5" />
      </div>

      {/* Seçim bilgisi */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {selected.size === 0
            ? t.surahPicker.allQuranHint
            : t.surahPicker.selectedCount.replace("{count}", String(selected.size))}
        </p>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-[var(--color-accent)] hover:underline">
            {t.surahPicker.selectAll}
          </button>
          {selected.size > 0 && (
            <button onClick={clearAll} className="text-xs text-[var(--color-text-secondary)] hover:underline">
              {t.surahPicker.clear}
            </button>
          )}
        </div>
      </div>

      {/* Ön tanımlı gruplar */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {/* Ezberim */}
        <button
          onClick={applyEzberim}
          disabled={memorizedSurahIds.length === 0}
          title={memorizedSurahIds.length === 0 ? t.surahPicker.noMemorized : t.surahPicker.memorizedCount.replace("{count}", String(memorizedSurahIds.length))}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
            memorizedSurahIds.length === 0
              ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] opacity-40 cursor-not-allowed"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 4a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-4-4H7z" />
          </svg>
          {t.surahPicker.myMemorized}
          {memorizedSurahIds.length > 0 && (
            <span className="text-[10px] text-[var(--color-accent)]">
              {memorizedSurahIds.length}
            </span>
          )}
        </button>

        {PRESETS.map((preset) => {
          const isActive = activePreset?.key === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => applyPreset(preset.range)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Arama */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder={t.surahPicker.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]/60"
        />
      </div>

      {/* Sure listesi */}
      <div className="overflow-y-auto max-h-[55vh] space-y-1 mb-4 pr-1">
        {isLoading ? (
          <p className="text-center text-sm text-[var(--color-text-secondary)] py-8">{t.surahPicker.loading}</p>
        ) : (
          filtered.map((s) => {
            const isSelected = selected.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/8"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] w-5 shrink-0">{s.id}</span>
                <span className="text-sm text-[var(--color-text-primary)] flex-1">{s.nameSimple}</span>
                <span
                  className="text-base text-[var(--color-text-secondary)]"
                  style={{ fontFamily: "var(--font-arabic)" }}
                  dir="rtl"
                >
                  {s.nameArabic}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] shrink-0">{s.ayahCount}</span>
              </button>
            );
          })
        )}
      </div>

      <FixedBottomBar>
        <button
          onClick={handleStart}
          className="w-full max-w-lg mx-auto block py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm"
        >
          {selected.size === 0
            ? t.surahPicker.startAll
            : t.surahPicker.startWithCount.replace("{count}", String(selected.size))}
        </button>
      </FixedBottomBar>
    </div>
  );
}
