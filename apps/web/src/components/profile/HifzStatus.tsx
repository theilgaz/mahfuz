/**
 * Hıfz durumu — kart tabanlı UI.
 *
 * Grid kartlar + bottom sheet ayet detayı.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useHifzStore, computeHifzStats, SURAH_VERSE_COUNTS, TOTAL_VERSES } from "~/stores/hifz.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";
import { useTranslation } from "~/hooks/useTranslation";

/** Cüz → sure aralıkları */
const JUZ_SURAH_RANGES: [number, number][] = [
  [1, 2], [2, 2], [2, 3], [3, 4], [4, 4], [4, 5], [5, 6], [6, 7], [7, 7], [8, 9],
  [9, 11], [11, 12], [12, 14], [15, 16], [17, 17], [18, 18], [21, 22], [23, 25], [25, 27], [27, 29],
  [29, 33], [33, 36], [36, 38], [39, 41], [41, 45], [46, 51], [51, 57], [58, 66], [67, 77], [78, 114],
];

const EMPTY_ARR: number[] = [];

/* ── Dairesel ilerleme ─────────────────────────────── */

function ProgressRing({ percentage, size = 120, strokeWidth }: { percentage: number; size?: number; strokeWidth?: number }) {
  const stroke = strokeWidth ?? (size > 60 ? 8 : 4);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="var(--color-accent)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

/* ── Checkbox ikonu ────────────────────────────────── */

function CheckIcon({ state }: { state: "none" | "partial" | "complete" }) {
  if (state === "complete") {
    return (
      <span className="w-5 h-5 rounded bg-[var(--color-accent)] flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6l2.5 2.5 4.5-4.5" />
        </svg>
      </span>
    );
  }
  if (state === "partial") {
    return (
      <span className="w-5 h-5 rounded bg-[var(--color-text-secondary)] flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h6" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded border-2 border-[var(--color-border)] flex items-center justify-center shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M5 2v6M2 5h6" />
      </svg>
    </span>
  );
}

/* ── Ayet aralığı metni ────────────────────────────── */

function versesToRangeText(verses: number[], total: number, allLabel: string): string {
  if (verses.length === 0) return "";
  if (verses.length === total) return allLabel;
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      ranges.push(start === prev ? String(start) : `${start}-${prev}`);
      start = cur;
      prev = cur;
    }
  }
  return ranges.join(", ");
}


/* ── Sure kartı ────────────────────────────────────── */

