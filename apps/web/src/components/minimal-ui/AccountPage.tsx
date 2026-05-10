/**
 * Account/Profile page -- editorial layout with reading journey, stats, navigation.
 */

import { Link, useRouter } from "@tanstack/react-router";
import { signOut } from "~/lib/auth-client";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useReadingStore } from "~/stores/reading.store";
import { useHifzStore, computeHifzStats, SURAH_VERSE_COUNTS } from "~/stores/hifz.store";
import { useStudiedStore } from "~/stores/studied.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { streakQueryOptions, activeHatimQueryOptions, completedHatimsQueryOptions } from "~/hooks/useHabitQuery";
import { getMyScoreStats, getMyLeagueStatus, getMyTrophies, getMySeasonStanding } from "~/lib/score-service";
import {
  getMyDisplayNameMode,
  setDisplayNameMode,
  formatDisplayName,
  DISPLAY_NAME_MODES,
  type DisplayNameMode,
} from "~/lib/display-name";
import { getSurahName } from "~/lib/surah-names-i18n";
import { getSurahs } from "~/lib/quran-service";
import { LEAGUE_LABELS } from "~/lib/league";
import { LeagueBadge, MedalLeague, RosetteIcon, TrophyIcon } from "./LeagueIcons";
import { MuIcons } from "./icons";
import { useMemo, useState } from "react";
import { GAME_TITLES } from "~/lib/score-service";

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
  const { data: leagueStatus } = useQuery({
    queryKey: ["my-league"],
    queryFn: () => getMyLeagueStatus(),
    staleTime: 60_000,
  });
  const { data: seasonStanding } = useQuery({
    queryKey: ["my-season-standing"],
    queryFn: () => getMySeasonStanding(),
    staleTime: 60_000,
  });
  const { data: trophies } = useQuery({
    queryKey: ["my-trophies"],
    queryFn: () => getMyTrophies(),
    staleTime: 60_000,
  });

  const studiedIds = useStudiedStore((s) => s.surahIds);
  const toggleStudied = useStudiedStore((s) => s.toggleSurah);

  const { data: allSurahs = [] } = useQuery({
    queryKey: ["quran", "surahs"],
    queryFn: () => getSurahs(),
    staleTime: Infinity,
  });
  const surahMap = useMemo(() => new Map(allSurahs.map((s) => [s.id, s])), [allSurahs]);

  const initial = user.name?.[0]?.toUpperCase() || "?";
  const hatimProgress = activeHatim ? Math.round((activeHatim.lastPage / 604) * 100) : 0;
  const totalGameScore = gameStats?.reduce((s, g) => s + g.totalScore, 0) ?? 0;
  const totalGamePlays = gameStats?.reduce((s, g) => s + g.totalPlays, 0) ?? 0;
  const trophyCount = (trophies?.champions.length ?? 0) + (trophies?.rosettes.length ?? 0);

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
          <h1 className="mu-display" style={{ fontSize: 36, display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {user.name || "Kullanıcı"}
            {leagueStatus && <LeagueBadge league={leagueStatus.league} size={20} showLabel />}
            {trophyCount > 0 && (
              <span
                title={`${trophyCount} kupa`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 16, color: "var(--mu-muted)" }}
              >
                <TrophyIcon size={18} />
                {trophyCount}
              </span>
            )}
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
          <span className="mu-astat-l">Bugün</span>
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
            <span className="mu-muted" style={{ fontSize: 12 }}>%{hatimProgress} tamamlandı</span>
            {completedHatims && completedHatims.length > 0 && (
              <span className="mu-muted" style={{ fontSize: 12 }}>
                {completedHatims.length} hatim tamamlandı
              </span>
            )}
          </div>
        </section>
      )}

      {/* Ezberim (2/3) + Calistiklarim (1/3) */}
      <div className="mu-profile-duo">
        <MemorizedCard memorized={memorized} hifzStats={hifzStats} locale={locale} />

        <StudiedCard
          studiedIds={studiedIds}
          surahMap={surahMap}
          allSurahs={allSurahs}
          locale={locale}
          onToggle={toggleStudied}
          t={t}
        />
      </div>

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
              <span className="mu-astat-l">Çeşit</span>
            </div>
          </div>
        </section>
      )}

      {/* Lig kartı */}
      {leagueStatus && (
        <LeagueCard totalScore={leagueStatus.totalScore} league={leagueStatus.league} standing={seasonStanding ?? null} />
      )}

      {/* Kupalarım */}
      {trophies && trophyCount > 0 && (
        <TrophiesCard trophies={trophies} />
      )}

      {/* Gizlilik: liderlik tablosunda görünüm */}
      <PrivacyCard userId={user.id} userName={user.name ?? ""} />

      {/* Navigation grid */}
      <nav className="mu-account-grid">
        <Link to="/hifz" className="mu-account-grid-item">
          <span className="mu-account-grid-icon">{MuIcons.brain}</span>
          <strong>{t.hub.hifz}</strong>
          {hifzStats.totalVerses > 0 && (
            <span className="mu-account-grid-badge">{hifzStats.totalVerses}</span>
          )}
        </Link>

        <Link to="/bookmarks" className="mu-account-grid-item">
          <span className="mu-account-grid-icon">{MuIcons.bookmark}</span>
          <strong>{t.hub.bookmarks}</strong>
          {bookmarkCount > 0 && (
            <span className="mu-account-grid-badge">{bookmarkCount}</span>
          )}
        </Link>

        <Link to="/notes" className="mu-account-grid-item">
          <span className="mu-account-grid-icon">{MuIcons.note}</span>
          <strong>{t.hub.notes}</strong>
        </Link>

        <Link to="/games" className="mu-account-grid-item">
          <span className="mu-account-grid-icon">{MuIcons.games}</span>
          <strong>{t.hub.games}</strong>
          {totalGamePlays > 0 && (
            <span className="mu-account-grid-badge">{totalGamePlays}</span>
          )}
        </Link>

        <Link to="/premium" className="mu-account-grid-item">
          <span className="mu-account-grid-icon">{MuIcons.settings}</span>
          <strong>{t.hub.premium}</strong>
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

