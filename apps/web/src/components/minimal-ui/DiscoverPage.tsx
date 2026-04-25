/**
 * Discover page — hybrid layout:
 *   1. Today card (hero) — daily verse, centered
 *   2. Streak strip — progress bar + week grid
 *   3. Action rows — Öğren / Oyna / Ezberle / Topluluk
 *   4. Collections — 2x2 card grid
 *   5. Topics — 2-col dot list
 */

import { Link, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSurahs, useDailyVerse } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { useHifzStore, computeHifzStats } from "~/stores/hifz.store";
import { useQuery } from "@tanstack/react-query";
import { streakQueryOptions, weeklySummaryQueryOptions } from "~/hooks/useHabitQuery";

/** Decode HTML entities */
function decodeEntities(text: string): string {
  if (!text || !text.includes("&")) return text;
  const el = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (!el) return text.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
  el.innerHTML = text;
  return el.value;
}

const COLLECTIONS = [
  { title: "Sabah & akşam", sub: "Günü açan ve kapatan sureler", items: [1, 36, 55, 67, 112, 113, 114] },
  { title: "Kısa sureler", sub: "Üç ile on ayet arası", items: [103, 108, 112, 110, 105, 94, 93] },
  { title: "Kıssalar", sub: "Peygamber anlatıları", items: [12, 19, 28, 18, 71, 21] },
  { title: "Rahmet", sub: "Merhamet ve bağışlama", items: [55, 36, 67, 93, 94, 1] },
];

const THEMES = [
  { t: "Tevhid" }, { t: "Sabır" }, { t: "Şükür" },
  { t: "Yaratılış" }, { t: "Adalet" }, { t: "İlim" },
  { t: "Ahiret" }, { t: "Dua" }, { t: "Rızık" },
];

const ACTIONS = [
  { key: "Learn", to: "/alifba" },
  { key: "Play", to: "/games" },
  { key: "Memorize", to: "/hifz" },
  { key: "Community", to: "/khatm" },
] as const;

