/**
 * Oyunlar hub
 */

import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSurahSelectionStore } from "~/stores/surahSelection.store";
import { useGamesFavoritesStore } from "~/stores/gamesFavorites.store";
import { useTranslation } from "~/hooks/useTranslation";
import {
  getGameLeaderboard,
  getGlobalLeaderboard,
  getMyScoreStats,
  GAME_TITLES,
  GAME_IDS,
  type LeaderboardEntry,
  type MyGameStat,
} from "~/lib/score-service";

export const Route = createFileRoute("/games/")({
  component: GamesPage,
});

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  img?: string;
  surahScoped?: boolean;
  colors?: { bg: string; glow: string };
}

type T = ReturnType<typeof useTranslation>["t"];

// ── Game data ──────────────────────────────────────────────

const EDITORS_CHOICE_IDS = ["kelime-doldurma", "ayet-zinciri", "kelime-anlami", "hexagon-harf"];

const GAME_IMGS: Record<string, string> = {
  "kelime-doldurma":      "/images/games/mahfuz-fill-in-the-blank.webp",
  "ayet-zinciri":         "/images/games/mahfuz-verse-chain.webp",
  "kiraet-karaoke":       "/images/games/mahfuz-recitation-karaoke.webp",
  "sure-tanima":          "/images/games/mahfuz-surah-recognition.webp",
  "kelime-anlami":        "/images/games/mahfuz-word-meaning.webp",
  "hexagon-harf":         "/images/games/mahfuz-hexagon-letters.webp",
  "elifba-sesli-quiz":    "/images/games/mahfuz-voice-quiz.webp",
  "elifba-form-quiz":     "/images/games/mahfuz-form-quiz.webp",
  "elifba-karisik-sinav": "/images/games/mahfuz-mixed-exam.webp",
  "elifba-hafiza":        "/images/games/mahfuz-memory-game.webp",
  "elifba-hiz":           "/images/games/mahfuz-speed-game.webp",
  "elifba-harf-bul":      "/images/games/mahfuz-letter-find.webp",
  "elifba-kelime-bul":    "/images/games/mahfuz-word-find.webp",
};

const GAME_COLORS: Record<string, { bg: string; glow: string }> = {
  "kelime-doldurma":      { bg: "#C4A882", glow: "#8B6914" },
  "ayet-zinciri":         { bg: "#1B4A3B", glow: "#C9A84C" },
  "kelime-anlami":        { bg: "#D4A845", glow: "#8B5E1A" },
  "hexagon-harf":         { bg: "#1A3D2B", glow: "#2D6B4A" },
  "kiraet-karaoke":       { bg: "#7B4A2D", glow: "#C4814A" },
  "sure-tanima":          { bg: "#B8C9B0", glow: "#5C7A55" },
  "elifba-sesli-quiz":    { bg: "#1B2B4A", glow: "#4A7BB5" },
  "elifba-form-quiz":     { bg: "#C49B6B", glow: "#8B6B3A" },
  "elifba-karisik-sinav": { bg: "#2D6B5A", glow: "#4A9B7B" },
  "elifba-hafiza":        { bg: "#4A3B1B", glow: "#A07830" },
  "elifba-hiz":           { bg: "#0D1117", glow: "#00D4FF" },
  "elifba-harf-bul":      { bg: "#C4A070", glow: "#8B5E1A" },
  "elifba-kelime-bul":    { bg: "#B8B870", glow: "#7A7A20" },
};

