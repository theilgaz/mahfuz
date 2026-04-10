/**
 * Oyunlar hub
 */

import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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
  icon: ReactNode;
  surahScoped?: boolean;
}

type T = ReturnType<typeof useTranslation>["t"];

// ── Icons ──────────────────────────────────────────────────

const IcPuzzle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-3.408 0l-1.569-1.567a.877.877 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a.876.876 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69a.979.979 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.402 2.402 0 0 1 3.408 0l1.567 1.566c.25.25.537.375.878.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z" />
  </svg>
);

const IcLink = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IcMic = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const IcEar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 0 1-7 0" />
    <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 0 0 4 0" />
  </svg>
);

const IcBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IcHexagon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 7 22 17 12 22 2 17 2 7" />
    <path d="M12 2v20M2 7l10 5 10-5M2 17l10-5 10 5" />
  </svg>
);

const IcVolume = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const IcLayers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IcClipboard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IcBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z" />
  </svg>
);

const IcZap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IcText = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const IcCloud = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IcNetwork = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <line x1="12" y1="12" x2="12" y2="8" />
  </svg>
);

const IcShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IcUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ── Game data ──────────────────────────────────────────────

const DEVELOPERS_CHOICE_IDS = ["kelime-doldurma", "ayet-zinciri", "kelime-anlami", "hexagon-harf"];

function makeGames(t: T): Game[] {
  return [
    { id: "kelime-doldurma", icon: <IcPuzzle />, title: t.gamesHub.fillBlankTitle, description: t.gamesHub.fillBlankDesc, category: t.gamesHub.catHifz, link: "/games/fill-blank", surahScoped: true },
    { id: "ayet-zinciri", icon: <IcLink />, title: t.gamesHub.verseChainTitle, description: t.gamesHub.verseChainDesc, category: t.gamesHub.catHifz, link: "/games/verse-chain", surahScoped: true },
    { id: "kiraet-karaoke", icon: <IcMic />, title: t.gamesHub.reciteKaraokeTitle, description: t.gamesHub.reciteKaraokeDesc, category: t.gamesHub.catHifz, link: "/recite" },
    { id: "sure-tanima", icon: <IcEar />, title: t.gamesHub.surahGuessTitle, description: t.gamesHub.surahGuessDesc, category: t.gamesHub.catListening, link: "/games/surah-guess", surahScoped: true },
    { id: "kelime-anlami", icon: <IcBook />, title: t.gamesHub.wordMeaningTitle, description: t.gamesHub.wordMeaningDesc, category: t.gamesHub.catWord, link: "/games/word-meaning" },
    { id: "hexagon-harf", icon: <IcHexagon />, title: t.gamesHub.hexagonTitle, description: t.gamesHub.hexagonDesc, category: t.gamesHub.catWord, link: "/games/hexagon" },
  ];
}