function SurahCard({
  surahId,
  onOpen,
}: {
  surahId: number;
  onOpen: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const { t } = useTranslation();
  const h = t.profile.hifz;

  const verses = useHifzStore((s) => s.memorized[surahId]) ?? EMPTY_ARR;

  const total = SURAH_VERSE_COUNTS[surahId] ?? 0;
  const count = verses.length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isComplete = count === total && total > 0;
  const isPartial = count > 0 && count < total;
  const name = getSurahName(surahId, locale);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      onClick={onOpen}
      className={`p-3 rounded border cursor-pointer active:scale-[0.98] transition-all ${
        isComplete
          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5"
          : isPartial
            ? "border-[var(--color-accent)]/15 bg-[var(--color-surface)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className={`shrink-0 w-8 h-8 rounded border flex items-center justify-center text-[10px] font-bold tabular-nums ${
          isComplete
            ? "border-[var(--color-accent)] text-[var(--color-accent)]"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
        }`}>
          {surahId}
        </span>
        <span className={`flex-1 min-w-0 text-sm font-medium truncate ${
          isComplete ? "text-[var(--color-accent)]" : ""
        }`}>
          {name}
        </span>
        {isComplete && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[var(--color-accent)]">
            <path d="M3 7l2.5 2.5L11 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className={`h-1 rounded-full overflow-hidden mb-1.5 ${isComplete || isPartial ? "bg-[var(--color-border)]/50" : "invisible"}`}>
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
        <span>{count > 0 ? `${count}/${total} ${h.verses}` : `${total} ${h.verses}`}</span>
        <span className={`font-bold ${isComplete ? "text-[var(--color-accent)]" : ""} ${count > 0 ? "" : "invisible"}`}>
          %{pct}
        </span>
      </div>
    </div>
  );
}

/* ── Ayet detay sheet (bottom sheet / modal) ──────── */

function VerseDetailSheet({
  surahId,
  onClose,
}: {
  surahId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const h = t.profile.hifz;

  const memorized = useHifzStore((s) => s.memorized[surahId]) ?? EMPTY_ARR;
  const toggleVerse = useHifzStore((s) => s.toggleVerse);
  const toggleAllVerses = useHifzStore((s) => s.toggleAllVerses);
  const addRange = useHifzStore((s) => s.addRange);

  const totalVerses = SURAH_VERSE_COUNTS[surahId] ?? 0;
  const count = memorized.length;
  const pct = totalVerses > 0 ? Math.round((count / totalVerses) * 100) : 0;
  const name = getSurahName(surahId, locale);
  const checkState = count === 0 ? "none" : count === totalVerses ? "complete" : "partial";

  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const memorizedSet = useMemo(() => new Set(memorized), [memorized]);

  const handleAddRange = useCallback(() => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (from >= 1 && to >= from && to <= totalVerses) {
      addRange(surahId, from, to);
      setRangeFrom("");
      setRangeTo("");
    }
  }, [rangeFrom, rangeTo, surahId, totalVerses, addRange]);

  const backdropRef = useRef<HTMLDivElement>(null);

  // ESC ile kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-150" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-[var(--color-surface)] rounded-t sm:rounded overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-surface)] px-4 pb-3 pt-2 sm:pt-4">
          <div className="flex items-center gap-3 mb-3">
            <span className={`shrink-0 w-10 h-10 rounded border flex items-center justify-center text-xs font-bold tabular-nums ${
              checkState === "complete"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
            }`}>
              {surahId}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {count}/{totalVerses} {h.verses}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors shrink-0"
              aria-label={t.common.close}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Progress bar + action row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[var(--color-border)]/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold shrink-0 ${checkState === "complete" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
              %{pct}
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3 border-b border-[var(--color-border)] pb-3">
            <button
              type="button"
              onClick={() => toggleAllVerses(surahId)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                checkState === "complete"
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
              }`}
            >
              {checkState === "complete" ? h.removeAll : h.selectAll}
            </button>
            <div className="flex items-center gap-1 flex-1">
              <input
                type="number"
                min={1}
                max={totalVerses}
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                placeholder={h.from}
                className="w-full px-2 py-2 text-xs rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-center"
              />
              <span className="text-[0.65rem] text-[var(--color-text-secondary)] shrink-0">-</span>
              <input
                type="number"
                min={1}
                max={totalVerses}
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                placeholder={h.to}
                className="w-full px-2 py-2 text-xs rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-center"
              />
              <button
                type="button"
                onClick={handleAddRange}
                disabled={!rangeFrom || !rangeTo}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-30 transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-4 pt-3" style={{ maxHeight: "calc(85vh - 200px)" }}>
          {/* Ayet grid */}
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: totalVerses }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVerse(surahId, v)}
                className={`aspect-square flex items-center justify-center text-[0.65rem] font-medium rounded-lg transition-colors ${
                  memorizedSet.has(v)
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/15 active:bg-[var(--color-accent)]/25"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Seçili aralık özeti */}
          {memorized.length > 0 && memorized.length < totalVerses && (
            <p className="text-[0.65rem] text-[var(--color-text-secondary)] text-center mt-3">
              {versesToRangeText(memorized, totalVerses, h.allVersesSelected)}
            </p>
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

/* ── Ana bileşen ───────────────────────────────────── */

export function HifzStatus() {
  const { t } = useTranslation();
  const memorized = useHifzStore((s) => s.memorized);

  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [detailSurah, setDetailSurah] = useState<number | null>(null);

  const stats = useMemo(() => computeHifzStats(memorized), [memorized]);

  const surahIds = useMemo(() => {
    if (!selectedJuz) return Array.from({ length: 114 }, (_, i) => i + 1);
    const [start, end] = JUZ_SURAH_RANGES[selectedJuz - 1];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [selectedJuz]);

  const h = t.profile.hifz;

  const summaryText = useMemo(() => {
    if (stats.activeSurahs === 0) return h.empty;
    const parts: string[] = [];
    if (stats.completeSurahs > 0)
      parts.push(h.completeSurahs.replace("{n}", String(stats.completeSurahs)));
    if (stats.activeSurahs > stats.completeSurahs)
      parts.push(h.partialSurahs.replace("{n}", String(stats.activeSurahs - stats.completeSurahs)));
    parts.push(`${stats.totalVerses} ${h.verses} (%${stats.percentage})`);
    return parts.join(" · ");
  }, [stats, h]);

  // Juz scroll container
  const juzScrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mb-6">
      {/* Baslik karti */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface)]/80"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <ProgressRing percentage={stats.percentage} size={48} />
              <span className="absolute text-[0.6rem] font-bold text-[var(--color-accent)]">
                {stats.percentage > 0 ? `%${stats.percentage}` : ""}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{h.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{summaryText}</p>
            </div>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round"
            className={`text-[var(--color-text-secondary)] shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="relative z-10 mt-2 p-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
          {/* Üst özet: ring + istatistikler yan yana */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex items-center justify-center shrink-0">
              <ProgressRing percentage={stats.percentage} size={88} strokeWidth={6} />
              <div className="absolute text-center">
                <span className="text-lg font-bold text-[var(--color-accent)]">%{stats.percentage}</span>
                <p className="text-[0.55rem] text-[var(--color-text-secondary)]">{stats.totalVerses}/{TOTAL_VERSES}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {stats.completeSurahs > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                  <span className="text-xs">{h.completeSurahs.replace("{n}", String(stats.completeSurahs))}</span>
                </div>
              )}
              {stats.activeSurahs > stats.completeSurahs && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-secondary)] shrink-0" />
                  <span className="text-xs">{h.partialSurahs.replace("{n}", String(stats.activeSurahs - stats.completeSurahs))}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border)] shrink-0" />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {114 - stats.activeSurahs} {h.notStarted}
                </span>
              </div>
            </div>
          </div>

          {/* Cüz filtreleme — horizontal scroll */}
          <div className="mb-3">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1.5">{h.filterByJuz}</span>
            <div ref={juzScrollRef} className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedJuz(null)}
                className={`px-2.5 py-1 text-[0.65rem] rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  !selectedJuz
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                }`}
              >
                {h.allSurahs}
              </button>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const [start, end] = JUZ_SURAH_RANGES[juz - 1];
                const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                const complete = ids.filter(
                  (id) => (memorized[id]?.length ?? 0) === (SURAH_VERSE_COUNTS[id] ?? 0),
                ).length;
                const hasAny = ids.some((id) => (memorized[id]?.length ?? 0) > 0);
                const allComplete = complete === ids.length;

                return (
                  <button
                    key={juz}
                    type="button"
                    onClick={() => setSelectedJuz(selectedJuz === juz ? null : juz)}
                    className={`px-2.5 py-1 text-[0.65rem] rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                      selectedJuz === juz
                        ? "bg-[var(--color-accent)] text-white"
                        : allComplete
                          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                          : hasAny
                            ? "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                    }`}
                  >
                    {juz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sure kartları — grid */}
          <div className="grid grid-cols-2 gap-2">
            {surahIds.map((id) => (
              <SurahCard
                key={id}
                surahId={id}
                onOpen={() => setDetailSurah(id)}
              />
            ))}
          </div>

          {/* Alt ipucu */}
          <p className="text-[0.6rem] text-[var(--color-text-secondary)] text-center mt-3">{h.hint}</p>
        </div>
      )}

      {/* Ayet detay sheet */}
      {detailSurah !== null && (
        <VerseDetailSheet
          surahId={detailSurah}
          onClose={() => setDetailSurah(null)}
        />
      )}
    </section>
  );
}
