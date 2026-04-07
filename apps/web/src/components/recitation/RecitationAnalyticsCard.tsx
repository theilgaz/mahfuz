/**
 * Kıraet analitik özeti — profil sayfasında gösterilir.
 * Hata örüntülerini ve ilerlemeyi görselleştirir.
 */

import { useRecitationStore } from "~/stores/recitation.store";

export function RecitationAnalyticsCard() {
  const matchHistory = useRecitationStore((s) => s.matchHistory);
  const totalMatches = matchHistory.length;

  if (totalMatches === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Kıraet Analitikleri</h3>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Tilavet seansı başlattığında burada istatistiklerin görünür.
        </p>
      </div>
    );
  }

  // Aggregate surah hits from match history
  const surahMap = new Map<number, number>();
  for (const match of matchHistory) {
    const surahId = match.surah ?? 0;
    if (surahId) {
      surahMap.set(surahId, (surahMap.get(surahId) ?? 0) + 1);
    }
  }

  const topSurahs = Array.from(surahMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const avgScore =
    matchHistory.reduce((sum, m) => sum + ((m as any).score ?? 0), 0) /
    totalMatches;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Kıraet Analitikleri</h3>

      {/* Özet istatistikler */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-[var(--color-text-primary)]">{totalMatches}</p>
          <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Tanınan Ayet</p>
        </div>
        <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-[var(--color-text-primary)]">
            {avgScore > 0 ? `${Math.round(avgScore * 100)}%` : "—"}
          </p>
          <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Ort. Skor</p>
        </div>
      </div>

      {/* En çok okunan sureler */}
      {topSurahs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">En çok okunan sureler</p>
          <div className="space-y-1.5">
            {topSurahs.map(([surahId, count], i) => (
              <div key={surahId} className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-secondary)] w-4">{i + 1}.</span>
                <span className="flex-1 text-sm text-[var(--color-text-primary)]">
                  Sure {surahId}
                </span>
                <span className="text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">
                  {count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