function makeElifbaGames(t: T): Game[] {
  return [
    { id: "elifba-sesli-quiz", icon: <IcVolume />, title: t.gamesHub.voiceQuizTitle, description: t.gamesHub.voiceQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/voice" },
    { id: "elifba-form-quiz", icon: <IcLayers />, title: t.gamesHub.formQuizTitle, description: t.gamesHub.formQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/forms" },
    { id: "elifba-karisik-sinav", icon: <IcClipboard />, title: t.gamesHub.mixedExamTitle, description: t.gamesHub.mixedExamDesc, category: t.gamesHub.catElifba, link: "/alifba/exam" },
    { id: "elifba-hafiza", icon: <IcBrain />, title: t.gamesHub.memoryGameTitle, description: t.gamesHub.memoryGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/memory" },
    { id: "elifba-hiz", icon: <IcZap />, title: t.gamesHub.speedGameTitle, description: t.gamesHub.speedGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/speed" },
    { id: "elifba-harf-bul", icon: <IcSearch />, title: t.gamesHub.letterFindTitle, description: t.gamesHub.letterFindDesc, category: t.gamesHub.catElifba, link: "/alifba/games/fill" },
    { id: "elifba-kelime-bul", icon: <IcText />, title: t.gamesHub.wordFindTitle, description: t.gamesHub.wordFindDesc, category: t.gamesHub.catElifba, link: "/alifba/games/word" },
  ];
}

function makeComingSoon(t: T): Omit<Game, "link">[] {
  return [
    { id: "kelime-yagmuru", icon: <IcCloud />, title: t.gamesHub.wordRainTitle, description: t.gamesHub.wordRainDesc, category: t.gamesHub.catWord },
    { id: "baglanti-oyunu", icon: <IcNetwork />, title: t.gamesHub.connectionTitle, description: t.gamesHub.connectionDesc, category: t.gamesHub.catLogic },
    { id: "musretek-kok", icon: <IcShare />, title: t.gamesHub.commonRootTitle, description: t.gamesHub.commonRootDesc, category: t.gamesHub.catWord },
    { id: "kissadan-hisse", icon: <IcBook />, title: t.gamesHub.moralTitle, description: t.gamesHub.moralDesc, category: t.gamesHub.catLogic },
    { id: "rakip-mod", icon: <IcUsers />, title: t.gamesHub.rivalTitle, description: t.gamesHub.rivalDesc, category: t.gamesHub.catHifz },
  ];
}

// ── Components ─────────────────────────────────────────────

function StarButton({ id, t }: { id: string; t: T }) {
  const toggle = useGamesFavoritesStore((s) => s.toggle);
  const isFavorite = useGamesFavoritesStore((s) => s.isFavorite(id));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className="absolute top-1.5 right-1.5 p-1"
      aria-label={isFavorite ? t.gamesHub.removeFavorite : t.gamesHub.addFavorite}
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        className={isFavorite ? "text-amber-400" : "text-[var(--color-border)]"}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

function GameCard({ game, t, showStar = true }: { game: Game; t: T; showStar?: boolean }) {
  const selectedSurahIds = useSurahSelectionStore((s) => s.selectedSurahIds);

  return (
    <Link
      to={game.link as "/recite"}
      className="relative flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/20 active:scale-95 transition-all p-2 text-center overflow-hidden"
    >
      <span className="text-[var(--color-accent)]">{game.icon}</span>
      <p className="text-[10px] font-medium text-[var(--color-text-primary)] leading-tight line-clamp-2 w-full px-0.5">{game.title}</p>
      {game.surahScoped && selectedSurahIds.length > 0 && (
        <span className="text-[9px] text-[var(--color-accent)] font-medium leading-none">
          {selectedSurahIds.length} sure
        </span>
      )}
      {showStar && <StarButton id={game.id} t={t} />}
    </Link>
  );
}

function GamesGrid({ games, t, showStar = true }: { games: Game[]; t: T; showStar?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {games.map((g) => (
        <GameCard key={g.id} game={g} t={t} showStar={showStar} />
      ))}
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

      {/* Inner tab bar */}
      <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
        {[
          { key: "mine", label: t.gamesHub.tabMine },
          { key: "global", label: t.gamesHub.tabGlobal },
          { key: "game", label: t.gamesHub.tabByGame },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
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
          ) : !myStats || myStats.length === 0 ? (
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
          !globalBoard || globalBoard.length === 0 ? (
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
              {GAME_IDS.map((id) => (
                <option key={id} value={id}>{GAME_TITLES[id]}</option>
              ))}
            </select>
            {!gameBoard || gameBoard.length === 0 ? (
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

  const GAMES = makeGames(t);
  const ELIFBA_GAMES = makeElifbaGames(t);
  const COMING_SOON = makeComingSoon(t);

  const devsChoice = GAMES.filter((g) => DEVELOPERS_CHOICE_IDS.includes(g.id));

  const allFavoritable = [...GAMES, ...ELIFBA_GAMES];
  const favorites = allFavoritable.filter((g) => favoriteIds.includes(g.id));
  const mainGames = GAMES.filter((g) => !favoriteIds.includes(g.id));
  const elifbaGames = ELIFBA_GAMES.filter((g) => !favoriteIds.includes(g.id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Page header + tab bar */}
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
          {/* Developer's Choice */}
          <section>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Developer's Choice</p>
            <div className="grid grid-cols-4 gap-3">
              {devsChoice.map((g) => (
                <GameCard key={g.id} game={g} t={t} showStar={false} />
              ))}
            </div>
          </section>

          {/* Favoriler */}
          {favorites.length > 0 && (
            <section>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">{t.gamesHub.sectionFavorites}</p>
              <GamesGrid games={favorites} t={t} />
            </section>
          )}

          {/* Ana oyunlar */}
          {mainGames.length > 0 && (
            <section>
              {favorites.length > 0 && (
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">{t.gamesHub.sectionGames}</p>
              )}
              <GamesGrid games={mainGames} t={t} />
            </section>
          )}

          {/* Elifba */}
          {elifbaGames.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
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
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">{t.gamesHub.sectionComingSoon}</p>
            <div className="grid grid-cols-3 gap-3 opacity-50 pointer-events-none">
              {COMING_SOON.map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center"
                >
                  <span className="text-[var(--color-text-secondary)]">{game.icon}</span>
                  <p className="text-[10px] font-medium text-[var(--color-text-primary)] leading-tight line-clamp-2">{game.title}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
