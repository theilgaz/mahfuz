import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useState, useEffect, useMemo, useCallback } from "react";
import { memorizationRepository } from "@mahfuz/db";
import type { ConfidenceLevel } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { useAddVerses } from "~/hooks/useMemorization";

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

const CONFIDENCE_BADGE_STYLES: Record<
  ConfidenceLevel,
  { bg: string; text: string }
> = {
  struggling: { bg: "bg-red-500/10", text: "text-red-500" },
  learning: { bg: "bg-orange-500/10", text: "text-orange-500" },
  familiar: { bg: "bg-yellow-500/10", text: "text-yellow-500" },
  confident: { bg: "bg-blue-500/10", text: "text-blue-500" },
  mastered: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
};

interface SurahSelectorProps {
  userId: string;
}

interface SurahProgress {
  total: number;
  byConfidence: Partial<Record<ConfidenceLevel, number>>;
}

function getDominantConfidence(
  byConfidence: Partial<Record<ConfidenceLevel, number>>,
): ConfidenceLevel {
  let max = 0;
  let dominant: ConfidenceLevel = "learning";
  for (const [level, count] of Object.entries(byConfidence)) {
    if (level === "mastered") continue;
    if (count && count > max) {
      max = count;
      dominant = level as ConfidenceLevel;
    }
  }
  return dominant;
}

function getQuickAddPresets(versesCount: number): number[] {
  if (versesCount <= 5) return [versesCount];
  if (versesCount <= 10) return [5, versesCount];
  if (versesCount <= 20) return [5, 10, versesCount];
  if (versesCount <= 50) return [5, 10, 20];
  return [5, 10, 20];
}

