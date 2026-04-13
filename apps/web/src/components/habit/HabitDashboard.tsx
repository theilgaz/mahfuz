/**
 * Alışkanlık özeti — header satırında inline gösterilir.
 * [streak] 3 · 2/1s · Hatim ██░░ 3/604
 */

import { Suspense, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  streakQueryOptions,
  activeHatimQueryOptions,
  readingGoalQueryOptions,
  useSetReadingGoal,
} from "~/hooks/useHabitQuery";

const ANON_USER = "anonymous";
const TOTAL_PAGES = 604;
const GOAL_OPTIONS = [1, 2, 3, 5, 10, 20];

export function HabitDashboard() {
  return (
    <Suspense fallback={null}>
      <HabitDashboardInner />
    </Suspense>
  );
}

function HabitDashboardInner() {
  const userId = ANON_USER;

  const { data: streak } = useQuery(streakQueryOptions(userId));
  const { data: hatim } = useQuery(activeHatimQueryOptions(userId));
  const { data: goal } = useQuery(readingGoalQueryOptions(userId));
  const setGoalMutation = useSetReadingGoal(userId);

  const dailyTarget = goal?.dailyTargetPages ?? 1;
  const currentStreak = streak?.currentStreak ?? 0;
  const todayPages = streak?.todayPages ?? 0;
  const lastPage = hatim?.lastPage ?? 0;
  const pct = Math.round((lastPage / TOTAL_PAGES) * 100);

  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!showGoalPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowGoalPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showGoalPicker]);

  if (!streak && !hatim) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
      {/* Streak */}
      <span className="leading-none flex items-center">
        {currentStreak > 0 ? (
          <svg className="w-3 h-3 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C10 5.5 6.5 7 6.5 12a5.5 5.5 0 0011 0C17.5 7 14 5.5 12 2zm0 14a3 3 0 01-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5a3 3 0 01-3 3z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
      </span>
      <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
        {currentStreak}
      </span>

      <span className="opacity-30">·</span>

      {/* Today — tıklanınca hedef seçici */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowGoalPicker(!showGoalPicker)}
          className="tabular-nums rounded px-1 -mx-1 hover:bg-[var(--color-surface)] transition-colors"
          title={`Bugün ${todayPages} sayfa okudun, günlük hedef ${dailyTarget} sayfa. Tıkla → hedef değiştir`}
        >
          {todayPages}/{dailyTarget}s
        </button>

        {showGoalPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
            <p className="text-[10px] text-[var(--color-text-secondary)] mb-1.5 px-1 whitespace-nowrap">
              Günlük hedef (sayfa)
            </p>
            <div className="flex gap-1">
              {GOAL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setGoalMutation.mutate(n);
                    setShowGoalPicker(false);
                  }}
                  className={`min-w-7 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                    n === dailyTarget
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg)] hover:bg-[var(--color-border)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hatim mini bar */}
      {hatim && (
        <>
          <span className="opacity-30">·</span>
          <span className="cursor-default" title={`Hatim: ${lastPage}/${TOTAL_PAGES} sayfa (%${pct})`}>
            <span className="flex items-center gap-1">
              <span>Hatim</span>
              <span className="inline-flex h-1 w-8 overflow-hidden rounded-full bg-[var(--color-border)]">
                <span
                  className="h-full rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </span>
              <span className="tabular-nums">{lastPage}/{TOTAL_PAGES}</span>
            </span>
          </span>
        </>
      )}
    </div>
  );
}
