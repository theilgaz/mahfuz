/**
 * Oyunlar hub
 */

import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { GamesPageMinimal } from "~/components/minimal-ui/GamesPage";
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
  getUserAchievements,
} from "~/lib/score-service";
import { ACHIEVEMENT_DEFS } from "~/lib/game-achievements";

export const Route = createFileRoute("/games/")({
  component: GamesPageMinimal,
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

const EDITORS_CHOICE_IDS = ["kelime-doldurma", "kelime-anlami", "hexagon-harf"];

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
  "kelime-tahmini":       "/images/games/mahfuz-kelime-tahmini.webp",
  "ayet-2048":            "/images/games/mahfuz-ayet-2048.webp",
};

const GAME_COLORS: Record<string, { bg: string; glow: string }> = {
  "kelime-doldurma":      { bg: "#C4A882", glow: "#8B6914" },
  "ayet-zinciri":         { bg: "#1B4A3B", glow: "#C9A84C" },
  "kelime-anlami":        { bg: "#D4A845", glow: "#8B5E1A" },
  "hexagon-harf":         { bg: "#1A3D2B", glow: "#2D6B4A" },
  "kiraet-karaoke":       { bg: "#7B4A2D", glow: "#C4814A" },
  "sure-tanima":          { bg: "#B8C9B0", glow: "#5C7A55" },
  "kelime-tahmini":       { bg: "#1A3D2B", glow: "#4A9B6A" },
  "ayet-2048":            { bg: "#1A1A2E", glow: "#E94560" },
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
    { id: "sure-tanima", img: GAME_IMGS["sure-tanima"], title: t.gamesHub.surahGuessTitle, description: t.gamesHub.surahGuessDesc, category: t.gamesHub.catListening, link: "/games/surah-guess", surahScoped: true },
    { id: "kelime-anlami", img: GAME_IMGS["kelime-anlami"], title: t.gamesHub.wordMeaningTitle, description: t.gamesHub.wordMeaningDesc, category: t.gamesHub.catWord, link: "/games/word-meaning" },
    { id: "hexagon-harf", img: GAME_IMGS["hexagon-harf"], title: t.gamesHub.hexagonTitle, description: t.gamesHub.hexagonDesc, category: t.gamesHub.catWord, link: "/games/hexagon", surahScoped: true },
    { id: "kelime-tahmini", img: GAME_IMGS["kelime-tahmini"], title: t.gamesHub.kelimeTahminiTitle, description: t.gamesHub.kelimeTahminiDesc, category: t.gamesHub.catPuzzle, link: "/games/kelime-tahmini" },
    { id: "ayet-2048", img: GAME_IMGS["ayet-2048"], title: t.gamesHub.ayet2048Title, description: t.gamesHub.ayet2048Desc, category: t.gamesHub.catPuzzle, link: "/games/ayah-2048" },
  ];
  return games.map((g) => ({ ...g, colors: GAME_COLORS[g.id] }));
}

