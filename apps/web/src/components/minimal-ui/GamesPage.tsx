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
    img: "/images/games/mahfuz-fill-in-the-blank.webp",
    path: "/games/fill-blank",
  },
  {
    id: "surah-guess",
    t: GAME_TITLES["surah-guess"]!,
    tag: "Sûreler",
    s: "Türkçe anlama bakıp doğru sûreyi seç.",
    img: "/images/games/mahfuz-surah-recognition.webp",
    path: "/games/surah-guess",
  },
  {
    id: "word-meaning",
    t: GAME_TITLES["word-meaning"]!,
    tag: "Arapça",
    s: "Kur'an Arapçasında sık geçen kelimeleri öğren.",
    img: "/images/games/mahfuz-word-meaning.webp",
    path: "/games/word-meaning",
  },
  {
    id: "verse-chain",
    t: GAME_TITLES["verse-chain"]!,
    tag: "Hifz",
    s: "Ayetleri doğru sıraya dizerek zinciri tamamla.",
    img: "/images/games/mahfuz-verse-chain.webp",
    path: "/games/verse-chain",
  },
  {
    id: "hexagon",
    t: GAME_TITLES["hexagon"]!,
    tag: "Elifba",
    s: "Arap harflerini Latin karşılıklarıyla eşleştir.",
    img: "/images/games/mahfuz-hexagon-letters.webp",
    path: "/games/hexagon",
  },
  {
    id: "kelime-tahmini",
    t: GAME_TITLES["kelime-tahmini"]!,
    tag: "Bulmaca",
    s: "Türkçe ipucundan gizli Arapça kelimeyi 6 denemede bul.",
    img: "/images/games/mahfuz-kelime-tahmini.webp",
    path: "/games/kelime-tahmini",
  },
  {
    id: "ayet-2048",
    t: GAME_TITLES["ayet-2048"]!,
    tag: "Bulmaca",
    s: "Aynı sureleri birleştirerek Tegabun'a (64) ulaş.",
    img: "/images/games/mahfuz-ayet-2048.webp",
    path: "/games/ayah-2048",
  },
  {
    id: "word-match",
    t: GAME_TITLES["word-match"]!,
    tag: "Bulmaca",
    s: "Türkçe anlamla Arapça kelimeyi eşleştir.",
    img: "/images/games/mahfuz-word-match.webp",
    path: "/games/word-match",
  },
];

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
      {/* Hero — minimal, centered */}
      <section className="mu-games-hero">
        <p className="mu-eyebrow">
          <span className="mu-eb-line" />
          {t.gamesHub?.title ?? "Oyunlar"}
          <span className="mu-eb-line" />
        </p>
        <h1 className="mu-display">
          Ayetleri, harfleri,<span className="mu-display-accent"> hafızana nakşet.</span>
        </h1>
        <p className="mu-lede">
          Kısa, odaklı oyunlarla her gün 5 dakika.
        </p>
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

      {/* Game list — App Store-style rows */}
      <ul className="mu-games-list">
        {list.map((g) => (
          <li key={g.id}>
            <Link to={g.path as any} className="mu-grow">
              <img
                src={g.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="mu-grow-icon"
              />
              <span className="mu-grow-meta">
                <span className="mu-grow-title">{g.t}</span>
                <span className="mu-grow-desc">{g.s}</span>
                <span className="mu-grow-tag">{g.tag}</span>
              </span>
              <span className="mu-grow-chev" aria-hidden="true">{MuIcons.chev}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Leaderboard */}
      <section className="mu-games-lboard">
        <div className="mu-games-lboard-head">
          <h2 className="mu-h2">Skor Tablosu</h2>
          <Link to="/games/scoreboard" className="mu-link-arrow">
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
        <div className="mu-games-foot">
          <Link to="/meclis" className="mu-link-arrow">Meclis {MuIcons.arrowRight}</Link>
        </div>
      </section>
    </div>
  );
}

