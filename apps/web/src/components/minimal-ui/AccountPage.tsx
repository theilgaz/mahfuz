/**
 * Account/Profile page — Apple Settings-style minimal list.
 * Heavy widgets (league zone, trophies, hifz chips, privacy radio) live on
 * their destination routes; this page is a directory + glance summary.
 */

import { Link, useRouter } from "@tanstack/react-router";
import { signOut } from "~/lib/auth-client";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useReadingStore } from "~/stores/reading.store";
import { useHifzStore, computeHifzStats } from "~/stores/hifz.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { useQuery } from "@tanstack/react-query";
import { streakQueryOptions, activeHatimQueryOptions } from "~/hooks/useHabitQuery";
import { getMyScoreStats, getMyLeagueStatus, getMyTrophies } from "~/lib/score-service";
import { getSurahName } from "~/lib/surah-names-i18n";
import { LEAGUE_LABELS } from "~/lib/league";
import { LeagueBadge } from "./LeagueIcons";
import { MuIcons } from "./icons";
import { useMemo } from "react";

interface AccountPageProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function AccountPage({ user }: AccountPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const memorized = useHifzStore((s) => s.memorized);
  const hifzStats = useMemo(() => computeHifzStats(memorized), [memorized]);

  const { data: streak } = useQuery(streakQueryOptions(user.id));
  const { data: activeHatim } = useQuery(activeHatimQueryOptions(user.id));
  const { data: gameStats } = useQuery({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    staleTime: 60_000,
  });
  const { data: leagueStatus } = useQuery({
    queryKey: ["my-league"],
    queryFn: () => getMyLeagueStatus(),
    staleTime: 60_000,
  });
  const { data: trophies } = useQuery({
    queryKey: ["my-trophies"],
    queryFn: () => getMyTrophies(),
    staleTime: 60_000,
  });

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const totalGameScore = gameStats?.reduce((s, g) => s + g.totalScore, 0) ?? 0;
  const trophyCount = (trophies?.champions.length ?? 0) + (trophies?.rosettes.length ?? 0);
  const hatimProgress = activeHatim ? Math.round((activeHatim.lastPage / 604) * 100) : 0;

  return (
    <div className="mu-home mu-account">
      {/* Header — avatar + name + email */}
      <section className="mu-account-head">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="mu-account-avatar"
            style={{ objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mu-account-avatar">{initial}</div>
        )}
        <div>
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

      {/* Inline stat strip */}
      <div className="mu-account-strip">
        <Stat n={streak?.currentStreak ?? 0} label="seri" />
        <Stat n={streak?.todayPages ?? 0} label="bugün" />
        <Stat n={hifzStats.totalVerses} label="ezber" />
        <Stat n={bookmarkCount} label="imler" />
      </div>

      {/* Continue reading — featured row */}
      {lastPosition && (
        <Link
          to="/page/$pageNumber"
          params={{ pageNumber: String(lastPosition.pageNumber) }}
          search={{ ayah: undefined }}
          className="mu-prow mu-prow--feature"
        >
          <span className="mu-prow-icon" aria-hidden="true">{MuIcons.book}</span>
          <span className="mu-prow-meta">
            <span className="mu-prow-title">Okumaya devam et</span>
            <span className="mu-prow-sub">{getSurahName(lastPosition.surahId, locale)} · {t.reader?.ayah ?? "ayet"} {lastPosition.ayahNumber}</span>
          </span>
          <span className="mu-prow-chev" aria-hidden="true">{MuIcons.arrowRight}</span>
        </Link>
      )}

      {/* Section: ders */}
      <ul className="mu-prow-list">
        <li>
          <Link to="/hifz" className="mu-prow">
            <span className="mu-prow-icon" aria-hidden="true">{MuIcons.brain}</span>
            <span className="mu-prow-meta">
              <span className="mu-prow-title">{t.hub?.hifz ?? "Hifz"}</span>
              <span className="mu-prow-sub">
                {hifzStats.totalVerses > 0
                  ? `${hifzStats.totalVerses} ayet · ${hifzStats.completeSurahs} sure tam`
                  : "Henüz ezber yok"}
              </span>
            </span>
            <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
          </Link>
        </li>
        <li>
          <Link to="/bookmarks" className="mu-prow">
            <span className="mu-prow-icon" aria-hidden="true">{MuIcons.bookmark}</span>
            <span className="mu-prow-meta">
              <span className="mu-prow-title">{t.hub?.bookmarks ?? "Yer İmlerim"}</span>
              <span className="mu-prow-sub">
                {bookmarkCount > 0 ? `${bookmarkCount} ayet kayıtlı` : "Henüz yok"}
              </span>
            </span>
            <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
          </Link>
        </li>
        <li>
          <Link to="/notes" className="mu-prow">
            <span className="mu-prow-icon" aria-hidden="true">{MuIcons.note}</span>
            <span className="mu-prow-meta">
              <span className="mu-prow-title">{t.hub?.notes ?? "Notlar"}</span>
            </span>
            <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
          </Link>
        </li>
        {activeHatim && (
          <li>
            <Link to="/page/$pageNumber" params={{ pageNumber: String(activeHatim.lastPage) }} search={{ ayah: undefined }} className="mu-prow">
              <span className="mu-prow-icon" aria-hidden="true">{MuIcons.history}</span>
              <span className="mu-prow-meta">
                <span className="mu-prow-title">Hatim</span>
                <span className="mu-prow-sub">Sayfa {activeHatim.lastPage} / 604 · %{hatimProgress}</span>
              </span>
              <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
            </Link>
          </li>
        )}
      </ul>

      {/* Section: oyun */}
      <ul className="mu-prow-list">
        <li>
          <Link to="/games" className="mu-prow">
            <span className="mu-prow-icon" aria-hidden="true">{MuIcons.games}</span>
            <span className="mu-prow-meta">
              <span className="mu-prow-title">{t.hub?.games ?? "Oyunlar"}</span>
              <span className="mu-prow-sub">
                {totalGameScore > 0 ? `${totalGameScore.toLocaleString("tr")} pt` : "Henüz oynanmadı"}
              </span>
            </span>
            <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
          </Link>
        </li>
        {trophyCount > 0 && (
          <li>
            <Link to="/games/scoreboard" className="mu-prow">
              <span className="mu-prow-icon" aria-hidden="true">{MuIcons.star}</span>
              <span className="mu-prow-meta">
                <span className="mu-prow-title">Kupalarım</span>
                <span className="mu-prow-sub">
                  {trophies!.champions.length > 0 && `${trophies!.champions.length} şampiyonluk`}
                  {trophies!.champions.length > 0 && trophies!.rosettes.length > 0 && " · "}
                  {trophies!.rosettes.length > 0 && `${trophies!.rosettes.length} rozet`}
                </span>
              </span>
              <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
            </Link>
          </li>
        )}
      </ul>

      {/* Section: hesap */}
      <ul className="mu-prow-list">
        <li>
          <Link to="/premium" className="mu-prow">
            <span className="mu-prow-icon" aria-hidden="true">{MuIcons.lock}</span>
            <span className="mu-prow-meta">
              <span className="mu-prow-title">{t.hub?.premium ?? "Mürşid"}</span>
            </span>
            <span className="mu-prow-chev" aria-hidden="true">{MuIcons.chev}</span>
          </Link>
        </li>
      </ul>

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

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="mu-account-stat">
      <span className="mu-account-stat-n">{n}</span>
      <span className="mu-account-stat-l">{label}</span>
    </div>
  );
}