function makeGames(t: T): Game[] {
  const games: Game[] = [
    { id: "kelime-doldurma", img: GAME_IMGS["kelime-doldurma"], title: t.gamesHub.fillBlankTitle, description: t.gamesHub.fillBlankDesc, category: t.gamesHub.catHifz, link: "/games/fill-blank", surahScoped: true },
    { id: "ayet-zinciri", img: GAME_IMGS["ayet-zinciri"], title: t.gamesHub.verseChainTitle, description: t.gamesHub.verseChainDesc, category: t.gamesHub.catHifz, link: "/games/verse-chain", surahScoped: true },
    { id: "kiraet-karaoke", img: GAME_IMGS["kiraet-karaoke"], title: t.gamesHub.reciteKaraokeTitle, description: t.gamesHub.reciteKaraokeDesc, category: t.gamesHub.catHifz, link: "/recite" },
    { id: "sure-tanima", img: GAME_IMGS["sure-tanima"], title: t.gamesHub.surahGuessTitle, description: t.gamesHub.surahGuessDesc, category: t.gamesHub.catListening, link: "/games/surah-guess", surahScoped: true },
    { id: "kelime-anlami", img: GAME_IMGS["kelime-anlami"], title: t.gamesHub.wordMeaningTitle, description: t.gamesHub.wordMeaningDesc, category: t.gamesHub.catWord, link: "/games/word-meaning" },
    { id: "hexagon-harf", img: GAME_IMGS["hexagon-harf"], title: t.gamesHub.hexagonTitle, description: t.gamesHub.hexagonDesc, category: t.gamesHub.catWord, link: "/games/hexagon" },
  ];
  return games.map((g) => ({ ...g, colors: GAME_COLORS[g.id] }));
}

