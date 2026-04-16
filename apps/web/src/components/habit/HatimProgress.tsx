/**
 * Hatim ilerleme kartı — aktif hatim varsa gösterilir.
 */

import { useTranslation } from "~/hooks/useTranslation";

const TOTAL_PAGES = 604;

interface HatimProgressProps {
  lastPage: number;
  startedAt: Date;
  onStart?: () => void;
}

export function HatimProgress({ lastPage, startedAt, onStart }: HatimProgressProps) {
  const progress = lastPage / TOTAL_PAGES;
  const pct = Math.round(progress * 100);

  // Kaç gündür devam ediyor
  const daysSinceStart = Math.max(
    1,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Tahmini bitiş
  const pagesPerDay = lastPage / daysSinceStart;
  const remainingPages = TOTAL_PAGES - lastPage;
  const estimatedDays = pagesPerDay > 0 ? Math.ceil(remainingPages / pagesPerDay) : null;

  const { t } = useTranslation();

  return (
    <div className="px-4 py-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{t.habit.hatim}</p>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.habit.pagesProgress.replace("{current}", String(lastPage)).replace("{total}", String(TOTAL_PAGES))}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>%{pct}</span>
        {estimatedDays && estimatedDays > 0 && (
          <span>{t.habit.daysRemaining.replace("{days}", String(estimatedDays))}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Hatim yokken gösterilen başlatma kartı.
 */
export function HatimStartCard({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onStart}
      className="w-full px-4 py-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-left"
    >
      <p className="text-sm font-medium">{t.habit.startHatim}</p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
        {t.habit.startHatimDesc}
      </p>
    </button>
  );
}
