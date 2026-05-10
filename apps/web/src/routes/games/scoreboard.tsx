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
  getMyLeagueStatus,
  GAME_TITLES,
  GAME_IDS,
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
  type LeagueFilter,
} from "~/lib/score-service";
import { LEAGUE_LABELS, LEAGUE_ORDER, type League, seasonKeyFor, seasonRange, formatSeasonName } from "~/lib/league";
import { LeagueBadge, MedalLeague, RosetteIcon } from "~/components/minimal-ui/LeagueIcons";
import { Podium } from "~/components/minimal-ui/Podium";
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
  const [period, setPeriod] = useState<LeaderboardPeriod>("season");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter | null>(null);

  const periodLabels: Record<LeaderboardPeriod, string> = {
    season: t.gamesHub.periodSeason,
    all: t.gamesHub.periodAll,
  };

  const seasonKey = seasonKeyFor(new Date());
  const seasonName = formatSeasonName(seasonKey);
  const { startedAt, endedAt } = seasonRange(seasonKey);
  const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
  const fullDateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const seasonStartLabel = dateFmt.format(new Date(startedAt));
  // endedAt is exclusive (next month start), show last day inclusive.
  const seasonEndLabel = dateFmt.format(new Date(endedAt - 1));
  const nextSeasonStartLabel = fullDateFmt.format(new Date(endedAt));

  const { data: myLeagueStatus } = useQuery({
    queryKey: ["my-league-status"],
    queryFn: () => getMyLeagueStatus(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  // Varsayılan: viewer'ın ligi; viewer yoksa "all"
  const activeLeague: LeagueFilter = leagueFilter ?? myLeagueStatus?.league ?? "all";

  const { data: globalBoard } = useQuery({
    queryKey: ["global-leaderboard", period, activeLeague],
    queryFn: () => getGlobalLeaderboard({ data: { period, league: activeLeague } }),
    staleTime: 60_000,
  });

  const { data: gameBoard } = useQuery({
    queryKey: ["game-leaderboard", activeTab, period, activeLeague],
    queryFn: () => getGameLeaderboard({ data: { gameId: activeTab, period, league: activeLeague } }),
    enabled: activeTab !== "global",
    staleTime: 60_000,
  });

  const board = activeTab === "global" ? globalBoard : gameBoard;
  const top3 = board?.slice(0, 3) ?? [];
  const rest = board?.slice(3) ?? [];

  const isPerGame = activeTab !== "global";
  const primaryLabel = period === "all" ? "Toplam" : "En İyi";
  const secondaryLabel = period === "all" ? "En İyi" : "Toplam";

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

      {/* Period explanation + season info */}
      {period === "all" ? (
        <p className="mu-muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Tüm zamanlar = oturum skorlarının toplamı. Her oyun seni ileri taşır.
        </p>
      ) : (
        <div className="mu-sb-season">
          <div className="mu-sb-season-name">{seasonName}</div>
          <p className="mu-sb-season-meta">
            {seasonStartLabel} – {seasonEndLabel} arası geçerli. Bu pencerede attığın en yüksek tek skor sayılır.
          </p>
          <p className="mu-sb-season-next">
            Yeni sezon {nextSeasonStartLabel} tarihinde başlar.
          </p>
        </div>
      )}

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

      {/* League filter — viewer'ın ligi default, diğer ligler ve "Tümü" seçilebilir */}
      <div className="mu-sb-periods" style={{ marginTop: 12 }}>
        {(["all", ...LEAGUE_ORDER] as LeagueFilter[]).map((lg) => {
          const isMine = myLeagueStatus?.league === lg;
          return (
            <button
              key={lg}
              className={`mu-sb-period ${activeLeague === lg ? "active" : ""}`}
              onClick={() => setLeagueFilter(lg)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {lg !== "all" && <LeagueBadge league={lg} size={12} />}
              {lg === "all" ? "Tüm Ligler" : LEAGUE_LABELS[lg]}
              {isMine && (
                <span className="mu-ybadge" style={{ fontSize: 9, marginLeft: 4 }}>sen</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <Podium entries={top3} currentUserId={userId} />
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

      {/* League ladder — sezon hareket politikası */}
      <section style={{ paddingTop: 32, marginTop: 32, borderTop: "1px solid var(--mu-line)" }}>
        <h2 className="mu-h2" style={{ fontSize: 20 }}>Ligler</h2>
        <p className="mu-muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Her sezon kapanışında lig içindeki ilk 3 üst lige çıkar, son 3 alt lige iner. 3'ten az aktif oyuncu varsa hareket olmaz.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {LEAGUE_ORDER.map((lg) => (
            <div
              key={lg}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                border: "1px solid var(--mu-line)",
                borderRadius: 8,
                background: myLeagueStatus?.league === lg ? "var(--mu-accent-soft)" : undefined,
                borderColor: myLeagueStatus?.league === lg ? "var(--mu-accent)" : undefined,
              }}
            >
              <MedalLeague league={lg} size={28} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{LEAGUE_LABELS[lg]}</span>
                <span className="mu-muted" style={{ fontSize: 12 }}>
                  {myLeagueStatus?.league === lg ? "Senin Ligin" : leagueMoveLabel(lg)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mu-muted" style={{ fontSize: 12, marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RosetteIcon league="altin" size={14} /> Genel sezon ilk 10'una giren oyuncular kokart kazanır.
        </p>
      </section>
    </div>
  );
}

function leagueMoveLabel(lg: League): string {
  if (lg === "bronz") return "Başlangıç ligi";
  if (lg === "hafiz") return "En üst lig";
  return "Terfi & tenzil";
}
