/**
 * Streak kartı — ana sayfada gösterilir.
 * Minimal: sadece günlük seri + bugünün ilerlemesi.
 * Hedefe tıklayınca hedef ayarlama açılır.
 */

import { useState } from "react";

interface StreakCardProps {
  currentStreak: number;
  todayPages: number;
  dailyTarget: number;
  onSetGoal?: (pages: number) => void;
}

const GOAL_OPTIONS = [1, 2, 3, 5, 10, 20];

export function StreakCard({ currentStreak, todayPages, dailyTarget, onSetGoal }: StreakCardProps) {
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const progress = Math.min(todayPages / dailyTarget, 1);

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Streak */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg">
            {currentStreak > 0 ? "\u{1F525}" : "\u{1F4D6}"}
          </span>
          <span className="text-sm font-medium">
            {currentStreak > 0
              ? `${currentStreak} günlük seri`
              : "Bugün başla"}
          </span>
        </div>

        <span className="text-[var(--color-border)]">&middot;</span>

        {/* Bugünün ilerlemesi */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setShowGoalPicker(!showGoalPicker)}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            Bugün: {todayPages}/{dailyTarget} sayfa
          </button>

          {/* Mini progress bar */}
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden max-w-20">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hedef ayarlama */}
      {showGoalPicker && onSetGoal && (
        <div className="px-4 pb-3 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-secondary)] py-2">Günlük hedef:</p>
          <div className="flex gap-2">
            {GOAL_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => {
                  onSetGoal(n);
                  setShowGoalPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  n === dailyTarget
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {n} sayfa
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
