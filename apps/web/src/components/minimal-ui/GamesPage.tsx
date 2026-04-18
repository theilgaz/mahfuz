/**
 * Games hub -- game cards with difficulty, streak, leaderboard.
 * Minimal UI editorial design.
 */

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { MuIcons } from "./icons";

const GAMES = [
  {
    id: "fill-blank",
    t: "Ayet Tamamla",
    tag: "Kur'an",
    s: "Eksik kelimeyi seçerek ayeti doğru tamamla.",
    d: "orta" as const,
    time: "5 dk",
    xp: 80,
    path: "/games/fill-blank",
  },
  {
    id: "surah-guess",
    t: "Sûre Bul",
    tag: "Sûreler",
    s: "Türkçe anlama bakıp doğru sûreyi seç.",
    d: "orta" as const,
    time: "3 dk",
    xp: 60,
    path: "/games/surah-guess",
  },
  {
    id: "verse-chain",
    t: "Ayet Zinciri",
    tag: "Hifz",
    s: "Ayetleri doğru sıraya dizerek zinciri tamamla.",
    d: "zor" as const,
    time: "6 dk",
    xp: 120,
    path: "/games/verse-chain",
  },
  {
    id: "word-meaning",
    t: "Kelime Hazinesi",
    tag: "Arapça",
    s: "Kur'an Arapçasında sık geçen kelimeleri öğren.",
    d: "kolay" as const,
    time: "3 dk",
    xp: 50,
    path: "/games/word-meaning",
  },
  {
    id: "hexagon",
    t: "Hexagon Harf",
    tag: "Elifba",
    s: "Arap harflerini Latin karşılıklarıyla eşleştir.",
    d: "kolay" as const,
    time: "2 dk",
    xp: 40,
    path: "/games/hexagon",
  },
  {
    id: "ayah-2048",
    t: "Ayet 2048",
    tag: "Bulmaca",
    s: "Numaraları birleştirerek 2048'e ulaş.",
    d: "zor" as const,
    time: "4 dk",
    xp: 100,
    path: "/games/ayah-2048",
  },
];

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function GamesPageMinimal() {
  const { t } = useTranslation();
  const [cat, setCat] = useState("all");
  const cats = ["all", "Elifba", "Kur'an", "Sûreler", "Hifz", "Arapça", "Bulmaca"];
  const list = cat === "all" ? GAMES : GAMES.filter((g) => g.tag === cat);

  return (
    <div className="mu-games">
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
          <Link to={g.path as any} key={g.id} style={{ textDecoration: "none", color: "inherit" }}>
            <article className="mu-gcard">
              <div className="mu-gcard-icon">
                <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="10" y="14" width="44" height="36" rx="3" opacity="0.4" />
                  <path d="M16 24h32M16 32h22M16 40h28" opacity="0.6" />
                </svg>
              </div>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 className="mu-h2" style={{ margin: 0 }}>Haftalık sıralama</h2>
          <span className="mu-muted">Bu hafta</span>
        </div>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            { n: "Fatma K.", xp: 2840, you: false, rank: 1 },
            { n: "Ömer Y.", xp: 2610, you: false, rank: 2 },
            { n: "Zeynep A.", xp: 2430, you: false, rank: 3 },
            { n: "Sen", xp: 0, you: true, rank: "--" },
          ].map((r, i) => (
            <li
              key={i}
              className={`mu-lrow ${r.you ? "you" : ""} ${typeof r.rank === "number" && r.rank <= 3 ? `rank-${r.rank}` : ""}`}
            >
              <span className="mu-lrank">{r.rank}</span>
              <span className="mu-lname">
                {r.n}
                {r.you && <span className="mu-ybadge">sen</span>}
              </span>
              <span className="mu-lxp">{r.xp} XP</span>
            </li>
          ))}
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