function makeElifbaGames(t: T): Game[] {
  const games: Game[] = [
    { id: "elifba-karisik-sinav", img: GAME_IMGS["elifba-karisik-sinav"], title: t.gamesHub.mixedExamTitle, description: t.gamesHub.mixedExamDesc, category: t.gamesHub.catElifba, link: "/alifba/exam" },
    { id: "elifba-hiz", img: GAME_IMGS["elifba-hiz"], title: t.gamesHub.speedGameTitle, description: t.gamesHub.speedGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/speed" },
    { id: "elifba-sesli-quiz", img: GAME_IMGS["elifba-sesli-quiz"], title: t.gamesHub.voiceQuizTitle, description: t.gamesHub.voiceQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/voice" },
    { id: "elifba-form-quiz", img: GAME_IMGS["elifba-form-quiz"], title: t.gamesHub.formQuizTitle, description: t.gamesHub.formQuizDesc, category: t.gamesHub.catElifba, link: "/alifba/quiz/forms" },
    { id: "elifba-hafiza", img: GAME_IMGS["elifba-hafiza"], title: t.gamesHub.memoryGameTitle, description: t.gamesHub.memoryGameDesc, category: t.gamesHub.catElifba, link: "/alifba/games/memory" },
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
    { id: "kiraet-karaoke", img: GAME_IMGS["kiraet-karaoke"], title: t.gamesHub.reciteKaraokeTitle, description: t.gamesHub.reciteKaraokeDesc, category: t.gamesHub.catHifz, colors: GAME_COLORS["kiraet-karaoke"] },
  ];
}

// ── Components ─────────────────────────────────────────────

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
function GameCard({ game, t }: { game: Game; t: T }) {
  const selectedSurahIds = useSurahSelectionStore((s) => s.selectedSurahIds);
  return (
    <Link
      to={game.link as "/recite"}
      className="relative flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
    >
      <div className="relative w-full rounded-[22%] overflow-hidden">
        <AppIcon img={game.img} title={game.title} glow={game.colors?.glow} />
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
      style={{ width: "min(calc(100vw - 2rem), 22rem)" }}
    >
      {/* Card */}
      <div
        className="relative w-full rounded overflow-hidden"
        style={{
          backgroundColor: bg,
          boxShadow: `0 1px 3px ${glow}30`,
        }}
      >
        {/* Content row */}
        <div className="relative flex items-center gap-4 p-4">
          {/* App icon */}
          <div className="relative w-20 h-20 shrink-0">
            {game.img && (
              <img
                src={game.img} alt={game.title} loading="eager" decoding="async"
                className="w-full h-full object-cover rounded-[22%]"
                draggable={false}
                style={{ boxShadow: `0 1px 3px ${glow}30` }}
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

        </div>
      </div>
    </Link>
  );
}

function GamesGrid({ games, t }: { games: Game[]; t: T }) {
  return (
    <div className="grid grid-cols-5 gap-x-2 gap-y-3">
      {games.map((g) => (
        <GameCard key={g.id} game={g} t={t} />
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
    <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
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

const TrophySvg = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);

const StarSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const MedalSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" />
    <circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" />
  </svg>
);

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="w-6 h-6 flex items-center justify-center text-amber-400"><MedalSvg className="w-5 h-5" /></span>;
  if (rank === 2) return <span className="w-6 h-6 flex items-center justify-center text-slate-400"><MedalSvg className="w-5 h-5" /></span>;
  if (rank === 3) return <span className="w-6 h-6 flex items-center justify-center text-amber-700"><MedalSvg className="w-5 h-5" /></span>;
  return <span className="w-6 text-center text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">{rank}</span>;
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-[var(--color-accent)]">{icon}</span>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function LeaderboardRows({ entries, userId }: { entries: LeaderboardEntry[]; userId?: string }) {
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.userId} className={`flex items-center gap-3 ${e.userId === userId ? "text-[var(--color-accent)]" : ""}`}>
          <RankBadge rank={e.rank} />
          {e.userImage ? (
            <img src={e.userImage} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-[var(--color-border)] flex items-center justify-center shrink-0 text-[10px] font-bold text-[var(--color-text-secondary)]">
              {e.userName?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          )}
          <span className="flex-1 text-sm truncate text-[var(--color-text-primary)]">{e.userName}</span>
          <span className="text-sm font-bold tabular-nums">{e.bestScore}</span>
        </div>
      ))}
    </div>
  );
}

/** Avatar helper for podium */
function PodiumAvatar({ entry, size }: { entry: LeaderboardEntry; size: "lg" | "sm" }) {
  const px = size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const textSize = size === "lg" ? "text-lg" : "text-sm";
  if (entry.userImage) {
    return <img src={entry.userImage} alt="" className={`${px} rounded-full object-cover ring-2 ring-white/20`} referrerPolicy="no-referrer" />;
  }
  return (
    <span className={`${px} rounded-full bg-[var(--color-border)] flex items-center justify-center ${textSize} font-bold text-[var(--color-text-secondary)]`}>
      {entry.userName?.charAt(0)?.toUpperCase() ?? "?"}
    </span>
  );
}

/** Podium slot for a single player */
function PodiumSlot({ entry, place, userId }: { entry: LeaderboardEntry; place: 1 | 2 | 3; userId?: string }) {
  const isMe = entry.userId === userId;
  const colors = {
    1: { medal: "text-amber-400", bar: "bg-amber-400/20", barH: "h-20" },
    2: { medal: "text-slate-300", bar: "bg-slate-300/15", barH: "h-14" },
    3: { medal: "text-amber-600", bar: "bg-amber-600/15", barH: "h-10" },
  }[place];

  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${place === 1 ? "-mt-4" : "mt-2"}`}>
      {/* Avatar */}
      <div className="relative">
        <PodiumAvatar entry={entry} size={place === 1 ? "lg" : "sm"} />
        {/* Trophy badge */}
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-surface)] flex items-center justify-center ${colors.medal}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9H4.5a2.5 2.5 0 010-5H6m12 5h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34M18 2H6v7a6 6 0 0012 0V2z"/></svg>
        </span>
      </div>
      {/* Name */}
      <p className={`text-xs font-medium text-center truncate max-w-[5rem] ${isMe ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
        {entry.userName?.split(" ")[0]}
      </p>
      {/* Score */}
      <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)]">{entry.bestScore}</span>
      {/* Bar */}
      <div className={`w-full rounded-t-lg ${colors.bar} ${colors.barH}`} />
    </div>
  );
}

