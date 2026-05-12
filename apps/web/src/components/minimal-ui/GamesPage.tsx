/**
 * Games hub -- game cards with difficulty, streak, leaderboard.
 * Minimal UI editorial design.
 */

import { useState } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "~/hooks/useTranslation";
import { MuIcons } from "./icons";
import { getGlobalLeaderboard, GAME_TITLES } from "~/lib/score-service";

const GAMES = [
  {
    id: "fill-blank",
    t: GAME_TITLES["fill-blank"]!,
    tag: "Kur'an",
    s: "Eksik kelimeyi seçerek ayeti doğru tamamla.",
    d: "orta" as const,
    time: "5 dk",
    xp: 80,
    path: "/games/fill-blank",
  },
  {
    id: "surah-guess",
    t: GAME_TITLES["surah-guess"]!,
    tag: "Sûreler",
    s: "Türkçe anlama bakıp doğru sûreyi seç.",
    d: "orta" as const,
    time: "3 dk",
    xp: 60,
    path: "/games/surah-guess",
  },
  {
    id: "word-meaning",
    t: GAME_TITLES["word-meaning"]!,
    tag: "Arapça",
    s: "Kur'an Arapçasında sık geçen kelimeleri öğren.",
    d: "kolay" as const,
    time: "3 dk",
    xp: 50,
    path: "/games/word-meaning",
  },
  {
    id: "verse-chain",
    t: GAME_TITLES["verse-chain"]!,
    tag: "Hifz",
    s: "Ayetleri doğru sıraya dizerek zinciri tamamla.",
    d: "zor" as const,
    time: "6 dk",
    xp: 120,
    path: "/games/verse-chain",
  },
  {
    id: "hexagon",
    t: GAME_TITLES["hexagon"]!,
    tag: "Elifba",
    s: "Arap harflerini Latin karşılıklarıyla eşleştir.",
    d: "kolay" as const,
    time: "2 dk",
    xp: 40,
    path: "/games/hexagon",
  },
  {
    id: "kelime-tahmini",
    t: GAME_TITLES["kelime-tahmini"]!,
    tag: "Bulmaca",
    s: "Türkçe ipucundan gizli Arapça kelimeyi 6 denemede bul.",
    d: "orta" as const,
    time: "5 dk",
    xp: 70,
    path: "/games/kelime-tahmini",
  },
  {
    id: "ayet-2048",
    t: GAME_TITLES["ayet-2048"]!,
    tag: "Bulmaca",
    s: "Aynı sureleri birleştirerek Tegabun'a (64) ulaş.",
    d: "zor" as const,
    time: "4 dk",
    xp: 100,
    path: "/games/ayah-2048",
  },
  {
    id: "word-match",
    t: GAME_TITLES["word-match"]!,
    tag: "Bulmaca",
    s: "Türkçe anlamla Arapça kelimeyi eşleştir.",
    d: "kolay" as const,
    time: "3 dk",
    xp: 50,
    path: "/games/word-match",
  },
];

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function GamesPageMinimal() {
  const { t } = useTranslation();
  const { session } = useRouteContext({ from: "__root__" });
  const { data: leaderboard } = useQuery({
    queryKey: ["global-leaderboard", "season"],
    queryFn: () => getGlobalLeaderboard({ data: { period: "season" } }),
    staleTime: 60_000,
  });
  const [cat, setCat] = useState("all");
  const cats = ["all", "Elifba", "Kur'an", "Sûreler", "Hifz", "Arapça", "Bulmaca"];
  const list = cat === "all" ? GAMES : GAMES.filter((g) => g.tag === cat);

  return (
    <div className="mu-games">
      {/* Top bar with scoreboard + meclis CTAs */}
      <div className="mu-games-topbar">
        <Link to="/games/scoreboard" className="mu-games-scoreboard-cta">
          <span className="mu-gscb-icon" aria-hidden="true">{MuIcons.games}</span>
          <span className="mu-gscb-label">Skor Tablosu</span>
          <span className="mu-gscb-arrow" aria-hidden="true">{MuIcons.arrowRight}</span>
        </Link>
        <Link to="/meclis" className="mu-games-meclis-cta">
          <span className="mu-gscb-icon" aria-hidden="true">{MuIcons.usersFour}</span>
          <span className="mu-gscb-label">Meclis</span>
          <span className="mu-gscb-arrow" aria-hidden="true">{MuIcons.arrowRight}</span>
        </Link>
      </div>

      {/* Hero */}
      <section className="mu-games-hero">
        <div>
          <p className="mu-eyebrow">
            <span className="mu-eb-line" />
            {t.gamesHub?.title ?? "Oyunlar"} - öğrenirken oyna
          </p>
          <h1 className="mu-display">
            Ayetleri, harfleri,<span className="mu-display-accent"> hafızana nakşet.</span>
          </h1>
          <p className="mu-lede">
            Kısa, odaklı oyunlarla Kur'an Arapçasını ve sûrelerin anlamlarını hatırında tut. Her gün 5 dakika yeter.
          </p>
        </div>
        <div>
          <StreakCard />
        </div>
      </section>

      {/* Filters */}
      <div className="mu-games-filters">
        {cats.map((c) => (
          <button
            key={c}
            className={`mu-tab ${cat === c ? "on" : ""}`}
            onClick={() => setCat(c)}
          >
            {c === "all" ? "Tümü" : c}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div className="mu-games-grid">
        {list.map((g) => (
          <Link to={g.path as any} key={g.id} style={{ textDecoration: "none", color: "inherit", display: "flex", height: "100%" }}>
            <article className="mu-gcard" style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <div className="mu-gcard-top">
                  <span className="mu-gcard-tag">{g.tag}</span>
                  <span className={`mu-gcard-diff diff-${g.d}`}>
                    <span className="dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    {g.d}
                  </span>
                </div>
                <h3>{g.t}</h3>
                <p className="mu-muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.4 }}>
                  {g.s}
                </p>
              </div>
              <div className="mu-gcard-foot">
                <span className="mu-gcard-meta">
                  <span>{g.time}</span>
                  <span className="mu-dot">-</span>
                  <span>+{g.xp} XP</span>
                </span>
                <span className="mu-btn small primary" style={{ padding: "8px 12px", fontSize: 12 }}>
                  Başla {MuIcons.arrowRight}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Leaderboard */}
      <section style={{ paddingTop: 24, borderTop: "1px solid var(--mu-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h2 className="mu-h2" style={{ margin: 0 }}>Skor Tablosu</h2>
            <span className="mu-muted" style={{ fontSize: 12 }}>Bu sezon · İlk 10</span>
          </div>
          <Link to="/games/scoreboard" className="mu-muted" style={{ fontSize: 13, textDecoration: "none" }}>
            Tümü {MuIcons.arrowRight}
          </Link>
        </div>
        <ol className="mu-lboard-compact" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.slice(0, 10).map((entry) => {
              const isYou = session?.user?.id === entry.userId;
              return (
                <li
                  key={entry.userId}
                  className={`mu-lrow ${isYou ? "you" : ""} ${entry.rank <= 3 ? `rank-${entry.rank}` : ""}`}
                >
                  <span className="mu-lrank">{entry.rank}</span>
                  <span className="mu-lname">
                    {entry.userName || "Anonim"}
                    {isYou && <span className="mu-ybadge">sen</span>}
                  </span>
                  <span className="mu-lxp">{entry.bestScore} XP</span>
                </li>
              );
            })
          ) : (
            <li className="mu-lrow">
              <span className="mu-lname mu-muted" style={{ fontSize: 13 }}>Henüz skor yok. İlk sen ol!</span>
            </li>
          )}
        </ol>
      </section>
    </div>
  );
}

function StreakCard() {
  const pattern = [1, 1, 0, 1, 0, 0, 0];
  return (
    <div className="mu-streak-card">
      <div className="mu-streak-top">
        <div>
          <p className="mu-rc-eyebrow">Seri</p>
          <p className="mu-streak-big">
            2<span>gün</span>
          </p>
        </div>
        <div className="mu-streak-flame">{MuIcons.flame}</div>
      </div>
      <div className="mu-streak-days">
        {DAYS.map((d, i) => (
          <div key={d} className={`mu-streak-day ${pattern[i] ? "on" : ""}`}>
            <span className="mu-sd-dot" />
            <span className="mu-sd-l">{d}</span>
          </div>
        ))}
      </div>
      <p className="mu-muted" style={{ fontSize: 12, margin: 0 }}>
        İki gün üst üste! Devam.
      </p>
    </div>
  );
}
