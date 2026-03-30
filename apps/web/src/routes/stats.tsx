/**
 * İstatistikler sayfası — /stats
 * Okuma durumu, ezber ilerlemesi, yer imleri, son konumlar.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useHifzStore, computeHifzStats, SURAH_VERSE_COUNTS, TOTAL_VERSES } from "~/stores/hifz.store";
import { useReadingStore } from "~/stores/reading.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { TOTAL_CHAPTERS } from "@mahfuz/shared";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const { locale } = useTranslation();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const memorized = useHifzStore((s) => s.memorized);
  const recentPositions = useReadingStore((s) => s.recentPositions);

  const hifzStats = useMemo(() => computeHifzStats(memorized), [memorized]);

  // Bookmark stats
  const bookmarksBySurah = useMemo(() => {
    const map: Record<number, number> = {};
    for (const bm of bookmarks) {
      map[bm.surahId] = (map[bm.surahId] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({
        surahId: Number(id),
        name: getSurahName(Number(id), locale) || `Sure ${id}`,
        count,
      }));
  }, [bookmarks, locale]);

  // Surahs with memorization progress
  const activeSurahs = useMemo(() => {
    return Object.entries(memorized)
      .filter(([, verses]) => verses.length > 0)
      .map(([id, verses]) => {
        const surahId = Number(id);
        const total = SURAH_VERSE_COUNTS[surahId] ?? 1;
        return {
          surahId,
          name: getSurahName(surahId, locale) || `Sure ${surahId}`,
          memorized: verses.length,
          total,
          pct: Math.round((verses.length / total) * 100),
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);
  }, [memorized, locale]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-lg font-semibold mb-6">İstatistikler</h1>

      {/* ── Overview cards ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="Yer İmi" value={bookmarks.length} icon="🔖" />
        <StatCard label="Son Okunan" value={recentPositions.length} suffix={`/ ${5}`} icon="📖" />
        <StatCard label="Ezber Ayet" value={hifzStats.totalVerses} suffix={`/ ${TOTAL_VERSES}`} icon="🧠" />
        <StatCard label="Tam Ezber Sure" value={hifzStats.completeSurahs} suffix={`/ ${TOTAL_CHAPTERS}`} icon="⭐" />
      </div>

      {/* ── Hatim progress ───────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Ezber İlerlemesi</h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--color-accent)]">{hifzStats.percentage}%</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {hifzStats.totalVerses} / {TOTAL_VERSES} ayet
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${Math.min(hifzStats.percentage, 100)}%` }}
            />
          </div>
          {hifzStats.activeSurahs > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              {hifzStats.activeSurahs} surede çalışma var, {hifzStats.completeSurahs} sure tamamlandı
            </p>
          )}
        </div>
      </section>

      {/* ── Active surahs (memorization) ─────────────── */}
      {activeSurahs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Ezber Durumu (Sureler)</h2>
          <div className="space-y-2">
            {activeSurahs.map((s) => (
              <div key={s.surahId} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2.5">
                <span className="text-xs text-[var(--color-text-secondary)] w-6 text-right shrink-0">{s.surahId}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{s.memorized}/{s.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${s.pct}%`,
                        backgroundColor: s.pct === 100 ? "var(--color-accent)" : "var(--color-text-secondary)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Top bookmarked surahs ────────────────────── */}
      {bookmarksBySurah.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">En Çok İmlenen Sureler</h2>
          <div className="space-y-1.5">
            {bookmarksBySurah.map((s) => (
              <div key={s.surahId} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-[var(--color-accent)] font-semibold">{s.count} ayet</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent positions ─────────────────────────── */}
      {recentPositions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Son Okunanlar</h2>
          <div className="space-y-1.5">
            {recentPositions.map((pos, i) => (
              <div key={`${pos.surahId}-${i}`} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5">
                <span className="text-sm font-medium">
                  {getSurahName(pos.surahId, locale) || `Sure ${pos.surahId}`}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Ayet {pos.ayahNumber} · Sayfa {pos.pageNumber}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {bookmarks.length === 0 && hifzStats.totalVerses === 0 && recentPositions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Henüz istatistik yok. Okumaya başlayın!
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, icon }: { label: string; value: number; suffix?: string; icon: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold">{value}</span>
        {suffix && <span className="text-xs text-[var(--color-text-secondary)]">{suffix}</span>}
      </div>
    </div>
  );
}
