/**
 * Account/Profile page — infografik ozet + GitHub-tarzi aktivite heatmap +
 * hizli erisim + son yer imleri. Apple-vibe, token-tabanli.
 */

import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "~/lib/auth-client";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useReadingStore } from "~/stores/reading.store";
import { useHifzStore, computeHifzStats } from "~/stores/hifz.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import {
  streakQueryOptions,
  activeHatimQueryOptions,
  readingGoalQueryOptions,
  yearActivityQueryOptions,
} from "~/hooks/useHabitQuery";
import { getMyScoreStats, getMyLeagueStatus } from "~/lib/score-service";
import { getMyVerseNotes } from "~/lib/verse-notes-service";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { LEAGUE_LABELS } from "~/lib/league";
import { ContributionHeatmap } from "~/components/habit/ContributionHeatmap";
import { LeagueBadge } from "./LeagueIcons";
import { MuIcons } from "./icons";

interface AccountPageProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

type QuickPath =
  | "/hifz"
  | "/bookmarks"
  | "/notes"
  | "/stats"
  | "/games"
  | "/tajweed"
  | "/khatm"
  | "/discover";

type AccountLink = "/profile/privacy";

export function AccountPage({ user }: AccountPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const memorized = useHifzStore((s) => s.memorized);
  const hifzStats = useMemo(() => computeHifzStats(memorized), [memorized]);

  const { data: streak } = useQuery(streakQueryOptions());
  const { data: goal } = useQuery(readingGoalQueryOptions());
  const { data: yearDays } = useQuery(yearActivityQueryOptions());
  const { data: activeHatim } = useQuery(activeHatimQueryOptions());
  const { data: gameStats } = useQuery({ queryKey: ["my-score-stats"], queryFn: () => getMyScoreStats(), staleTime: 60_000 });
  const { data: leagueStatus } = useQuery({ queryKey: ["my-league"], queryFn: () => getMyLeagueStatus(), staleTime: 60_000 });
  const { data: notes } = useQuery({ queryKey: ["verse-notes"], queryFn: () => getMyVerseNotes(), staleTime: 60_000 });

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const dailyTarget = goal?.dailyTargetPages ?? 1;
  const totalGameScore = gameStats?.reduce((s, g) => s + g.totalScore, 0) ?? 0;
  const notesCount = notes?.length ?? 0;
  const bookmarkCount = bookmarks.length;

  const recentBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [bookmarks],
  );

  const readPct = lastPosition ? Math.round((lastPosition.pageNumber / 604) * 100) : 0;

  return (
    <div className="mu-home mu-account">
      {/* Header */}
      <section className="mu-account-head">
        {user.image ? (
          <img src={user.image} alt={user.name || ""} className="mu-account-avatar" style={{ objectFit: "cover" }} referrerPolicy="no-referrer" />
        ) : (
          <div className="mu-account-avatar">{initial}</div>
        )}
        <div className="mu-account-headmeta">
          <h1 className="mu-account-name">{user.name || "Kullanıcı"}</h1>
          <p className="mu-account-sub">
            <span>{user.email}</span>
            {leagueStatus && (
              <>
                <span className="mu-dot">·</span>
                <span className="mu-account-league">
                  <LeagueBadge league={leagueStatus.league} size={14} />
                  {LEAGUE_LABELS[leagueStatus.league]} Ligi
                </span>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Stat infographic cards */}
      <div className="mu-pf-stats">
        <StatCard icon={MuIcons.flame} n={streak?.currentStreak ?? 0} unit={t.profile?.dayUnit ?? "gün"} label={t.profile?.currentStreak ?? "Güncel seri"} sub={`${t.profile?.longest ?? "En uzun"} ${streak?.longestStreak ?? 0}`} />
        <StatCard icon={MuIcons.book} n={streak?.todayPages ?? 0} unit={t.profile?.pageUnit ?? "syf"} label={t.profile?.today ?? "Bugün"} sub={`${t.profile?.goal ?? "Hedef"} ${dailyTarget}`} />
        <StatCard icon={MuIcons.brain} n={hifzStats.totalVerses} unit={t.profile?.verseUnit ?? "ayet"} label={t.hub?.hifz ?? "Ezber"} sub={hifzStats.completeSurahs > 0 ? `${hifzStats.completeSurahs} ${t.profile?.surahComplete ?? "sure tam"}` : undefined} />
        <StatCard icon={MuIcons.bookmark} n={bookmarkCount} label={t.hub?.bookmarks ?? "Yer imi"} sub={totalGameScore > 0 ? `${totalGameScore.toLocaleString("tr")} ${t.profile?.pointUnit ?? "puan"}` : undefined} />
      </div>

      {/* Continue reading */}
      {lastPosition && (
        <Link to="/page/$pageNumber" params={{ pageNumber: String(lastPosition.pageNumber) }} search={{ ayah: undefined }} className="mu-pf-feature">
          <span className="mu-pf-feature-ico" aria-hidden="true">{MuIcons.book}</span>
          <span className="mu-pf-feature-meta">
            <span className="mu-pf-feature-t">{t.home?.continueBtn ?? "Okumaya devam et"}</span>
            <span className="mu-pf-feature-s">{getSurahName(lastPosition.surahId, locale)} · {t.reader?.ayah ?? "ayet"} {lastPosition.ayahNumber}</span>
            <span className="mu-pf-feature-bar"><span style={{ width: `${Math.max(readPct, 3)}%` }} /></span>
          </span>
          <span className="mu-pf-feature-arrow" aria-hidden="true">{MuIcons.arrowRight}</span>
        </Link>
      )}

      {/* Activity heatmap */}
      <p className="mu-pf-eyebrow">{t.profile?.activity ?? "Okuma aktivitesi"}</p>
      <div className="mu-pf-card">
        <div className="mu-pf-card-head">
          <span className="mu-pf-card-title">{t.profile?.lastYear ?? "Son 6 ay"}</span>
          {(streak?.currentStreak ?? 0) > 0 && (
            <span className="mu-pf-card-meta">
              {t.profile?.currentStreak ?? "Güncel seri"} <b>{streak?.currentStreak}</b> {t.profile?.dayUnit ?? "gün"}
            </span>
          )}
        </div>
        <ContributionHeatmap
          days={yearDays ?? []}
          dailyTarget={dailyTarget}
          lessLabel={t.habit?.less ?? "az"}
          moreLabel={t.habit?.more ?? "çok"}
          totalLabel={(nn) => `${nn} ${t.profile?.daysRead ?? "gün okundu"}`}
        />
      </div>

      {/* Quick access */}
      <p className="mu-pf-eyebrow">{t.profile?.quickAccess ?? "Hızlı erişim"}</p>
      <div className="mu-pf-qa">
        <QuickAction to="/hifz" icon={MuIcons.brain} label={t.hub?.hifz ?? "Hifz"} count={hifzStats.totalVerses > 0 ? `${hifzStats.totalVerses} ${t.profile?.verseUnit ?? "ayet"}` : undefined} />
        <QuickAction to="/bookmarks" icon={MuIcons.bookmark} label={t.hub?.bookmarks ?? "Yer imleri"} count={bookmarkCount > 0 ? String(bookmarkCount) : undefined} />
        <QuickAction to="/notes" icon={MuIcons.note} label={t.hub?.notes ?? "Notlar"} count={notesCount > 0 ? String(notesCount) : undefined} />
        <QuickAction to="/stats" icon={MuIcons.chart} label={t.profile?.stats ?? "İstatistik"} />
        <QuickAction to="/games" icon={MuIcons.gameController} label={t.hub?.games ?? "Oyunlar"} count={totalGameScore > 0 ? `${totalGameScore.toLocaleString("tr")} pt` : undefined} />
        <QuickAction to="/tajweed" icon={MuIcons.alif} label={t.hub?.tajweed ?? "Tecvid"} />
        <QuickAction to="/khatm" icon={MuIcons.usersThree} label={t.hub?.hatim ?? "Hatim"} count={activeHatim ? `${t.profile?.pageShort ?? "Syf"} ${activeHatim.lastPage}` : undefined} />
        <QuickAction to="/discover" icon={MuIcons.compass} label={t.hub?.title ?? "Keşfet"} />
      </div>

      {/* Recent bookmarks — direct access */}
      {recentBookmarks.length > 0 && (
        <>
          <p className="mu-pf-eyebrow">
            <span>{t.profile?.recentBookmarks ?? "Son yer imleri"}</span>
            <Link to="/bookmarks" className="mu-pf-eyebrow-link">{t.home?.viewAll ?? "Tümü"}</Link>
          </p>
          <ul className="mu-pf-bm">
            {recentBookmarks.map((bm) => (
              <li key={`${bm.surahId}:${bm.ayahNumber}`}>
                <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(bm.surahId) }} search={{ ayah: bm.ayahNumber }} className="mu-pf-bm-row">
                  <span className="mu-pf-bm-n">{String(bm.surahId).padStart(3, "0")}</span>
                  <span className="mu-pf-bm-meta">
                    <span className="mu-pf-bm-t">
                      {getSurahName(bm.surahId, locale)}
                      <span> · {t.reader?.ayah ?? "ayet"} {bm.ayahNumber}</span>
                    </span>
                  </span>
                  <span className="mu-pf-bm-page">{bm.pageNumber}</span>
                  <span className="mu-pf-bm-chev" aria-hidden="true">{MuIcons.chev}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Account */}
      <p className="mu-pf-eyebrow">{t.profile?.account ?? "Hesap"}</p>
      <Link to="/premium" className="mu-pf-premium">
        <span className="mu-pf-premium-ico" aria-hidden="true">{MuIcons.star}</span>
        <span className="mu-pf-premium-meta">
          <span className="mu-pf-premium-t">{t.hub?.premium ?? "Mürşid"}</span>
          <span className="mu-pf-premium-s">{t.profile?.premiumPitch ?? "Sınırsız meal, reklamsız, gelişmiş tahlil"}</span>
        </span>
        <span className="mu-pf-premium-cta">{t.profile?.upgrade ?? "Yükselt"}</span>
      </Link>

      <AccountRow
        to="/profile/privacy"
        icon={MuIcons.lock}
        title={t.profile?.privacy ?? "Gizlilik"}
        hint={t.profile?.privacyHint ?? "Skor tablosunda adının nasıl görüneceğini seç"}
      />

      {/* Sign out */}
      <div className="mu-account-foot">
        <button
          className="mu-link-arrow"
          onClick={async () => {
            await signOut();
            await router.invalidate();
          }}
        >
          {t.nav?.signOut ?? "Çıkış yap"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, n, unit, label, sub }: { icon: ReactNode; n: number; unit?: string; label: string; sub?: string }) {
  return (
    <div className="mu-pf-stat">
      <span className="mu-pf-stat-ico" aria-hidden="true">{icon}</span>
      <span className="mu-pf-stat-n">
        {n.toLocaleString("tr")}
        {unit && <small>{unit}</small>}
      </span>
      <span className="mu-pf-stat-l">{label}</span>
      {sub && <span className="mu-pf-stat-x">{sub}</span>}
    </div>
  );
}

function QuickAction({ to, icon, label, count }: { to: QuickPath; icon: ReactNode; label: string; count?: string }) {
  return (
    <Link to={to} className="mu-pf-qa-btn">
      <span className="mu-pf-qa-ico" aria-hidden="true">{icon}</span>
      <span className="mu-pf-qa-l">{label}</span>
      <span className="mu-pf-qa-c">{count ?? " "}</span>
    </Link>
  );
}

function AccountRow({ to, icon, title, hint }: { to: AccountLink; icon: ReactNode; title: string; hint: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        textDecoration: "none",
        color: "inherit",
        background: "var(--mu-bg-card)",
        border: "1px solid var(--mu-line)",
        borderRadius: 16,
        padding: "14px 16px",
        marginTop: 10,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          background: "var(--mu-accent-soft)",
          color: "var(--mu-accent-ink)",
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--mu-ff-display)", fontWeight: 500, fontSize: 15, color: "var(--mu-ink)" }}>
          {title}
        </span>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--mu-muted)", marginTop: 1 }}>{hint}</span>
      </span>
      <span aria-hidden="true" style={{ color: "var(--mu-muted)", flexShrink: 0 }}>
        {MuIcons.chev}
      </span>
    </Link>
  );
}