function makeElifbaGames(t: T): Game[] {
  const games: Game[] = [
    { id: "elifba-sesli-quiz", img: GAME_IMGS["elifba-sesli-quiz"], title: t.gamesHub.voiceQuizTitle, description: t.gamesHub.voiceQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/voice" },
    { id: "elifba-form-quiz", img: GAME_IMGS["elifba-form-quiz"], title: t.gamesHub.formQuizTitle, description: t.gamesHub.formQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/forms" },
    { id: "elifba-karisik-sinav", img: GAME_IMGS["elifba-karisik-sinav"], title: t.gamesHub.mixedExamTitle, description: t.gamesHub.mixedExamDesc, category: t.gamesHub.catElifba, link: "/alifba/exam" },
    { id: "elifba-hafiza", img: GAME_IMGS["elifba-hafiza"], title: t.gamesHub.memoryGameTitle, description: t.gamesHub.memoryGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/memory" },
    { id: "elifba-hiz", img: GAME_IMGS["elifba-hiz"], title: t.gamesHub.speedGameTitle, description: t.gamesHub.speedGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/speed" },
    { id: "elifba-harf-bul", img: GAME_IMGS["elifba-harf-bul"], title: t.gamesHub.letterFindTitle, description: t.gamesHub.letterFindDesc, category: t.gamesHub.catElifba, link: "/alifba/games/fill" },
    { id: "elifba-kelime-bul", img: GAME_IMGS["elifba-kelime-bul"], title: t.gamesHub.wordFindTitle, description: t.gamesHub.wordFindDesc, category: t.gamesHub.catElifba, link: "/alifba/games/word" },
  ];
  return games.map((g) => ({ ...g, colors: GAME_COLORS[g.id] }));
}

function makeComingSoon(t: T): Omit<Game, "link">[] {
  return [
    { id: "kelime-yagmuru", title: t.gamesHub.wordRainTitle, description: t.gamesHub.wordRainDesc, category: t.gamesHub.catWord },
    { id: "baglanti-oyunu", title: t.gamesHub.connectionTitle, description: t.gamesHub.connectionDesc, category: t.gamesHub.catLogic },
    { id: "musretek-kok", title: t.gamesHub.commonRootTitle, description: t.gamesHub.commonRootDesc, category: t.gamesHub.catWord },
    { id: "kissadan-hisse", title: t.gamesHub.moralTitle, description: t.gamesHub.moralDesc, category: t.gamesHub.catLogic },
    { id: "rakip-mod", title: t.gamesHub.rivalTitle, description: t.gamesHub.rivalDesc, category: t.gamesHub.catHifz },
  ];
}

// ── Components ─────────────────────────────────────────────

function StarButton({ id, t }: { id: string; t: T }) {
  const toggle = useGamesFavoritesStore((s) => s.toggle);
  const isFavorite = useGamesFavoritesStore((s) => s.isFavorite(id));
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      className="absolute top-0 right-0 z-10 w-8 h-8"
      aria-label={isFavorite ? t.gamesHub.removeFavorite : t.gamesHub.addFavorite}
    >
      {/* Diagonal cut background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32" fill="none">
        <path d="M32 0 L32 32 L0 0 Z" fill="black" fillOpacity="0.35" />
      </svg>
      {/* Star icon */}
      <svg
        className={`absolute top-1.5 right-1.5 ${isFavorite ? "text-amber-400" : "text-white/70"}`}
        width="12" height="12" viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

function AppIcon({ img, title, glow }: { img?: string; title: string; glow?: string }) {
  const shadowStyle = glow ? { filter: `drop-shadow(0 4px 12px ${glow}60)` } : undefined;
  if (img) {
    return (
      <img
        src={img} alt={title} loading="lazy" decoding="async"
        className="w-full aspect-square object-cover"
        draggable={false} style={shadowStyle}
      />
    );
  }
  return (
    <div
      className="w-full aspect-square bg-[var(--color-accent)]/15 flex items-center justify-center"
      style={shadowStyle}
    >
      <span className="text-xl text-[var(--color-accent)]">?</span>
    </div>
  );
}

/** Standard 4-col game card */
function GameCard({ game, t, showStar = true }: { game: Game; t: T; showStar?: boolean }) {
  const selectedSurahIds = useSurahSelectionStore((s) => s.selectedSurahIds);
  return (
    <Link
      to={game.link as "/recite"}
      className="relative flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
    >
      <div className="relative w-full rounded-[22%] overflow-hidden">
        <AppIcon img={game.img} title={game.title} glow={game.colors?.glow} />
        {showStar && <StarButton id={game.id} t={t} />}
        {game.surahScoped && selectedSurahIds.length > 0 && (
          <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-[var(--color-accent)] px-1.5 py-0.5 rounded-full leading-none">
            {selectedSurahIds.length}
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-[var(--color-text-primary)] text-center leading-tight line-clamp-2 w-full px-0.5">
        {game.title}
      </p>
    </Link>
  );
}

/** App Store–style Editor's Choice card (horizontal scroll) */
function EditorChoiceCard({ game, t }: { game: Game; t: T }) {
  const selectedSurahIds = useSurahSelectionStore((s) => s.selectedSurahIds);
  const bg = game.colors?.bg ?? "#888";
  const glow = game.colors?.glow ?? "#888";

  // Determine if bg is dark (simple luminance check)
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
  const textColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";

  return (
    <Link
      to={game.link as "/recite"}
      className="relative shrink-0 active:opacity-80 transition-opacity snap-start"
      style={{ width: "min(calc(100vw - 2.5rem), 22rem)" }}
    >
      {/* Card */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${bg}dd 0%, ${bg}ff 40%, ${bg}bb 100%)`,
          boxShadow: `0 8px 32px ${glow}50`,
        }}
      >
        {/* Highlight sheen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 10%, ${isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)"} 0%, transparent 60%)` }}
        />

        {/* Content row */}
        <div className="relative flex items-center gap-4 p-4">
          {/* App icon */}
          <div className="relative w-20 h-20 shrink-0">
            {game.img && (
              <img
                src={game.img} alt={game.title} loading="eager" decoding="async"
                className="w-full h-full object-cover rounded-[22%]"
                draggable={false}
                style={{ boxShadow: `0 4px 16px ${glow}60` }}
              />
            )}
            {game.surahScoped && selectedSurahIds.length > 0 && (
              <span className="absolute -bottom-1 -left-1 text-[8px] font-bold text-white bg-[var(--color-accent)] px-1.5 py-0.5 rounded-full leading-none">
                {selectedSurahIds.length}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] mb-1 flex items-center gap-1" style={{ color: subColor }}>
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t.gamesHub.editorChoice}
            </p>
            <p className="text-[17px] font-bold leading-snug" style={{ color: textColor }}>
              {game.title}
            </p>
            <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: subColor }}>
              {game.description}
            </p>
          </div>

          {/* Star */}
          <div className="absolute top-2 right-2">
            <StarButton id={game.id} t={t} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function GamesGrid({ games, t, showStar = true }: { games: Game[]; t: T; showStar?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4">
      {games.map((g) => (
        <GameCard key={g.id} game={g} t={t} showStar={showStar} />
      ))}
    </div>
  );
}

/** App Store–style category pill strip */
function CategoryFilter({
  categories,
  selected,
  onSelect,
  allLabel,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  allLabel: string;
}) {
  const pills = [{ key: null, label: allLabel }, ...categories.map((c) => ({ key: c, label: c }))];
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5 [&::-webkit-scrollbar]:hidden">
      {pills.map(({ key, label }) => {
        const active = key === selected;
        return (
          <button
            key={label}
            onClick={() => onSelect(key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Scoreboard ─────────────────────────────────────────────

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"] as const;

function ScoreboardContent({ userId, t }: { userId?: string; t: T }) {
  const [tab, setTab] = useState<"mine" | "global" | "game">("mine");
  const [selectedGame, setSelectedGame] = useState(GAME_IDS[0]);

  const { data: myStats } = useQuery<MyGameStat[]>({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    staleTime: 30_000,
    enabled: !!userId,
  });
  const { data: globalBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["global-leaderboard"],
    queryFn: () => getGlobalLeaderboard(),
    staleTime: 60_000,
    enabled: tab === "global",
  });
  const { data: gameBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["game-leaderboard", selectedGame],
    queryFn: () => getGameLeaderboard({ data: { gameId: selectedGame } }),
    staleTime: 60_000,
    enabled: tab === "game",
  });

  const myTotal = myStats?.reduce((s, r) => s + r.bestScore, 0) ?? 0;

  return (
    <div className="space-y-4">
      {myTotal > 0 && (
        <div className="flex items-center justify-center">
          <span className="text-sm text-[var(--color-accent)] font-bold bg-[var(--color-accent)]/10 px-3 py-1 rounded-full">
            {t.gamesHub.points.replace("{total}", String(myTotal))}
          </span>
        </div>
      )}
      <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
        {([["mine", t.gamesHub.tabMine], ["global", t.gamesHub.tabGlobal], ["game", t.gamesHub.tabByGame]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === key ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {tab === "mine" && (
          !userId ? (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">
              {t.gamesHub.loginPrompt}{" "}
              <Link to="/auth/login" search={{ redirect: "/games" }} className="text-[var(--color-accent)] underline">{t.gamesHub.loginLink}</Link>
            </p>
          ) : !myStats?.length ? (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">{t.gamesHub.noGamesPlayed}</p>
          ) : (
            myStats.map((s) => (
              <div key={s.gameId} className="flex items-center justify-between py-1">
                <span className="text-xs text-[var(--color-text-secondary)]">{GAME_TITLES[s.gameId] ?? s.gameId}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">{s.totalPlays}x</span>
                  <span className="text-sm font-bold text-[var(--color-accent)]">{s.bestScore}</span>
                </div>
              </div>
            ))
          )
        )}
        {tab === "global" && (
          !globalBoard?.length ? (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">{t.gamesHub.noScores}</p>
          ) : (
            globalBoard.map((e) => (
              <div key={e.userId} className={`flex items-center gap-2 py-1 ${e.userId === userId ? "text-[var(--color-accent)]" : ""}`}>
                <span className={`text-xs font-bold w-6 text-center tabular-nums ${RANK_COLORS[e.rank - 1] ?? "text-[var(--color-text-secondary)]"}`}>{e.rank}</span>
                <span className="flex-1 text-xs truncate text-[var(--color-text-primary)]">{e.userName}</span>
                <span className="text-sm font-bold">{e.bestScore}</span>
              </div>
            ))
          )
        )}
        {tab === "game" && (
          <>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            >
              {GAME_IDS.map((id) => <option key={id} value={id}>{GAME_TITLES[id]}</option>)}
            </select>
            {!gameBoard?.length ? (
              <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">{t.gamesHub.noScoresForGame}</p>
            ) : (
              gameBoard.map((e) => (
                <div key={e.userId} className={`flex items-center gap-2 py-1 ${e.userId === userId ? "text-[var(--color-accent)]" : ""}`}>
                  <span className={`text-xs font-bold w-6 text-center tabular-nums ${RANK_COLORS[e.rank - 1] ?? "text-[var(--color-text-secondary)]"}`}>{e.rank}</span>
                  <span className="flex-1 text-xs truncate text-[var(--color-text-primary)]">{e.userName}</span>
                  <span className="text-sm font-bold">{e.bestScore}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

function GamesPage() {
  const { session } = useRouteContext({ from: "__root__" });
  const { t } = useTranslation();
  const favoriteIds = useGamesFavoritesStore((s) => s.favoriteIds);
  const [pageTab, setPageTab] = useState<"games" | "scoreboard">("games");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const GAMES = makeGames(t);
  const ELIFBA_GAMES = makeElifbaGames(t);
  const COMING_SOON = makeComingSoon(t);
  const ALL_GAMES = [...GAMES, ...ELIFBA_GAMES];

  const editorsChoice = GAMES.filter((g) => EDITORS_CHOICE_IDS.includes(g.id));

  // Unique ordered categories
  const categories = useMemo(
    () => Array.from(new Set(ALL_GAMES.map((g) => g.category))),
    [t], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Category-filtered view
  const filteredGames = selectedCategory
    ? ALL_GAMES.filter((g) => g.category === selectedCategory)
    : null;

  // Default (all) sections
  const favorites = ALL_GAMES.filter((g) => favoriteIds.includes(g.id));
  const mainGames = GAMES.filter((g) => !favoriteIds.includes(g.id));
  const elifbaGames = ELIFBA_GAMES.filter((g) => !favoriteIds.includes(g.id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.gamesHub.title}</h1>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden text-xs font-medium">
          <button
            onClick={() => setPageTab("games")}
            className={`px-3 py-1.5 transition-colors ${pageTab === "games" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"}`}
          >
            {t.gamesHub.title}
          </button>
          <button
            onClick={() => setPageTab("scoreboard")}
            className={`px-3 py-1.5 transition-colors ${pageTab === "scoreboard" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"}`}
          >
            {t.gamesHub.scoreboard}
          </button>
        </div>
      </div>

      {pageTab === "scoreboard" ? (
        <ScoreboardContent userId={session?.user?.id} t={t} />
      ) : (
        <>
          {/* ── Editor's Choice (always shown) ── */}
          <section>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t.gamesHub.editorChoice}
            </p>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {editorsChoice.map((g) => (
                <EditorChoiceCard key={g.id} game={g} t={t} />
              ))}
            </div>
          </section>

          {/* ── Category filter ── */}
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            allLabel={t.gamesHub.catAll}
          />

          {/* ── Filtered or full list ── */}
          {filteredGames ? (
            <section>
              <GamesGrid games={filteredGames} t={t} />
            </section>
          ) : (
            <>
              {/* Favoriler */}
              {favorites.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">{t.gamesHub.sectionFavorites}</p>
                  <GamesGrid games={favorites} t={t} />
                </section>
              )}

              {/* Ana oyunlar */}
              {mainGames.length > 0 && (
                <section>
                  {favorites.length > 0 && (
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">{t.gamesHub.sectionGames}</p>
                  )}
                  <GamesGrid games={mainGames} t={t} />
                </section>
              )}

              {/* Elifba */}
              {elifbaGames.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t.gamesHub.sectionElifba}</p>
                    <Link to="/alifba" className="text-[10px] text-[var(--color-accent)] hover:underline">
                      {t.gamesHub.goToElifba}
                    </Link>
                  </div>
                  <GamesGrid games={elifbaGames} t={t} />
                </section>
              )}

              {/* Yakında */}
              <section>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">{t.gamesHub.sectionComingSoon}</p>
                <div className="grid grid-cols-4 gap-x-3 gap-y-4 opacity-40 pointer-events-none">
                  {COMING_SOON.map((game) => (
                    <div key={game.id} className="flex flex-col items-center gap-1.5">
                      <div className="w-full aspect-square rounded-[22%] bg-[var(--color-border)]" />
                      <p className="text-[11px] font-medium text-[var(--color-text-primary)] text-center leading-tight line-clamp-2 w-full px-0.5">{game.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