function Column({
  title,
  count,
  colorDot,
  tabIndex,
  activeTab,
  children,
  headerExtra,
  emptyMessage,
}: {
  title: string;
  count: number;
  colorDot: string;
  tabIndex: 0 | 1 | 2;
  activeTab: 0 | 1 | 2;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  emptyMessage: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] flex flex-col ${
        activeTab !== tabIndex ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--theme-divider)] px-4 py-3">
        <span className={`h-3 w-1 rounded-full ${colorDot}`} />
        <span className="text-[13px] font-semibold text-[var(--theme-text)]">
          {title}
        </span>
        <span className="rounded-full bg-[var(--theme-hover-bg)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
          {count}
        </span>
      </div>
      {headerExtra}
      <div className="md:max-h-[600px] md:overflow-y-auto divide-y divide-[var(--theme-divider)]">
        {count === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-[var(--theme-text-tertiary)]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function SurahSelector({ userId }: SurahSelectorProps) {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const { t } = useTranslation();
  const { addVerses, isAdding } = useAddVerses(userId);
  const [quickAddingFor, setQuickAddingFor] = useState<string | null>(null);
  const [quickAddedFor, setQuickAddedFor] = useState<string | null>(null);

  const [progress, setProgress] = useState<Map<number, SurahProgress>>(
    new Map(),
  );

  useEffect(() => {
    async function loadProgress() {
      const allCards = await memorizationRepository.getAllCards(userId);
      const map = new Map<number, SurahProgress>();

      for (const card of allCards) {
        const surahId = parseInt(card.verseKey.split(":")[0]);
        let p = map.get(surahId);
        if (!p) {
          p = { total: 0, byConfidence: {} };
          map.set(surahId, p);
        }
        p.total++;
        p.byConfidence[card.confidence] =
          (p.byConfidence[card.confidence] || 0) + 1;
      }

      setProgress(map);
    }
    loadProgress();
  }, [userId]);

  const completedChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      return p && p.byConfidence.mastered === ch.verses_count;
    });
  }, [chapters, progress]);

  const inProgressChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      return p && p.total > 0 && p.byConfidence.mastered !== ch.verses_count;
    });
  }, [chapters, progress]);

  const notStartedChapters = useMemo(() => {
    const q = search.toLowerCase().trim();
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      if (p && p.total > 0) return false;
      if (!q) return true;
      return (
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        String(ch.id).startsWith(q)
      );
    });
  }, [chapters, progress, search]);

  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
  useEffect(() => {
    if (hasAutoSwitched || progress.size === 0) return;
    if (inProgressChapters.length > 0) {
      setActiveTab(1);
    } else if (completedChapters.length > 0) {
      setActiveTab(2);
    }
    setHasAutoSwitched(true);
  }, [progress.size, inProgressChapters.length, completedChapters.length, hasAutoSwitched]);

  const [removingId, setRemovingId] = useState<number | null>(null);

  const removeMemorization = useCallback(
    async (ch: (typeof chapters)[number]) => {
      setRemovingId(ch.id);
      try {
        await memorizationRepository.deleteCardsBySurah(userId, ch.id);
        setProgress((prev) => {
          const next = new Map(prev);
          next.delete(ch.id);
          return next;
        });
        setExpandedId(null);
      } finally {
        setRemovingId(null);
      }
    },
    [userId],
  );

  const handleQuickAdd = useCallback(
    async (ch: (typeof chapters)[number], count: number) => {
      const key = `${ch.id}:${count}`;
      setQuickAddingFor(key);
      try {
        const verseNumbers = Array.from({ length: count }, (_, i) => i + 1);
        await addVerses(ch.id, verseNumbers);
        setProgress((prev) => {
          const next = new Map(prev);
          const existing = next.get(ch.id) || { total: 0, byConfidence: {} };
          next.set(ch.id, {
            total: existing.total + count,
            byConfidence: {
              ...existing.byConfidence,
              learning: (existing.byConfidence.learning || 0) + count,
            },
          });
          return next;
        });
        setQuickAddedFor(key);
        setTimeout(() => setQuickAddedFor(null), 2000);
      } finally {
        setQuickAddingFor(null);
      }
    },
    [addVerses],
  );

  const renderNotStartedRow = (ch: (typeof chapters)[number]) => {
    const isExpanded = expandedId === ch.id;

    return (
      <div key={ch.id}>
        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : ch.id)}
          className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-[var(--theme-hover-bg)] cursor-pointer text-left"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]">
            {ch.id}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[var(--theme-text)]">
                {ch.name_simple}
              </span>
              <span className="text-[13px] text-[var(--theme-text-tertiary)]">
                {ch.name_arabic}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[12px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
              {ch.verses_count}
            </span>
            <span
              className={`text-[14px] text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 pt-0 animate-fade-in">
            {getQuickAddPresets(ch.verses_count).map((n) => {
              const key = `${ch.id}:${n}`;
              const isAll = n === ch.verses_count;
              const isAddingThis = quickAddingFor === key;
              const justAdded = quickAddedFor === key;
              const label = isAll
                ? t.memorize.surahSelector.allVerses.replace("{n}", String(n))
                : t.memorize.surahSelector.firstNVerses.replace("{n}", String(n));

              if (justAdded) {
                return (
                  <span
                    key={n}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {n} {t.memorize.surahSelector.quickAdded}
                  </span>
                );
              }

              return (
                <button
                  key={n}
                  type="button"
                  disabled={isAddingThis || isAdding}
                  onClick={() => handleQuickAdd(ch, n)}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)] disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {isAddingThis ? t.memorize.surahSelector.quickAdding : label}
                </button>
              );
            })}

            <Link
              to="/memorize/add/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.memorize.surahSelector.add}
            </Link>

            <Link
              to="/memorize/verify/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.memorize.surahSelector.markMastered}
            </Link>
          </div>
        )}
      </div>
    );
  };

  const renderInProgressRow = (ch: (typeof chapters)[number]) => {
    const p = progress.get(ch.id)!;
    const canAddMore = p.total < ch.verses_count;
    const isExpanded = expandedId === ch.id;

    return (
      <div key={ch.id}>
        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : ch.id)}
          className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-[var(--theme-hover-bg)] cursor-pointer text-left"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums bg-amber-500/15 text-amber-500">
            {ch.id}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[var(--theme-text)]">
                {ch.name_simple}
              </span>
              <span className="text-[13px] text-[var(--theme-text-tertiary)]">
                {ch.name_arabic}
              </span>
            </div>
            <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
              {(Object.keys(CONFIDENCE_COLORS) as ConfidenceLevel[]).map(
                (level) => {
                  const count = p.byConfidence[level] || 0;
                  const pct = (count / ch.verses_count) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={level}
                      className={`${CONFIDENCE_COLORS[level]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                },
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[12px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
              {p.total}/{ch.verses_count}
            </span>
            {(() => {
              const dominant = getDominantConfidence(p.byConfidence);
              const style = CONFIDENCE_BADGE_STYLES[dominant];
              return (
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}
                >
                  {t.memorize.confidence[dominant]}
                </span>
              );
            })()}
            <span
              className={`text-[14px] text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 pt-0 animate-fade-in">
            <Link
              to="/memorize/progress/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              {t.memorize.surahSelector.progress}
            </Link>

            <Link
              to="/memorize/practice"
              search={{ surahId: ch.id }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              {t.memorize.practice.button}
            </Link>

            {canAddMore && (
              <Link
                to="/memorize/add/$surahId"
                params={{ surahId: String(ch.id) }}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t.memorize.surahSelector.add}
              </Link>
            )}

            <Link
              to="/memorize/verify/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.memorize.surahSelector.markMastered}
            </Link>

            <button
              type="button"
              disabled={removingId === ch.id}
              onClick={() => removeMemorization(ch)}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              {removingId === ch.id
                ? t.common.loading
                : t.memorize.surahSelector.removeMemorization}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCompletedRow = (ch: (typeof chapters)[number]) => {
    const isExpanded = expandedId === ch.id;

    return (
      <div key={ch.id}>
        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : ch.id)}
          className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-[var(--theme-hover-bg)] cursor-pointer text-left"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums bg-emerald-500/15 text-emerald-500">
            {ch.id}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[var(--theme-text)]">
                {ch.name_simple}
              </span>
              <span className="text-[13px] text-[var(--theme-text-tertiary)]">
                {ch.name_arabic}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
              ✓ {t.memorize.confidence.mastered}
            </span>
            <span
              className={`text-[14px] text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 pt-0 animate-fade-in">
            <Link
              to="/memorize/progress/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              {t.memorize.surahSelector.progress}
            </Link>

            <button
              type="button"
              disabled={removingId === ch.id}
              onClick={() => removeMemorization(ch)}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              {removingId === ch.id
                ? t.common.loading
                : t.memorize.surahSelector.removeMemorization}
            </button>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { label: t.memorize.surahSelector.toMemorize, count: notStartedChapters.length },
    { label: t.memorize.surahSelector.inProgressSurahs, count: inProgressChapters.length },
    { label: t.memorize.surahSelector.completedSurahs, count: completedChapters.length },
  ] as const;

  return (
    <div>
      {/* Mobile tab bar */}
      <div className="flex gap-1 rounded-xl bg-[var(--theme-hover-bg)] p-1 mb-4 md:hidden">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveTab(i as 0 | 1 | 2)}
            className={`flex-1 rounded-lg px-2 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${
              activeTab === i
                ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm"
                : "text-[var(--theme-text-secondary)]"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Desktop: 3-col grid / Mobile: active tab only */}
      <div className="md:grid md:grid-cols-3 md:gap-4">
        <Column
          title={t.memorize.surahSelector.toMemorize}
          count={notStartedChapters.length}
          colorDot="bg-[var(--theme-text-quaternary)]"
          tabIndex={0}
          activeTab={activeTab}
          emptyMessage={t.memorize.surahSelector.noSurahsInColumn}
          headerExtra={
            <div className="px-4 py-2 border-b border-[var(--theme-divider)]">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
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
                  placeholder={t.memorize.surahSelector.searchPlaceholder}
                  className="w-full rounded-lg bg-[var(--theme-input-bg)] py-2 pl-9 pr-3 text-[13px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
                />
              </div>
            </div>
          }
        >
          {notStartedChapters.map((ch) => renderNotStartedRow(ch))}
        </Column>

        <Column
          title={t.memorize.surahSelector.inProgressSurahs}
          count={inProgressChapters.length}
          colorDot="bg-amber-500"
          tabIndex={1}
          activeTab={activeTab}
          emptyMessage={t.memorize.surahSelector.noSurahsInColumn}
        >
          {inProgressChapters.map((ch) => renderInProgressRow(ch))}
        </Column>

        <Column
          title={t.memorize.surahSelector.completedSurahs}
          count={completedChapters.length}
          colorDot="bg-emerald-500"
          tabIndex={2}
          activeTab={activeTab}
          emptyMessage={t.memorize.surahSelector.noSurahsInColumn}
        >
          {completedChapters.map((ch) => renderCompletedRow(ch))}
        </Column>
      </div>
    </div>
  );
}