/* ── Ezberim karti ───────────────────────────────── */

function MemorizedCard({
  memorized,
  hifzStats,
  locale,
}: {
  memorized: Record<number, number[]>;
  hifzStats: { totalVerses: number; completeSurahs: number; activeSurahs: number; percentage: number };
  locale: string;
}) {
  const entries = useMemo(() => {
    return Object.entries(memorized)
      .filter(([, verses]) => verses && verses.length > 0)
      .map(([id, verses]) => {
        const surahId = Number(id);
        const total = SURAH_VERSE_COUNTS[surahId] ?? 0;
        const complete = verses.length === total;
        return { surahId, count: verses.length, total, complete };
      })
      .sort((a, b) => a.surahId - b.surahId);
  }, [memorized]);

  return (
    <section className="mu-profile-card" style={{ margin: 0 }}>
      <div className="mu-profile-card-header">
        <span className="mu-profile-card-title">Ezberim</span>
        <Link to="/hifz" className="mu-muted" style={{ fontSize: 12, textDecoration: "none" }}>
          Düzenle {MuIcons.arrowRight}
        </Link>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div className="mu-profile-progress-bar" style={{ flex: 1 }}>
          <div
            className="mu-profile-progress-fill"
            style={{ width: `${hifzStats.percentage}%` }}
          />
        </div>
        <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)", flexShrink: 0 }}>
          %{hifzStats.percentage.toFixed(1)}
        </span>
      </div>

      {/* Surah chips */}
      {entries.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {entries.map(({ surahId, count, total, complete }) => (
            <span
              key={surahId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 6,
                background: complete ? "var(--mu-accent-soft)" : "var(--mu-bg-soft)",
                color: complete ? "var(--mu-accent-ink)" : "var(--mu-ink-3)",
              }}
            >
              {getSurahName(surahId, locale)}
              {!complete && (
                <span style={{ fontSize: 10, color: "var(--mu-muted)" }}>
                  {count}/{total}
                </span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="mu-muted" style={{ fontSize: 12 }}>
          Henüz ezberlediğin sure yok
        </p>
      )}

      {/* Stats footer */}
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <span className="mu-muted" style={{ fontSize: 12 }}>
          {hifzStats.completeSurahs} sure tam
        </span>
        <span className="mu-muted" style={{ fontSize: 12 }}>
          {hifzStats.activeSurahs} sure aktif
        </span>
      </div>
    </section>
  );
}

/* ── Calistiklarim karti ──────────────────────────── */

function StudiedCard({
  studiedIds,
  surahMap,
  allSurahs,
  locale,
  onToggle,
  t,
}: {
  studiedIds: number[];
  surahMap: Map<number, { id: number; nameSimple: string; nameArabic: string; ayahCount: number }>;
  allSurahs: { id: number; nameSimple: string; nameArabic: string; ayahCount: number }[];
  locale: string;
  onToggle: (id: number) => void;
  t: any;
}) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? allSurahs.filter(
        (s) =>
          s.nameSimple.toLowerCase().includes(search.toLowerCase()) ||
          s.nameArabic.includes(search) ||
          String(s.id).includes(search),
      )
    : allSurahs;

  return (
    <section className="mu-profile-card" style={{ margin: 0 }}>
      <div className="mu-profile-card-header">
        <span className="mu-profile-card-title">{t.profile.studied}</span>
        <button
          onClick={() => { setEditing((v) => !v); setSearch(""); }}
          className="mu-muted"
          style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
        >
          {editing ? t.profile.studiedDone : t.profile.studiedEdit}
        </button>
      </div>

      {/* Mevcut liste */}
      {studiedIds.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {studiedIds.map((id) => {
            const name = getSurahName(id, locale) || surahMap.get(id)?.nameSimple || `${id}`;
            return (
              <span
                key={id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "var(--mu-bg-soft)",
                  color: "var(--mu-ink-3)",
                }}
              >
                {name}
                {editing && (
                  <button
                    onClick={() => onToggle(id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "var(--mu-muted)",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    x
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : !editing ? (
        <p className="mu-muted" style={{ fontSize: 12 }}>
          {t.profile.studiedEmpty}
        </p>
      ) : null}

      {/* Duzenleme: sure ekleme */}
      {editing && (
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder={t.surahPicker.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              border: "1px solid var(--mu-line)",
              borderRadius: 10,
              background: "var(--mu-bg)",
              color: "var(--mu-ink)",
              outline: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ maxHeight: 280, overflowY: "auto", borderRadius: 10, border: "1px solid var(--mu-line)" }}>
            {filtered.map((s, i) => {
              const active = studiedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggle(s.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: 14,
                    background: active ? "var(--mu-accent-soft)" : "transparent",
                    border: "none",
                    borderTop: i > 0 ? "1px solid var(--mu-line)" : "none",
                    cursor: "pointer",
                    color: active ? "var(--mu-accent-ink)" : "var(--mu-ink)",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: active ? "none" : "1.5px solid var(--mu-line-2)",
                    background: active ? "var(--mu-accent)" : "transparent",
                    color: "#fff", fontSize: 12,
                  }}>
                    {active && MuIcons.check}
                  </span>
                  <span style={{ width: 26, fontSize: 12, color: "var(--mu-muted)", fontFamily: "var(--mu-ff-mono)", flexShrink: 0 }}>
                    {s.id}
                  </span>
                  <span style={{ flex: 1, fontWeight: active ? 500 : 400 }}>{getSurahName(s.id, locale) || s.nameSimple}</span>
                  <span style={{ fontFamily: "var(--font-arabic, var(--mu-ff-ar))", fontSize: 14, color: "var(--mu-muted)" }} dir="rtl">
                    {s.nameArabic}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Lig karti ────────────────────────────────────── */

function LeagueCard({
  totalScore,
  league,
  standing,
}: {
  totalScore: number;
  league: import("~/lib/league").League;
  standing: import("~/lib/score-service").MySeasonStanding | null;
}) {
  const inPromoteZone = standing && standing.myRank > 0 && standing.promoteCount > 0
    && standing.myRank <= standing.promoteCount;
  const inDemoteZone = standing && standing.myRank > 0 && standing.demoteCount > 0
    && standing.myRank > standing.bucketSize - standing.demoteCount;

  let hint: string;
  if (!standing || standing.bucketSize === 0) {
    hint = "Sezon yeni başladı. Bir oyun oyna ve lige adım at.";
  } else if (standing.myRank === 0) {
    hint = `Bu sezon henüz oynamadın. ${standing.bucketSize} kişiyle yarışacaksın.`;
  } else if (standing.bucketSize < 3) {
    hint = "Bu sezon ligin yeterince kalabalık değil — en az 3 oyuncu gerekli.";
  } else if (inPromoteZone && standing.promoteTarget) {
    hint = `Şu an terfi bandındasın — ${LEAGUE_LABELS[standing.promoteTarget]} ligine yükseliyorsun.`;
  } else if (inDemoteZone && standing.demoteTarget) {
    const need = standing.safeFloor != null ? Math.max(0, standing.safeFloor - standing.seasonMax + 1) : null;
    hint = need != null && need > 0
      ? `Tenzil bandındasın — ${LEAGUE_LABELS[standing.demoteTarget]} ligine düşmemek için ${need.toLocaleString("tr")} puan üzerine bir tek skor at.`
      : `Tenzil bandındasın — daha iyi bir skor atmaya çalış.`;
  } else if (standing.promoteTarget && standing.promoteFloor != null) {
    const need = Math.max(0, standing.promoteFloor - standing.seasonMax + 1);
    hint = need > 0
      ? `${LEAGUE_LABELS[standing.promoteTarget]} ligine terfi için ${need.toLocaleString("tr")} puan üzerine bir tek skor at.`
      : `${LEAGUE_LABELS[standing.promoteTarget]} ligine terfi mesafesindesin.`;
  } else if (!standing.promoteTarget) {
    hint = "En üst ligdesin — sezon sonu ilk 3'te kal, kupayı kapma şansını koru.";
  } else {
    hint = "Sezon sonunda ilk 3'e gir, üst lige yüksel.";
  }

  return (
    <section className="mu-profile-card">
      <div className="mu-profile-card-header">
        <span className="mu-profile-card-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <MedalLeague league={league} size={22} />
          {LEAGUE_LABELS[league]} Ligi
        </span>
        {standing && standing.myRank > 0 && (
          <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)" }}>
            sezon: {standing.myRank}/{standing.bucketSize}
          </span>
        )}
      </div>

      {standing && standing.bucketSize > 0 && (
        <ZoneBar
          rank={standing.myRank}
          size={standing.bucketSize}
          promote={standing.promoteCount}
          demote={standing.demoteCount}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 12 }}>
        <span className="mu-muted" style={{ fontSize: 12 }}>{hint}</span>
        <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)", whiteSpace: "nowrap" }}>
          {totalScore.toLocaleString("tr")} pt
        </span>
      </div>
    </section>
  );
}

function ZoneBar({ rank, size, promote, demote }: { rank: number; size: number; promote: number; demote: number }) {
  const total = Math.max(size, 1);
  const promotePct = (promote / total) * 100;
  const demotePct = (demote / total) * 100;
  const safePct = Math.max(0, 100 - promotePct - demotePct);
  // Marker: rank 1 = sol uç (top); rank size = sağ uç (bottom). 0 = oynamadı, en sağa koy.
  const markerPct = rank === 0 ? 100 : ((rank - 0.5) / total) * 100;
  return (
    <div style={{ position: "relative", height: 10, borderRadius: 6, overflow: "hidden", marginTop: 4, display: "flex" }}>
      <div style={{ width: `${promotePct}%`, background: "rgba(212, 164, 55, 0.55)" }} />
      <div style={{ width: `${safePct}%`, background: "var(--mu-line)" }} />
      <div style={{ width: `${demotePct}%`, background: "rgba(180, 70, 70, 0.45)" }} />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -2,
          left: `calc(${markerPct}% - 5px)`,
          width: 10,
          height: 14,
          borderRadius: 3,
          background: "var(--mu-ink)",
          boxShadow: "0 0 0 2px var(--mu-bg-card)",
        }}
      />
    </div>
  );
}

/* ── Kupalarım karti ──────────────────────────────── */

function TrophiesCard({ trophies }: { trophies: import("~/lib/score-service").MyTrophies }) {
  return (
    <section className="mu-profile-card">
      <div className="mu-profile-card-header">
        <span className="mu-profile-card-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <TrophyIcon size={20} />
          Kupalarım
        </span>
        <span className="mu-muted" style={{ fontSize: 12 }}>
          {trophies.champions.length + trophies.rosettes.length} ödül
        </span>
      </div>

      {trophies.champions.length > 0 && (
        <div style={{ marginBottom: trophies.rosettes.length > 0 ? 16 : 0 }}>
          <p className="mu-muted" style={{ fontSize: 12, marginBottom: 8 }}>Şampiyonluklar</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {trophies.champions.map((c, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MedalLeague league={c.league} size={28} />
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {c.scope === "global" ? "Genel" : (GAME_TITLES[c.scope] ?? c.scope)} · {c.rank}.
                  </span>
                  <span className="mu-muted" style={{ fontSize: 12 }}>{c.seasonName}</span>
                </div>
                <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)" }}>
                  {c.score.toLocaleString("tr")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trophies.rosettes.length > 0 && (
        <div>
          <p className="mu-muted" style={{ fontSize: 12, marginBottom: 8 }}>Sezon Katılımı (top 10)</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {trophies.rosettes.map((r, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RosetteIcon league={r.league} size={24} />
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontSize: 14 }}>{r.rank}.</span>
                  <span className="mu-muted" style={{ fontSize: 12 }}>{r.seasonName}</span>
                </div>
                <span className="mu-muted" style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)" }}>
                  {r.score.toLocaleString("tr")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ── Gizlilik karti ──────────────────────────────────── */

const MODE_LABELS: Record<DisplayNameMode, string> = {
  full: "Tam adım",
  initials: "Baş harflerim",
  anonymous: "Anonim",
};

const MODE_HINTS: Record<DisplayNameMode, string> = {
  full: "Liderlik tablosunda tam adın görünür.",
  initials: "Yalnızca baş harflerin görünür.",
  anonymous: "Adın yerine \u201cMahfuz Kullanıcısı\u201d ve kısa bir kod görünür.",
};

function PrivacyCard({ userId, userName }: { userId: string; userName: string }) {
  const qc = useQueryClient();
  const { data: mode } = useQuery({
    queryKey: ["display-name-mode"],
    queryFn: () => getMyDisplayNameMode(),
    staleTime: 5 * 60_000,
  });
  const current: DisplayNameMode = mode ?? "full";

  const mutation = useMutation({
    mutationFn: (next: DisplayNameMode) => setDisplayNameMode({ data: next }),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["display-name-mode"] });
      const prev = qc.getQueryData<DisplayNameMode>(["display-name-mode"]);
      qc.setQueryData(["display-name-mode"], next);
      return { prev };
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(["display-name-mode"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["display-name-mode"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["global-leaderboard"] });
    },
  });

  return (
    <section className="mu-profile-card">
      <div className="mu-profile-card-header">
        <span className="mu-profile-card-title">Liderlik tablosunda görünüm</span>
      </div>
      <p className="mu-muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 12 }}>
        Adının başkalarına nasıl görüneceğini seç. Kendi satırında her zaman tam adın görünür.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DISPLAY_NAME_MODES.map((m) => {
          const isActive = current === m;
          const preview = formatDisplayName(userName, m, userId);
          return (
            <label
              key={m}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${isActive ? "var(--mu-accent)" : "var(--color-border)"}`,
                background: isActive ? "var(--mu-accent-soft)" : "transparent",
                cursor: mutation.isPending ? "wait" : "pointer",
                transition: "background 120ms, border-color 120ms",
              }}
            >
              <input
                type="radio"
                name="display-name-mode"
                value={m}
                checked={isActive}
                disabled={mutation.isPending}
                onChange={() => mutation.mutate(m)}
                style={{ accentColor: "var(--mu-accent, #9a7b2d)" }}
              />
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{MODE_LABELS[m]}</span>
                <span className="mu-muted" style={{ fontSize: 12 }}>{MODE_HINTS[m]}</span>
              </div>
              <span
                className="mu-muted"
                style={{ fontSize: 12, fontFamily: "var(--mu-ff-mono)", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={preview}
              >
                {preview}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
