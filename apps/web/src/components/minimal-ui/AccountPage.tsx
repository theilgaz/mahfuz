/**
 * Account/Profile page -- editorial layout with reading journey, stats, navigation.
 */

import { Link, useRouter } from "@tanstack/react-router";
import { signOut } from "~/lib/auth-client";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useReadingStore } from "~/stores/reading.store";
import { useHifzStore, computeHifzStats } from "~/stores/hifz.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { useQuery } from "@tanstack/react-query";
import { streakQueryOptions, activeHatimQueryOptions, completedHatimsQueryOptions } from "~/hooks/useHabitQuery";
import { getMyScoreStats } from "~/lib/score-service";
import { getSurahName } from "~/lib/surah-names-i18n";
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
  const { data: completedHatims } = useQuery(completedHatimsQueryOptions(user.id));
  const { data: gameStats } = useQuery({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    staleTime: 60_000,
  });

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const hatimProgress = activeHatim ? Math.round((activeHatim.lastPage / 604) * 100) : 0;
  const totalGameScore = gameStats?.reduce((s, g) => s + g.bestScore, 0) ?? 0;
  const totalGamePlays = gameStats?.reduce((s, g) => s + g.totalPlays, 0) ?? 0;

  return (
    <div className="mu-home">
      {/* Header */}
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
          <h1 className="mu-display" style={{ fontSize: 36 }}>
            {user.name || "Kullanici"}
          </h1>
          <p className="mu-muted" style={{ fontSize: 14, marginTop: 4 }}>{user.email}</p>
        </div>
      </section>

      {/* Continue reading */}
      {lastPosition && (
        <Link
          to="/page/$pageNumber"
          params={{ pageNumber: String(lastPosition.pageNumber) }}
          search={{ ayah: undefined }}
          className="mu-profile-continue"
        >
          <span className="mu-profile-continue-icon">{MuIcons.book}</span>
          <span className="mu-profile-continue-text">
            <span className="mu-profile-continue-label">Okumaya devam et</span>
            <strong>{getSurahName(lastPosition.surahId, locale)}, Ayet {lastPosition.ayahNumber}</strong>
          </span>
          <span className="mu-profile-continue-arrow">{MuIcons.arrowRight}</span>
        </Link>
      )}

      {/* Stats grid */}
      <div className="mu-account-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="mu-profile-stat">
          <span className="mu-astat-n">{streak?.currentStreak ?? 0}</span>
          <span className="mu-astat-l">Seri</span>
        </div>
        <div className="mu-profile-stat">
          <span className="mu-astat-n">{streak?.todayPages ?? 0}</span>
          <span className="mu-astat-l">Bugun</span>
        </div>
        <div className="mu-profile-stat">
          <span className="mu-astat-n">{hifzStats.totalVerses}</span>
          <span className="mu-astat-l">Ezber Ayet</span>
        </div>
        <div className="mu-profile-stat">
          <span className="mu-astat-n">{bookmarkCount}</span>
          <span className="mu-astat-l">{t.hub.bookmarks}</span>
        </div>
      </div>

      {/* Hatim progress */}
      {activeHatim && (
        <section className="mu-profile-card">
          <div className="mu-profile-card-header">
            <span className="mu-profile-card-title">Hatim</span>
            <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)" }}>
              Sayfa {activeHatim.lastPage} / 604
            </span>
          </div>
          <div className="mu-profile-progress-bar">
            <div
              className="mu-profile-progress-fill"
              style={{ width: `${hatimProgress}%` }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span className="mu-muted" style={{ fontSize: 12 }}>%{hatimProgress} tamamlandi</span>
            {completedHatims && completedHatims.length > 0 && (
              <span className="mu-muted" style={{ fontSize: 12 }}>
                {completedHatims.length} hatim tamamlandi
              </span>
            )}
          </div>
        </section>
      )}

      {/* Hifz summary */}
      {hifzStats.totalVerses > 0 && (
        <section className="mu-profile-card">
          <div className="mu-profile-card-header">
            <span className="mu-profile-card-title">Hifz Durumu</span>
            <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)" }}>
              %{hifzStats.percentage.toFixed(1)}
            </span>
          </div>
          <div className="mu-profile-progress-bar">
            <div
              className="mu-profile-progress-fill"
              style={{ width: `${hifzStats.percentage}%` }}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <span className="mu-muted" style={{ fontSize: 12 }}>
              {hifzStats.completeSurahs} sure tam
            </span>
            <span className="mu-muted" style={{ fontSize: 12 }}>
              {hifzStats.activeSurahs} sure aktif
            </span>
          </div>
        </section>
      )}

      {/* Game stats */}
      {totalGamePlays > 0 && (
        <section className="mu-profile-card">
          <div className="mu-profile-card-header">
            <span className="mu-profile-card-title">Oyunlar</span>
            <Link to="/games/scoreboard" className="mu-muted" style={{ fontSize: 12, textDecoration: "none" }}>
              Skor Tablosu {MuIcons.arrowRight}
            </Link>
          </div>
          <div className="mu-account-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", padding: 0, border: "none", margin: 0 }}>
            <div className="mu-profile-stat">
              <span className="mu-astat-n" style={{ fontSize: 24 }}>{totalGameScore}</span>
              <span className="mu-astat-l">Toplam Skor</span>
            </div>
            <div className="mu-profile-stat">
              <span className="mu-astat-n" style={{ fontSize: 24 }}>{totalGamePlays}</span>
              <span className="mu-astat-l">Oyun</span>
            </div>
            <div className="mu-profile-stat">
              <span className="mu-astat-n" style={{ fontSize: 24 }}>{gameStats?.length ?? 0}</span>
              <span className="mu-astat-l">Cesit</span>
            </div>
          </div>
        </section>
      )}

      {/* Navigation links */}
      <nav className="mu-account-nav">
        <Link to="/bookmarks" className="mu-account-link">
          <span className="mu-account-link-icon">{MuIcons.bookmark}</span>
          <span className="mu-account-link-text">
            <strong>{t.hub.bookmarks}</strong>
            <span>{t.hub.bookmarksDesc}</span>
          </span>
          {bookmarkCount > 0 && (
            <span className="mu-account-link-badge">{bookmarkCount}</span>
          )}
        </Link>

        <Link to="/notes" className="mu-account-link">
          <span className="mu-account-link-icon">{MuIcons.note}</span>
          <span className="mu-account-link-text">
            <strong>{t.hub.notes}</strong>
            <span>{t.hub.notesDesc}</span>
          </span>
        </Link>

        <Link to="/premium" className="mu-account-link">
          <span className="mu-account-link-icon">{MuIcons.settings}</span>
          <span className="mu-account-link-text">
            <strong>{t.hub.premium}</strong>
            <span>{t.hub.premiumDesc}</span>
          </span>
        </Link>
      </nav>

      {/* Sign out */}
      <div style={{ paddingTop: 32 }}>
        <button
          className="mu-btn ghost"
          onClick={async () => {
            await signOut();
            await router.invalidate();
          }}
        >
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );
}
