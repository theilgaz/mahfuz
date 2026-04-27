/**
 * Skor Tablosu — global + oyun başına liderlik tabloları, lig sistemi.
 *
 * Sıralama kuralları:
 *   - Tüm zamanlar: SUM (toplam emek), her oturum eklenir
 *   - Sezon (içinde bulunulan ay): MAX (en iyi tek skor)
 *   - Hafta: MAX
 *
 * Per-game tablolar hem MAX hem SUM kolonu gösterir.
 * Lig rozeti kullanıcı adının yanında; kupa/kokart sayacı varsa profile yönlendirir.
 */

import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getGlobalLeaderboard,
  getGameLeaderboard,
  getMyScoreStats,
  getMyTrophies,
  GAME_TITLES,
  GAME_IDS,
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
} from "~/lib/score-service";
import { LEAGUE_LABELS, type League } from "~/lib/league";
import { LeagueBadge, MedalLeague, RosetteIcon, TrophyIcon } from "~/components/minimal-ui/LeagueIcons";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/games/scoreboard")({
  component: ScoreboardPage,
  validateSearch: (search: Record<string, unknown>): { game?: string } => ({
    game: typeof search.game === "string" ? search.game : undefined,
  }),
});

function ScoreboardPage() {
  const { session } = useRouteContext({ from: "__root__" });
  const { game } = Route.useSearch();
  const { t } = useTranslation();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<"global" | string>(
    game && GAME_IDS.includes(game) ? game : "global",
  );
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");

  const periodLabels: Record<LeaderboardPeriod, string> = {
    week: t.gamesHub.periodWeek,
    season: t.gamesHub.periodSeason,
    all: t.gamesHub.periodAll,
  };

  const { data: globalBoard } = useQuery({
    queryKey: ["global-leaderboard", period],
    queryFn: () => getGlobalLeaderboard({ data: { period } }),
    staleTime: 60_000,
  });

  const { data: gameBoard } = useQuery({
    queryKey: ["game-leaderboard", activeTab, period],
    queryFn: () => getGameLeaderboard({ data: { gameId: activeTab, period } }),
    enabled: activeTab !== "global",
    staleTime: 60_000,
  });

  const { data: myStats } = useQuery({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: myTrophies } = useQuery({
    queryKey: ["my-trophies"],
    queryFn: () => getMyTrophies(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const board = activeTab === "global" ? globalBoard : gameBoard;
  const top3 = board?.slice(0, 3) ?? [];
  const rest = board?.slice(3) ?? [];

  const isPerGame = activeTab !== "global";
  const primaryLabel = period === "all" ? "Toplam" : "En İyi";
  const secondaryLabel = period === "all" ? "En İyi" : "Toplam";

  // Kişisel toplamlar
  const myTotalScore = myStats?.reduce((sum, s) => sum + s.totalScore, 0) ?? 0;
  const myBestSum = myStats?.reduce((sum, s) => sum + s.bestScore, 0) ?? 0;
  const myTotalPlays = myStats?.reduce((sum, s) => sum + s.totalPlays, 0) ?? 0;
  const trophyCount = (myTrophies?.champions.length ?? 0) + (myTrophies?.rosettes.length ?? 0);

  return (
    <div className="mu-games">
      {/* Back link */}
      <Link
        to="/games"
        className="mu-muted"
        style={{ fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        {t.gamesHub?.title ?? "Oyunlar"}
      </Link>

      {/* Header */}
      <div style={{ paddingTop: 24, paddingBottom: 32 }}>
        <p className="mu-eyebrow">
          <span className="mu-eb-line" />
          {t.gamesHub?.scoreboard ?? "Skor Tablosu"}
        </p>
        <h1 className="mu-display" style={{ fontSize: "clamp(32px, 5vw, 52px)", marginBottom: 8 }}>
          Zirvedekiler
        </h1>
        <p className="mu-lede" style={{ fontSize: 16, marginBottom: 0 }}>
          Her oyun seni lige bir adım daha yaklaştırır.
        </p>
      </div>

      {/* Period selector */}
      <div className="mu-sb-periods">
        {LEADERBOARD_PERIODS.map((p) => (
          <button
            key={p}
            className={`mu-sb-period ${period === p ? "active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Period explanation */}
      <p className="mu-muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
        {period === "all"
          ? "Tüm zamanlar = oturum skorlarının toplamı. Her oyun seni ileri taşır."
          : "Hafta ve sezon = bu pencerede attığın en yüksek tek skor."}
      </p>

      {/* Tabs: Global + per-game */}
      <div className="mu-sb-tabs">
        <button
          className={`mu-sb-tab ${activeTab === "global" ? "active" : ""}`}
          onClick={() => setActiveTab("global")}
        >
          {t.gamesHub?.tabGlobal ?? "Genel"}
        </button>
        {GAME_IDS.map((id) => (
          <button
            key={id}
            className={`mu-sb-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {GAME_TITLES[id]}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="mu-sb-podium">
          {/* Reorder: 2nd, 1st, 3rd for visual podium */}
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            if (!entry) return <div key={i} className="mu-sb-podium-slot" />;
            const isYou = userId === entry.userId;
            const place = entry.rank;
            const podiumColors = ["", "#d4a437", "#a8a8a8", "#b87333"];
            return (
              <div
                key={entry.userId}
                className={`mu-sb-podium-slot place-${place}`}
              >
                <div
                  className="mu-sb-podium-avatar"
                  style={{ borderColor: podiumColors[place] || "var(--mu-line)" }}
                >
                  {entry.userImage ? (
                    <img src={entry.userImage} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: place === 1 ? 24 : 18, fontFamily: "var(--mu-ff-display)", color: "var(--mu-muted)" }}>
                      {(entry.userName || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="mu-sb-podium-rank" style={{ color: podiumColors[place] }}>
                  {place}
                </span>
                <span className="mu-sb-podium-name" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <LeagueBadge league={entry.league} size={12} />
                  {entry.userName || "Anonim"}
                  {isYou && <span className="mu-ybadge" style={{ fontSize: 9, marginLeft: 4 }}>sen</span>}
                </span>
                <span className="mu-sb-podium-score">{entry.bestScore}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-game header with two columns */}
      {isPerGame && rest.length > 0 && (
        <div
          className="mu-muted"
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            gap: 12,
            padding: "8px 12px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginTop: 24,
          }}
        >
          <span>#</span>
          <span>Oyuncu</span>
          <span style={{ textAlign: "right" }}>{primaryLabel}</span>
          <span style={{ textAlign: "right", opacity: 0.7 }}>{secondaryLabel}</span>
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <ol style={{ listStyle: "none", padding: 0, margin: isPerGame ? 0 : "24px 0 0" }}>
          {rest.map((entry) => {
            const isYou = userId === entry.userId;
            return (
              <li
                key={entry.userId}
                className={`mu-lrow ${isYou ? "you" : ""}`}
                style={isPerGame ? { display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, alignItems: "center" } : undefined}
              >
                <span className="mu-lrank">{entry.rank}</span>
                <span className="mu-lname" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <LeagueBadge league={entry.league} size={12} />
                  {entry.userName || "Anonim"}
                  {isYou && <span className="mu-ybadge">sen</span>}
                </span>
                <span className="mu-lxp" style={{ textAlign: "right" }}>{entry.bestScore}</span>
                {isPerGame && (
                  <span className="mu-lxp" style={{ textAlign: "right", opacity: 0.6, fontSize: 13 }}>
                    {period === "all" ? entry.windowMax ?? "—" : entry.windowSum ?? "—"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Empty state */}
      {board && board.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p className="mu-muted" style={{ fontSize: 15 }}>
            {t.gamesHub?.noScores ?? "Henüz skor yok. Bir oyun oynayarak ilk sen ol!"}
          </p>
          <Link to="/games" className="mu-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Oyunlara Git
          </Link>
        </div>
      )}

      {/* My stats (if logged in) */}
      {userId && myStats && myStats.length > 0 && (
        <section style={{ paddingTop: 32, marginTop: 32, borderTop: "1px solid var(--mu-line)" }}>
          <h2 className="mu-h2" style={{ fontSize: 24 }}>Senin Skorların</h2>
          <div className="mu-sb-mystats">
            <div className="mu-sb-stat-card">
              <span className="mu-sb-stat-value">{myTotalScore}</span>
              <span className="mu-sb-stat-label">Toplam Skor</span>
            </div>
            <div className="mu-sb-stat-card">
              <span className="mu-sb-stat-value">{myBestSum}</span>
              <span className="mu-sb-stat-label">En İyi Skorlar Toplamı</span>
            </div>
            <div className="mu-sb-stat-card">
              <span className="mu-sb-stat-value">{myTotalPlays}</span>
              <span className="mu-sb-stat-label">Toplam Oyun</span>
            </div>
            {trophyCount > 0 && (
              <Link
                to="/profile"
                className="mu-sb-stat-card"
                style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <span className="mu-sb-stat-value" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <TrophyIcon size={20} />
                  {trophyCount}
                </span>
                <span className="mu-sb-stat-label">Kupalarım</span>
              </Link>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            {myStats.map((stat) => (
              <div key={stat.gameId} className="mu-lrow">
                <span className="mu-lrank" style={{ fontSize: 14 }}>{stat.totalPlays}x</span>
                <span className="mu-lname" style={{ fontSize: 15 }}>{GAME_TITLES[stat.gameId] ?? stat.gameId}</span>
                <span className="mu-lxp" style={{ textAlign: "right" }}>{stat.totalScore}</span>
                <span className="mu-lxp" style={{ textAlign: "right", opacity: 0.6, fontSize: 13 }}>{stat.bestScore}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* League ladder reference */}
      <section style={{ paddingTop: 32, marginTop: 32, borderTop: "1px solid var(--mu-line)" }}>
        <h2 className="mu-h2" style={{ fontSize: 20 }}>Ligler</h2>
        <p className="mu-muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Tüm zaman toplam skoruna göre ligin belirlenir.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {(["bronz", "gumus", "altin", "hafiz"] as League[]).map((lg) => (
            <div
              key={lg}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                border: "1px solid var(--mu-line)",
                borderRadius: 8,
              }}
            >
              <MedalLeague league={lg} size={28} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{LEAGUE_LABELS[lg]}</span>
                <span className="mu-muted" style={{ fontSize: 12 }}>{leagueRangeLabel(lg)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mu-muted" style={{ fontSize: 12, marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RosetteIcon league="altin" size={14} /> Sezon ilk 10'una giren oyuncular kokart kazanır.
        </p>
      </section>
    </div>
  );
}

function leagueRangeLabel(lg: League): string {
  if (lg === "bronz") return "0 – 499";
  if (lg === "gumus") return "500 – 2.999";
  if (lg === "altin") return "3.000 – 9.999";
  return "10.000+";
}
