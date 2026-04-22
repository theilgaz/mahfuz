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
import { useQuery } from "@tanstack/react-query";
import { streakQueryOptions, activeHatimQueryOptions, completedHatimsQueryOptions } from "~/hooks/useHabitQuery";
import { getMyScoreStats } from "~/lib/score-service";
import { getSurahName } from "~/lib/surah-names-i18n";
import { getSurahs } from "~/lib/quran-service";
import { MuIcons } from "./icons";
import { useMemo, useState } from "react";

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
            {user.name || "Kullanıcı"}
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
