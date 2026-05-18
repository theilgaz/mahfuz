/**
 * Home — featured surah (continue reading) + günün ayeti + haftalık seri + son yer imleri.
 */

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useReadingStore } from "~/stores/reading.store";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useSurahs } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import {
  streakQueryOptions,
  weeklySummaryQueryOptions,
  readingGoalQueryOptions,
} from "~/hooks/useHabitQuery";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { DailyVerseCard } from "~/components/DailyVerseCard";
import { WeeklyChart } from "~/components/habit/WeeklyChart";
import { Ornament } from "./Ornament";
import { MuIcons } from "./icons";

export function HomeHero() {
  return (
    <>
      <FeaturedSurah />

      <div className="mu-rule">
        <Ornament />
      </div>

      <DailyVerseSection />

      <WeeklyStreakSection />

      <RecentBookmarksSection />
    </>
  );
}

function FeaturedSurah() {
  const { t, locale } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const { data: surahs } = useSurahs();

  const surah = lastPosition
    ? surahs.find((s) => s.id === lastPosition.surahId)
    : surahs.find((s) => s.id === 67); // default: Mulk

  if (!surah) return null;

  const pct = lastPosition
    ? Math.round((lastPosition.ayahNumber / surah.ayahCount) * 100)
    : 0;

  const linkProps = { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(surah.id) } };

  return (
    <section className="mu-feature">
      <p className="mu-eyebrow">
        {lastPosition ? (t.home?.lastRead ?? "Son okunan") : (t.home?.suggested ?? "Önerilen")}
      </p>
      <p className="mu-feat-arabic" dir="rtl">
        سُورَةُ {surah.nameArabic}
      </p>
      <h2 className="mu-feat-title">
        {getSurahName(surah.id, locale) || surah.nameSimple}
        <span className="mu-muted"> — {getSurahMeaning(surah.id, locale)}</span>
      </h2>
      <p className="mu-feat-meta">
        {surah.ayahCount} {t.surahList?.verses ?? "ayet"} · {surah.revelation === "makkah" ? "Mekki" : "Medeni"}
      </p>
      {lastPosition && (
        <div className="mu-feat-pbar" aria-label={`%${pct}`}>
          <span style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
      )}
      <Link {...linkProps} className="mu-link-arrow">
        {lastPosition ? (t.home?.continueBtn ?? "Devam et") : (t.home?.startBtn ?? "Okumaya başla")}
        {MuIcons.arrowRight}
      </Link>
    </section>
  );
}

function DailyVerseSection() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12 text-center">
      <DailyVerseCard />
    </section>
  );
}

function WeeklyStreakSection() {
  const { t } = useTranslation();
  const { data: weekly } = useQuery(weeklySummaryQueryOptions());
  const { data: goal } = useQuery(readingGoalQueryOptions());
  const { data: streak } = useQuery(streakQueryOptions());

  if (!weekly || weekly.length === 0) return null;

  const totalPages = weekly.reduce((sum, d) => sum + d.pagesRead, 0);
  if (totalPages === 0 && (streak?.currentStreak ?? 0) === 0) return null;

  const dailyTarget = goal?.dailyTargetPages ?? 1;
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12">
      <div className="flex items-baseline justify-between mb-3">
        <p className="mu-eyebrow" style={{ margin: 0 }}>
          {t.home?.weeklyTitle ?? "Haftalık seri"}
        </p>
        {currentStreak > 0 && (
          <span className="text-xs text-[var(--color-text-secondary)]">
            {currentStreak} {t.home?.dayStreak ?? "gün"}
          </span>
        )}
      </div>
      <WeeklyChart days={weekly} dailyTarget={dailyTarget} />
    </section>
  );
}

function RecentBookmarksSection() {
  const { t, locale } = useTranslation();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const { data: surahs } = useSurahs();

  if (!bookmarks || bookmarks.length === 0) return null;

  const recent = [...bookmarks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-16">
      <div className="flex items-baseline justify-between mb-3">
        <p className="mu-eyebrow" style={{ margin: 0 }}>
          {t.hub?.bookmarks ?? "Yer imleri"}
        </p>
        <Link to="/bookmarks" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--mu-accent-ink)] transition-colors">
          {t.home?.viewAll ?? "Tümü"}
        </Link>
      </div>

      <ul className="rounded border border-[var(--color-border)] divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
        {recent.map((bm) => {
          const surah = surahs.find((s) => s.id === bm.surahId);
          const name = getSurahName(bm.surahId, locale) || surah?.nameSimple || `${bm.surahId}`;
          return (
            <li key={`${bm.surahId}:${bm.ayahNumber}`}>
              <Link
                to="/surah/$surahSlug"
                params={{ surahSlug: surahSlug(bm.surahId) }}
                search={{ ayah: bm.ayahNumber }}
                className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-sm hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="w-7 h-7 rounded-md bg-[var(--color-bg)] flex items-center justify-center text-[11px] font-medium text-[var(--color-text-secondary)] shrink-0">
                  {bm.surahId}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-medium">{name}</span>
                  <span className="text-[var(--color-text-secondary)]"> · {t.common?.verse ?? "Ayet"} {bm.ayahNumber}</span>
                </span>
                {surah?.nameArabic && (
                  <span className="text-sm shrink-0 text-[var(--color-text-secondary)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                    {surah.nameArabic}
                  </span>
                )}
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
                  {bm.pageNumber}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