export function DiscoverPage() {
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const { data: dailyVerse } = useDailyVerse(locale);
  const hub = t.hub as unknown as Record<string, string>;

  return (
    <div className="mu-discover">
      {/* 1. Today card */}
      <TodayCard dailyVerse={dailyVerse} locale={locale} hub={hub} />

      {/* 2. Streak */}
      <StreakStrip hub={hub} />

      {/* 3. Actions */}
      <section className="mu-disc-section">
        <p className="mu-eyebrow" style={{ marginBottom: 20 }}>
          {hub.journeyTitle ?? "Yolculuğun"}
        </p>
        <div className="mu-actions">
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: "1" }}
            className="mu-action-row"
          >
            <div>
              <div className="mu-action-name">{hub.featMushaf ?? "Matbu Mushaf Deneyimi"}</div>
              <div className="mu-action-desc">{hub.featMushafDesc ?? "Sayfa sayfa mushaf üzerinden oku"}</div>
            </div>
            <span className="mu-action-arrow" aria-hidden="true">{"\u2192"}</span>
          </Link>
          {ACTIONS.map((a) => {
            const titleKey = `feat${a.key}` as string;
            const descKey = `${titleKey}Desc` as string;
            return (
              <Link key={a.key} to={a.to} className="mu-action-row">
                <div>
                  <div className="mu-action-name">{hub[titleKey] ?? a.key}</div>
                  <div className="mu-action-desc">{hub[descKey] ?? ""}</div>
                </div>
                <span className="mu-action-arrow" aria-hidden="true">{"\u2192"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Collections */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">{hub.curatedTitle ?? "Derlemeler"}</h2>
        <div className="mu-coll-grid">
          {COLLECTIONS.map((c) => (
            <article key={c.title} className="mu-coll-card">
              <h3>{c.title}</h3>
              <p className="mu-coll-sub">{c.sub}</p>
              <ul>
                {c.items.map((n) => {
                  const s = surahs.find((x) => x.id === n);
                  if (!s) return null;
                  return (
                    <li key={n}>
                      <Link
                        to="/surah/$surahSlug"
                        params={{ surahSlug: surahSlug(n) }}
                        search={{ ayah: undefined }}
                        className="mu-coll-item"
                      >
                        <span className="mu-ci-num">{String(n).padStart(3, "0")}</span>
                        <span className="mu-ci-name">{getSurahName(n, locale) || s.nameSimple}</span>
                        <span className="mu-ci-ar" dir="rtl">{s.nameArabic}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Topics */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">{hub.topicsTitle ?? "Konular"}</h2>
        <div className="mu-topic-grid">
          {THEMES.map((theme) => (
            <Link
              key={theme.t}
              to="/search"
              search={{ q: theme.t }}
              className="mu-topic-item"
            >
              <span className="mu-topic-dot" aria-hidden="true" />
              <span className="mu-topic-name">{theme.t}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Today card ── */
function TodayCard({
  dailyVerse,
  locale,
  hub,
}: {
  dailyVerse: ReturnType<typeof useDailyVerse>["data"];
  locale: string;
  hub: Record<string, string>;
}) {
  const fallback = {
    text: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ",
    tr: "Kim Allah'a tevekkül ederse, O ona yeter.",
    ref: "Et-Talak \u00b7 ayet 3",
    surahId: 65,
    ayahNumber: 3,
  };

  const v = dailyVerse
    ? {
        text: dailyVerse.verse.textUthmani,
        tr: dailyVerse.translation ? decodeEntities(dailyVerse.translation.text) : null,
        ref: dailyVerse.surah
          ? `${getSurahName(dailyVerse.surah.id, locale)} \u00b7 ayet ${dailyVerse.verse.ayahNumber}`
          : null,
        surahId: dailyVerse.surah?.id ?? 1,
        ayahNumber: dailyVerse.verse.ayahNumber,
      }
    : fallback;

  return (
    <section className="mu-today">
      <p className="mu-today-label">{hub.todayVerse ?? "Bugünün ayeti"}</p>
      <p className="mu-today-ar" dir="rtl" lang="ar">{v.text}</p>
      {v.tr && <p className="mu-today-tr">{v.tr}</p>}
      {v.ref && <p className="mu-today-ref">{v.ref}</p>}
      <Link
        to="/surah/$surahSlug"
        params={{ surahSlug: surahSlug(v.surahId) }}
        search={{ ayah: v.ayahNumber }}
        className="mu-today-cta"
      >
        {hub.openSurah ?? "Sureyi aç"}
        <span className="mu-today-cta-arrow" aria-hidden="true">{"\u2192"}</span>
      </Link>
    </section>
  );
}

/* ── Streak strip ── */
function StreakStrip({ hub }: { hub: Record<string, string> }) {
  const { session } = useRouteContext({ from: "__root__" });
  const userId = session?.user?.id;

  const { data: streak } = useQuery({
    ...streakQueryOptions(userId ?? ""),
    enabled: !!userId,
  });

  const { data: weekly } = useQuery({
    ...weeklySummaryQueryOptions(userId ?? ""),
    enabled: !!userId,
  });

  const current = streak?.currentStreak ?? 0;
  const weekDays = (hub.weekDays ?? "Pzt,Sal,Çar,Per,Cum,Cmt,Paz").split(",");

  // Build week state from weekly summary (array of 7 days, oldest first)
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1; // 0=Mon

  const dayStates = useMemo(() => {
    return weekDays.map((_, i) => {
      if (i === todayIdx) return "now" as const;
      if (weekly && weekly[i]) {
        return weekly[i].pagesRead > 0 ? "done" as const : "idle" as const;
      }
      // Fallback: mark past days based on streak count
      if (i < todayIdx && current > 0 && todayIdx - i <= current) return "done" as const;
      return "idle" as const;
    });
  }, [todayIdx, current, weekly, weekDays]);

  const isEmpty = current === 0;

  return (
    <section className="mu-disc-section">
      <div className="mu-streak-header">
        <p className="mu-eyebrow">{hub.streakLabel ?? "Serin"}</p>
        {!isEmpty && (
          <div>
            <span className="mu-streak-num">{current}</span>
            <span className="mu-streak-unit">{hub.streakDayUnit ?? "gün"}</span>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="mu-streak-empty">
          <div className="mu-streak-empty-num">0</div>
          <div className="mu-streak-empty-text">
            {hub.streakEmpty ?? "Bugün ilk okumanı yap, serin başlasın."}
          </div>
        </div>
      ) : (
        <div className="mu-progress-bar">
          <div
            className="mu-progress-fill"
            style={{ width: `${Math.min(100, (current / 30) * 100)}%` }}
          />
        </div>
      )}

      <div className="mu-week-row">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`mu-week-day${dayStates[i] === "done" ? " done" : ""}${dayStates[i] === "now" ? " now" : ""}`}
          >
            {day}
          </div>
        ))}
      </div>
    </section>
  );
}
