/**
 * İstatistikler sayfası — /stats
 * Okuma durumu, ezber ilerlemesi, yer imleri, son konumlar.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useHifzStore, computeHifzStats, SURAH_VERSE_COUNTS, TOTAL_VERSES } from "~/stores/hifz.store";
import { useReadingStore } from "~/stores/reading.store";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { surahSlug } from "~/lib/surah-slugs";
import { TOTAL_CHAPTERS } from "@mahfuz/shared";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/stats")({
  head: () => staticHead("stats"),
  component: StatsPage,
});

function StatsPage() {
  const { t, locale } = useTranslation();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const memorized = useHifzStore((s) => s.memorized);
  const recentPositions = useReadingStore((s) => s.recentPositions);

  const hifzStats = useMemo(() => computeHifzStats(memorized), [memorized]);

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

  const isEmpty = bookmarks.length === 0 && hifzStats.totalVerses === 0 && recentPositions.length === 0;

  return (
    <div className="mu-statspage max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="shrink-0 p-1.5 -ml-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 15l-5-5 5-5" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">{t.stats.title}</h1>
      </div>

      {/* ── Empty state ─────────────────────────────── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{t.stats.empty}</p>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* ── Overview cards ───────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label={t.stats.bookmarks}
              value={bookmarks.length}
              icon={<BookmarkIcon />}
            />
            <StatCard
              label={t.stats.recentlyRead}
              value={recentPositions.length}
              suffix="/ 5"
              icon={<BookOpenIcon />}
            />
            <StatCard
              label={t.stats.memorizedVerses}
              value={hifzStats.totalVerses}
              suffix={`/ ${TOTAL_VERSES}`}
              icon={<BrainIcon />}
            />
            <StatCard
              label={t.stats.completeSurahs}
              value={hifzStats.completeSurahs}
              suffix={`/ ${TOTAL_CHAPTERS}`}
              icon={<StarIcon />}
            />
          </div>

          {/* ── Memorization progress ────────────────── */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              {t.stats.memorization}
            </h2>
            <div className="py-3 px-1 border-b border-[var(--color-border)]">
              <div className="flex items-end justify-between mb-3">
                <span className="text-3xl font-bold text-[var(--color-accent)] tabular-nums">{hifzStats.percentage}%</span>
                <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                  {hifzStats.totalVerses} / {TOTAL_VERSES} {t.stats.versesUnit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${Math.min(hifzStats.percentage, 100)}%` }}
                />
              </div>
              {hifzStats.activeSurahs > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-2.5">
                  {t.stats.activeSurahsSummary
                    .replace("{active}", String(hifzStats.activeSurahs))
                    .replace("{complete}", String(hifzStats.completeSurahs))}
                </p>
              )}
            </div>
          </section>

          {/* ── Active surahs ────────────────────────── */}
          {activeSurahs.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                {t.stats.surahProgress}
              </h2>
              <div>
                {activeSurahs.map((s) => (
                  <div key={s.surahId} className="flex items-center gap-3 py-2.5 px-1 border-b border-[var(--color-border)]">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0 tabular-nums">
                      {s.surahId}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">{s.name}</span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">{s.memorized}/{s.total}</span>
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

          {/* ── Top bookmarked surahs ────────────────── */}
          {bookmarksBySurah.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                {t.stats.topBookmarked}
              </h2>
              <div>
                {bookmarksBySurah.map((s) => (
                  <div key={s.surahId} className="flex items-center justify-between py-2.5 px-1 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0 tabular-nums">
                        {s.surahId}
                      </span>
                      <span className="text-xs font-medium truncate">{s.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium shrink-0 tabular-nums">
                      {s.count} {t.stats.versesUnit}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Recent positions ──────────────────────── */}
          {recentPositions.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                {t.stats.recentPositions}
              </h2>
              <div>
                {recentPositions.map((pos, i) => (
                  <Link
                    key={`${pos.surahId}-${i}`}
                    to="/surah/$surahSlug"
                    params={{ surahSlug: surahSlug(pos.surahId) }}
                    search={{ ayah: pos.ayahNumber }}
                    className="flex items-center gap-3 py-2.5 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-accent)]/3 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0 tabular-nums">
                      {pos.surahId}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {getSurahName(pos.surahId, locale) || `Sure ${pos.surahId}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0 tabular-nums">
                      {t.common.verse} {pos.ayahNumber} · {t.stats.page} {pos.pageNumber}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-secondary)] shrink-0">
                      <path d="M5.25 3.5l3.5 3.5-3.5 3.5" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────── */

function StatCard({ label, value, suffix, icon }: { label: string; value: number; suffix?: string; icon: React.ReactNode }) {
  return (
    <div className="py-3 px-1 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center text-[var(--color-accent)] shrink-0">
          {icon}
        </div>
        <span className="text-[11px] text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        {suffix && <span className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">{suffix}</span>}
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────── */

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 2.5h7a1 1 0 011 1v10l-4.5-3-4.5 3v-10a1 1 0 011-1z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3.5c-1.5-1.5-4-1.5-5.5-1v10c1.5-.5 4-.5 5.5 1m0-10c1.5-1.5 4-1.5 5.5-1v10c-1.5-.5-4-.5-5.5 1" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13V8m0 0C8 5.5 6 4 4.5 4S2 5.5 2.5 7c.3.9 1 1.5 2 1.5M8 8c0-2.5 2-4 3.5-4S14 5.5 13.5 7c-.3.9-1 1.5-2 1.5" />
      <circle cx="8" cy="3" r="1" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.2L8 11.3l-3.7 2.1.7-4.2-3-2.9 4.2-.7z" />
    </svg>
  );
}