/** Top-3 podium display */
function Podium({ entries, userId }: { entries: LeaderboardEntry[]; userId?: string }) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];
  if (!first) return null;

  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-2 pb-0">
      {second ? <PodiumSlot entry={second} place={2} userId={userId} /> : <div className="flex-1" />}
      <PodiumSlot entry={first} place={1} userId={userId} />
      {third ? <PodiumSlot entry={third} place={3} userId={userId} /> : <div className="flex-1" />}
    </div>
  );
}

/** Hero card showing user's total score + rank */
function HeroCard({ myStats, globalBoard, userId, t }: { myStats: MyGameStat[]; globalBoard: LeaderboardEntry[]; userId: string; t: T }) {
  const myTotal = myStats.reduce((s, r) => s + r.bestScore, 0);
  if (myTotal <= 0) return null;

  const myRank = globalBoard.find((e) => e.userId === userId)?.rank;
  const totalPlayers = globalBoard.length;
  const totalPlays = myStats.reduce((s, r) => s + r.totalPlays, 0);
  const bestGame = myStats.reduce((best, s) => (s.bestScore > best.bestScore ? s : best), myStats[0]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70 p-5 text-white">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative flex items-start gap-4">
        {/* Score */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TrophySvg className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">{t.gamesHub.points.replace("{total}", String(myTotal)).replace(String(myTotal), "").trim()}</span>
          </div>
          <p className="text-3xl font-extrabold tabular-nums">{myTotal}</p>
          {myRank && (
            <p className="text-sm text-white/70 mt-1">#{myRank} / {totalPlayers}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">{t.gamesHub.tabMine}</p>
            <p className="text-sm font-bold tabular-nums">{totalPlays}x</p>
          </div>
          {bestGame && (
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Top</p>
              <p className="text-xs font-semibold truncate max-w-[7rem]">{GAME_TITLES[bestGame.gameId] ?? bestGame.gameId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Horizontal tab bar for game selection */
function GameTabBar({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
      {GAME_IDS.map((id) => {
        const active = id === selectedId;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
            }`}
          >
            {GAME_TITLES[id]}
          </button>
        );
      })}
    </div>
  );
}

/** Single game leaderboard loaded by selected tab */
function TabbedGameLeaderboard({ gameId, userId, t }: { gameId: string; userId?: string; t: T }) {
  const { data: board } = useQuery<LeaderboardEntry[]>({
    queryKey: ["game-leaderboard", gameId],
    queryFn: () => getGameLeaderboard({ data: { gameId } }),
    staleTime: 60_000,
  });

  if (!board?.length) {
    return <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">{t.gamesHub.noScoresForGame}</p>;
  }

  return <LeaderboardRows entries={board} userId={userId} />;
}

function ScoreboardContent({ userId, t }: { userId?: string; t: T }) {
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
  });

  // Default tab: user's best game, or first game
  const bestGameId = myStats?.length
    ? myStats.reduce((best, s) => (s.bestScore > best.bestScore ? s : best), myStats[0]).gameId
    : GAME_IDS[0];
  const [selectedGameId, setSelectedGameId] = useState<string>(bestGameId);

  // Remaining global entries (rank 4+)
  const remainingGlobal = globalBoard?.slice(3) ?? [];

  return (
    <div className="space-y-5">
      {/* 1. Hero Card */}
      {userId && myStats?.length ? (
        <HeroCard myStats={myStats} globalBoard={globalBoard ?? []} userId={userId} t={t} />
      ) : null}

      {/* 2. Global Podium */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[var(--color-accent)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t.gamesHub.tabGlobal}</h3>
        </div>
        {!globalBoard?.length ? (
          <p className="text-xs text-[var(--color-text-secondary)] text-center py-6">{t.gamesHub.noScores}</p>
        ) : (
          <>
            <Podium entries={globalBoard} userId={userId} />
            {remainingGlobal.length > 0 && (
              <div className="px-4 py-3 border-t border-[var(--color-border)]">
                <LeaderboardRows entries={remainingGlobal} userId={userId} />
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Per-Game Leaderboards (Tabbed) */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <GameTabBar selectedId={selectedGameId} onSelect={setSelectedGameId} />
        </div>
        <div className="px-4 py-3">
          <TabbedGameLeaderboard key={selectedGameId} gameId={selectedGameId} userId={userId} t={t} />
        </div>
      </section>

      {/* 4. My Scores */}
      <SectionCard icon={<StarSvg />} title={t.gamesHub.tabMine}>
        {!userId ? (
          <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">
            {t.gamesHub.loginPrompt}{" "}
            <Link to="/auth/login" search={{ redirect: "/games" }} className="text-[var(--color-accent)] underline">{t.gamesHub.loginLink}</Link>
          </p>
        ) : !myStats?.length ? (
          <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">{t.gamesHub.noGamesPlayed}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myStats.map((s) => (
              <div
                key={s.gameId}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
              >
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{GAME_TITLES[s.gameId] ?? s.gameId}</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">{s.totalPlays}x</span>
                <span className="text-sm font-bold text-[var(--color-accent)] tabular-nums">{s.bestScore}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Achievements ──────────────────────────────────────────

const SCORE_THRESHOLDS = [250, 1000, 2500];
const PLAY_THRESHOLDS = [1, 10, 50];
const CATEGORY_ORDER = ["cross-game", "streak", "flawless", "special", "game-score", "game-plays"] as const;

const MEDAL_COLORS = {
  bronze: { bg: "bg-amber-700/15", text: "text-amber-700", ring: "ring-amber-700/30", bar: "bg-amber-700" },
  silver: { bg: "bg-slate-400/15", text: "text-slate-400", ring: "ring-slate-400/30", bar: "bg-slate-400" },
  gold: { bg: "bg-yellow-500/15", text: "text-yellow-500", ring: "ring-yellow-500/30", bar: "bg-yellow-500" },
} as const;

function tierToMedal(tier: number): keyof typeof MEDAL_COLORS {
  if (tier >= 3) return "gold";
  if (tier >= 2) return "silver";
  return "bronze";
}

function MedalIcon({ tier, unlocked }: { tier: number; unlocked: boolean }) {
  const medal = tierToMedal(tier);
  const colors = MEDAL_COLORS[medal];

  if (!unlocked) {
    return (
      <div className="w-7 h-7 rounded-full bg-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] opacity-40 shrink-0">
        ?
      </div>
    );
  }

  const labels = { bronze: "3", silver: "2", gold: "1" };
  return (
    <div className={`w-7 h-7 rounded-full ${colors.bg} ring-1 ${colors.ring} flex items-center justify-center text-xs font-bold ${colors.text} shrink-0`}>
      {labels[medal]}
    </div>
  );
}

function AchievementProgressBar({ current, target, tier }: { current: number; target: number; tier: number }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const medal = tierToMedal(tier);
  const barColor = MEDAL_COLORS[medal].bar;
  return (
    <div className="mt-1">
      <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">{current}/{target} (%{pct})</p>
    </div>
  );
}

function AchievementsContent({ userId, t }: { userId?: string; t: T }) {
  const achT = t.achievements;
  const { data: userAchs } = useQuery<{ achievementId: string; unlockedAt: number }[]>({
    queryKey: ["user-achievements"],
    queryFn: () => getUserAchievements(),
    staleTime: 30_000,
    enabled: !!userId,
  });

  const { data: myStats } = useQuery<MyGameStat[]>({
    queryKey: ["my-score-stats"],
    queryFn: () => getMyScoreStats(),
    staleTime: 30_000,
    enabled: !!userId,
  });

  const unlockedSet = useMemo(
    () => new Set((userAchs ?? []).map((a) => a.achievementId)),
    [userAchs],
  );

  const statsMap = useMemo(() => {
    const map = new Map<string, MyGameStat>();
    for (const s of myStats ?? []) map.set(s.gameId, s);
    return map;
  }, [myStats]);

  const total = ACHIEVEMENT_DEFS.length;
  const unlocked = unlockedSet.size;

  const catLabels: Record<string, string> = {
    "game-score": achT?.catScore ?? "Score",
    "game-plays": achT?.catPlays ?? "Plays",
    "cross-game": achT?.catCrossGame ?? "General",
    "streak": achT?.catStreak ?? "Streak",
    "flawless": achT?.catFlawless ?? "Flawless",
    "special": achT?.catSpecial ?? "Special",
  };

  // Group definitions by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof ACHIEVEMENT_DEFS>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, ACHIEVEMENT_DEFS.filter((d) => d.category === cat));
    }
    return map;
  }, []);

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t.gamesHub.loginPrompt}{" "}
          <Link to="/auth/login" search={{ redirect: "/games" }} className="text-[var(--color-accent)] underline">{t.gamesHub.loginLink}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70 p-5 text-white">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <TrophySvg className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wider">{achT?.title ?? "Achievements"}</p>
            <p className="text-2xl font-extrabold tabular-nums">{unlocked}/{total} <span className="text-sm font-semibold text-white/60">%{total > 0 ? Math.round((unlocked / total) * 100) : 0}</span></p>
          </div>
          <div className="flex-1">
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-700"
                style={{ width: `${total > 0 ? Math.round((unlocked / total) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement categories */}
      {CATEGORY_ORDER.map((cat) => {
        const defs = grouped.get(cat);
        if (!defs?.length) return null;

        const catUnlocked = defs.filter((d) => unlockedSet.has(d.id)).length;

        // For per-game categories, group by gameId
        if (cat === "game-score" || cat === "game-plays") {
          const byGame = new Map<string, typeof defs>();
          for (const d of defs) {
            const gId = d.gameId ?? "unknown";
            if (!byGame.has(gId)) byGame.set(gId, []);
            byGame.get(gId)!.push(d);
          }

          return (
            <section key={cat} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{catLabels[cat]}</h3>
                <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
                  {catUnlocked}/{defs.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[...byGame.entries()].map(([gameId, gameDefs]) => {
                  const stat = statsMap.get(gameId);
                  const currentValue = cat === "game-score" ? (stat?.bestScore ?? 0) : (stat?.totalPlays ?? 0);
                  const thresholds = cat === "game-score" ? SCORE_THRESHOLDS : PLAY_THRESHOLDS;
                  const highestUnlocked = [...gameDefs].reverse().find((d) => unlockedSet.has(d.id));
                  const nextDef = gameDefs.find((d) => !unlockedSet.has(d.id));
                  const nextThreshold = nextDef ? thresholds[(nextDef.tier ?? 1) - 1] : null;

                  return (
                    <div
                      key={gameId}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 flex items-center gap-2"
                    >
                      <MedalIcon
                        tier={highestUnlocked?.tier ?? nextDef?.tier ?? 1}
                        unlocked={!!highestUnlocked}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">
                          {GAME_TITLES[gameId] ?? gameId}
                        </p>
                        {nextThreshold != null && (
                          <AchievementProgressBar current={currentValue} target={nextThreshold} tier={nextDef!.tier ?? 1} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        // Cross-game and streak categories
        return (
          <section key={cat} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{catLabels[cat]}</h3>
              <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
                {catUnlocked}/{defs.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {defs.map((def) => {
                const isUnlocked = unlockedSet.has(def.id);
                let name: string;
                let desc: string;
                if (def.category === "flawless" && def.gameId) {
                  name = GAME_TITLES[def.gameId] ?? def.gameId;
                  desc = (achT?.["flawless-desc" as keyof typeof achT] ?? "") as string;
                } else {
                  const nameKey = def.id as keyof typeof achT;
                  const descKey = `${def.id}-desc` as keyof typeof achT;
                  name = (achT?.[nameKey] ?? def.id) as string;
                  desc = (achT?.[descKey] ?? "") as string;
                }
                return (
                  <div
                    key={def.id}
                    className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 flex items-center gap-2 transition-opacity ${isUnlocked ? "" : "opacity-50"}`}
                  >
                    <MedalIcon tier={def.tier ?? 1} unlocked={isUnlocked} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">
                        {name}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight truncate">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

function GamesPage() {
  const { session } = useRouteContext({ from: "__root__" });
  const { t } = useTranslation();
  const favoriteIds = useGamesFavoritesStore((s) => s.favoriteIds);
  const [pageTab, setPageTab] = useState<"games" | "scoreboard" | "achievements">("games");
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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">
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
            onClick={() => setPageTab("achievements")}
            className={`px-3 py-1.5 transition-colors ${pageTab === "achievements" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"}`}
          >
            {t.achievements?.tabTitle ?? "Basarimlar"}
          </button>
          <button
            onClick={() => setPageTab("scoreboard")}
            className={`px-3 py-1.5 transition-colors ${pageTab === "scoreboard" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"}`}
          >
            {t.gamesHub.scoreboard}
          </button>
        </div>
      </div>

      {pageTab === "achievements" ? (
        <AchievementsContent userId={session?.user?.id} t={t} />
      ) : pageTab === "scoreboard" ? (
        <ScoreboardContent userId={session?.user?.id} t={t} />
      ) : (
        <>
          {/* ── Editor's Choice (always shown) ── */}
          <section>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t.gamesHub.editorChoice}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
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
