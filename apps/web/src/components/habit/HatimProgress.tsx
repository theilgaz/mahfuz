/**
 * Hatim ilerleme kartı — aktif hatim varsa gösterilir.
 */

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

  return (
    <div className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Hatim</p>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {lastPage}/{TOTAL_PAGES} sayfa
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
          <span>~{estimatedDays} gün kaldı</span>
        )}
      </div>
    </div>
  );
}

/**
 * Hatim yokken gösterilen başlatma kartı.
 */
export function HatimStartCard({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-left"
    >
      <p className="text-sm font-medium">Hatim Başlat</p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
        604 sayfa, kendi hızında
      </p>
    </button>
  );
}
