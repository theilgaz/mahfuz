/**
 * Ayet 2048 -- Quran-themed 2048 puzzle.
 * Three modes: Namaz Sureleri, Sure Sırası, Nüzul Sırası.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { useTranslation } from "~/hooks/useTranslation";
import { submitScore, GAME_TITLES } from "~/lib/score-service";
import { GameMiniLeaderboard } from "~/components/GameMiniLeaderboard";
import { ACHIEVEMENT_MAP } from "~/lib/game-achievements";
import {
  createGame,
  move,
  type GameState,
  type Direction,
  type Tile,
} from "~/lib/game-2048-engine";
import {
  SURAHS,
  GAME_MODES,
  SPAWN_VALUES,
  getSurahForLevel,
  type GameMode,
  type SurahInfo,
} from "~/lib/surah-ayah-counts";
import { getSurahName } from "~/lib/surah-names-i18n";

const THEME = GAME_THEMES["ayet-2048"];

export const Route = createFileRoute("/games/ayah-2048")({
  component: Ayet2048Page,
});

// ── Merge function: level + 1 (instead of classic value * 2) ──
const surahMerge = (v: number) => v + 1;
const surahScore = (level: number) => level + 1;

// ── Color tiers for tile levels ───────────────────────────

const LEVEL_COLORS: { bg: string; text: string }[] = [
  { bg: "#93C5FD", text: "#1e3a5f" }, // 0  - light blue
  { bg: "#3B82F6", text: "#fff" },    // 1  - blue
  { bg: "#06B6D4", text: "#fff" },    // 2  - cyan
  { bg: "#14B8A6", text: "#fff" },    // 3  - teal
  { bg: "#10B981", text: "#fff" },    // 4  - emerald
  { bg: "#22C55E", text: "#fff" },    // 5  - green
  { bg: "#84CC16", text: "#1a2e05" }, // 6  - lime
  { bg: "#EAB308", text: "#422006" }, // 7  - yellow
  { bg: "#F59E0B", text: "#451a03" }, // 8  - amber
  { bg: "#F97316", text: "#fff" },    // 9  - orange
  { bg: "#EF4444", text: "#fff" },    // 10 - red
  { bg: "#E11D48", text: "#fff" },    // 11 - rose
  { bg: "#DB2777", text: "#fff" },    // 12 - pink
  { bg: "#A855F7", text: "#fff" },    // 13 - purple
  { bg: "#7C3AED", text: "#fff" },    // 14 - violet
  { bg: "#6366F1", text: "#fff" },    // 15 - indigo
  { bg: "#4F46E5", text: "#fff" },    // 16 - deep indigo
  { bg: "#2563EB", text: "#fff" },    // 17 - royal blue
  { bg: "#0891B2", text: "#fff" },    // 18 - dark cyan
  { bg: "#0D9488", text: "#fff" },    // 19 - dark teal
  { bg: "#059669", text: "#fff" },    // 20 - dark emerald
  { bg: "#B45309", text: "#fff" },    // 21 - dark amber
  { bg: "#D4AF37", text: "#1a1400" }, // 22 - GOLD
];

function getTileColor(level: number): { bg: string; text: string } {
  return LEVEL_COLORS[level] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1];
}

// ── Arabic numeral conversion ──────────────────────────────

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toArabicNum(n: number): string {
  return String(n)
    .split("")
    .map((d) => AR_DIGITS[parseInt(d)])
    .join("");
}

// ── localStorage helpers ───────────────────────────────────

function storageKey(modeId: string) {
  return `ayet2048-discovered-${modeId}`;
}

function loadDiscovered(modeId: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(modeId));
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveDiscovered(modeId: string, ids: Set<number>) {
  localStorage.setItem(storageKey(modeId), JSON.stringify([...ids]));
}

// ── Swipe hook ─────────────────────────────────────────────

function useSwipe(onSwipe: (dir: Direction) => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Attach non-passive touchmove to prevent scroll during swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener("touchmove", handler, { passive: false });
    return () => el.removeEventListener("touchmove", handler);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;
      startRef.current = null;

      const MIN = 30;
      if (Math.abs(dx) < MIN && Math.abs(dy) < MIN) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? "right" : "left");
      } else {
        onSwipe(dy > 0 ? "down" : "up");
      }
    },
    [onSwipe],
  );

  return { ref: containerRef, onTouchStart, onTouchEnd };
}

// ── Main page ──────────────────────────────────────────────

interface GameOverData {
  score: number;
  discoveredCount: number;
  totalSurahs: number;
  highestSurah: SurahInfo | null;
  isNewHighScore: boolean;
  newAchievements: string[];
}

function Ayet2048Page() {
  const [screen, setScreen] = useState<"menu" | "game" | "collection" | "gameover">("menu");
  const [mode, setMode] = useState<GameMode>(GAME_MODES[0]);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  if (screen === "collection") {
    return <CollectionScreen mode={mode} onBack={() => setScreen("menu")} />;
  }
  if (screen === "gameover" && gameOverData) {
    return (
      <GameOverScreen
        mode={mode}
        data={gameOverData}
        onRestart={() => setScreen("game")}
        onMenu={() => setScreen("menu")}
      />
    );
  }
  if (screen === "game") {
    return (
      <GameScreen
        mode={mode}
        onBack={() => setScreen("menu")}
        onGameOver={(data) => {
          setGameOverData(data);
          setScreen("gameover");
        }}
      />
    );
  }
  return (
    <MenuScreen
      mode={mode}
      onChangeMode={setMode}
      onStart={() => setScreen("game")}
      onCollection={() => setScreen("collection")}
    />
  );
}

// ── Menu screen ────────────────────────────────────────────

function MenuScreen({
  mode,
  onChangeMode,
  onStart,
  onCollection,
}: {
  mode: GameMode;
  onChangeMode: (m: GameMode) => void;
  onStart: () => void;
  onCollection: () => void;
}) {
  const { t, locale } = useTranslation();
  const tx = t.ayet2048;
  const discovered = useMemo(() => loadDiscovered(mode.id), [mode.id]);

  const modeLabels: Record<string, { name: string; desc: string }> = {
    namaz: { name: tx.modeNamaz, desc: tx.modeNamazDesc },
    mushaf: { name: tx.modeMushaf, desc: tx.modeMushafDesc },
    nuzul: { name: tx.modeNuzul, desc: tx.modeNuzulDesc },
  };

  return (
    <div className="game-bg" style={gameBgStyle(THEME, "ayet-2048")}>
      <div className="mx-auto max-w-md px-4 py-6 flex flex-col gap-6 min-h-dvh">
        {/* Subtitle */}
        <p className="text-sm text-white/60">{tx.subtitle}</p>

        {/* Discovered counter */}
        <button
          onClick={onCollection}
          className="flex items-center justify-between p-4 rounded-2xl w-full"
          style={{ background: THEME.surface }}
        >
          <div className="text-left">
            <div className="text-white/60 text-sm">{tx.discoveredSurahs}</div>
            <div className="text-2xl font-bold text-white">{discovered.size}/{mode.sequence.length}</div>
          </div>
          <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Mode selector */}
        <div className="flex gap-2 rounded-xl p-1" style={{ background: THEME.surface }}>
          {GAME_MODES.map((m) => {
            const label = modeLabels[m.id];
            const active = m.id === mode.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m)}
                className="flex-1 py-2 px-1 rounded-lg text-center transition-all text-xs font-medium"
                style={{
                  background: active ? THEME.primary : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              >
                {label.name}
              </button>
            );
          })}
        </div>

        {/* Start */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-transform active:scale-95"
          style={{ background: THEME.primary }}
        >
          {tx.play}
        </button>

        {/* How to play */}
        <div className="p-4 rounded-2xl" style={{ background: THEME.surface }}>
          <h2 className="text-white font-semibold text-sm mb-2">{tx.howToPlay}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{tx.howToPlayText}</p>
        </div>

        {/* Mini leaderboard */}
        <GameMiniLeaderboard gameId="ayet-2048" dark />
      </div>
    </div>
  );
}

// ── Game screen ────────────────────────────────────────────

function GameScreen({
  mode,
  onBack,
  onGameOver,
}: {
  mode: GameMode;
  onBack: () => void;
  onGameOver: (data: GameOverData) => void;
}) {
  const { t, locale } = useTranslation();
  const tx = t.ayet2048;
  const { gridSize, winTarget, sequence } = mode;

  const [gameState, setGameState] = useState<GameState>(() =>
    createGame(gridSize, SPAWN_VALUES),
  );
  const [discovered, setDiscovered] = useState<Set<number>>(() => loadDiscovered(mode.id));
  const [newlyDiscovered, setNewlyDiscovered] = useState<SurahInfo | null>(null);

  // Mark initial spawned tiles as discovered on mount
  useEffect(() => {
    const updated = new Set(discovered);
    for (const tile of gameState.tiles) {
      const surah = getSurahForLevel(sequence, tile.value);
      if (surah && !updated.has(surah.id)) updated.add(surah.id);
    }
    if (updated.size !== discovered.size) {
      setDiscovered(updated);
      saveDiscovered(mode.id, updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Check for newly discovered surahs after each move (spawn + merge)
  const checkDiscoveries = useCallback(
    (tiles: Tile[]) => {
      let found: SurahInfo | null = null;
      const updated = new Set(discovered);
      for (const tile of tiles) {
        if (tile.mergedFrom || tile.isNew) {
          const surah = getSurahForLevel(sequence, tile.value);
          if (surah && !updated.has(surah.id)) {
            updated.add(surah.id);
            found = surah;
          }
        }
      }
      if (updated.size !== discovered.size) {
        setDiscovered(updated);
        saveDiscovered(mode.id, updated);
        if (found) {
          setNewlyDiscovered(found);
          setTimeout(() => setNewlyDiscovered(null), 2500);
        }
      }
    },
    [discovered, sequence, mode.id],
  );

  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameState.over) return;
      if (gameState.won && !keepPlaying) return;

      const next = move(gameState, dir, SPAWN_VALUES, winTarget, surahMerge, surahScore);
      if (next === gameState) return;
      setGameState(next);
      checkDiscoveries(next.tiles);
    },
    [gameState, keepPlaying, winTarget, checkDiscoveries],
  );

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  // Swipe
  const swipeHandlers = useSwipe(handleMove);

  // Save score when won (in case user leaves without continuing)
  const [winScoreSaved, setWinScoreSaved] = useState(false);
  useEffect(() => {
    if (gameState.won && !winScoreSaved) {
      setWinScoreSaved(true);
      submitScore({
        data: {
          gameId: "ayet-2048",
          score: gameState.score,
          difficulty: mode.id,
        },
      }).catch(() => {});
    }
  }, [gameState.won, winScoreSaved, gameState.score, mode.id]);

  // Show game over screen when no moves left
  useEffect(() => {
    if (gameState.over && !scoreSaved) {
      setScoreSaved(true);
      const highestLevel = gameState.tiles.reduce((max, t) => Math.max(max, t.value), 0);
      const highestSurah = getSurahForLevel(sequence, highestLevel) ?? null;

      // If win score was already saved, just save the updated score (might be higher after continuing)
      submitScore({
        data: {
          gameId: "ayet-2048",
          score: gameState.score,
          difficulty: mode.id,
        },
      })
        .then((result) => {
          onGameOver({
            score: gameState.score,
            discoveredCount: discovered.size,
            totalSurahs: sequence.length,
            highestSurah,
            isNewHighScore: result?.isNewHighScore ?? false,
            newAchievements: result?.newAchievements ?? [],
          });
        })
        .catch(() => {
          onGameOver({
            score: gameState.score,
            discoveredCount: discovered.size,
            totalSurahs: sequence.length,
            highestSurah,
            isNewHighScore: false,
            newAchievements: [],
          });
        });
    }
  }, [gameState.over, gameState.score, gameState.tiles, scoreSaved, mode.id, sequence, discovered.size, onGameOver]);

  const restart = () => {
    setGameState(createGame(gridSize, SPAWN_VALUES));
    setKeepPlaying(false);
    setScoreSaved(false);
    setWinScoreSaved(false);
    setNewlyDiscovered(null);
  };

  // Fit grid to both width and height so the page never scrolls
  // Account for app header (44px) + bottom nav (56px) + score bar + discovered + instructions (~120px)
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 700;
  const maxW = Math.min(vw, 448) - 32 - (gridSize + 1) * 6; // horizontal limit
  const usableH = vh - 220 - (gridSize + 1) * 6; // 220 = header(44) + nav(56) + UI chrome(~120)
  const cellSize = Math.min(maxW / gridSize, usableH / gridSize, 80);

  const winSurah = getSurahForLevel(sequence, winTarget);

  return (
    <div className="game-bg" style={{ ...gameBgStyle(THEME, "ayet-2048"), minHeight: 0, height: "calc(100dvh - 44px - 56px)", overflow: "hidden" }} {...swipeHandlers}>
      <div className="mx-auto max-w-md px-4 py-2 flex flex-col gap-2 h-full overflow-hidden">
        {/* Score bar */}
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="text-white/50 text-xs">{tx.score}</div>
            <div className="text-white font-bold text-lg">{gameState.score}</div>
          </div>
        </div>

        {/* Discovered count */}
        <div className="flex items-center justify-between px-1">
          <span className="text-white/50 text-xs">{tx.discoveredSurahs}: {discovered.size}/{sequence.length}</span>
          <button onClick={restart} className="text-xs px-3 py-1 rounded-lg text-white/70" style={{ background: THEME.surface }}>
            {tx.newGame}
          </button>
        </div>

        {/* Grid wrapper (relative for overlays) */}
        <div className="relative mx-auto flex-1 flex flex-col items-center justify-center">
          <div
            className="rounded-2xl p-1.5 select-none"
            style={{ background: THEME.surface }}
          >
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
                gap: "6px",
              }}
            >
              {/* Empty cells */}
              {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)", width: cellSize, height: cellSize }}
                />
              ))}

              {/* Tiles */}
              {gameState.tiles.map((tile) => (
                <TileView
                  key={tile.id}
                  tile={tile}
                  cellSize={cellSize}
                  gap={6}
                  sequence={sequence}
                  locale={locale}
                />
              ))}
            </div>
          </div>

          {/* Discovery banner */}
          {newlyDiscovered && (
            <div
              className="absolute left-0 right-0 -bottom-1 p-2 rounded-xl text-center game-bounce-in mx-2"
              style={{ background: THEME.primary }}
            >
              <div className="text-white/80 text-[10px] leading-none">{tx.surahDiscovered}</div>
              <div className="text-white font-bold text-sm leading-tight mt-0.5">
                {newlyDiscovered.nameArabic} - {getSurahName(newlyDiscovered.id, locale)}
              </div>
            </div>
          )}

          {/* Win overlay */}
          {gameState.won && !keepPlaying && !gameState.over && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
              <div className="p-4 rounded-2xl text-center mx-4" style={{ background: THEME.surface }}>
                <div className="text-2xl font-bold text-white mb-2">{tx.win}</div>
                <div className="text-white/60 text-sm mb-4">
                  {winSurah
                    ? tx.reachedTarget.replace("{target}", getSurahName(winSurah.id, locale))
                    : ""}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setKeepPlaying(true)}
                    className="flex-1 py-3 rounded-xl text-white font-semibold"
                    style={{ background: THEME.primary }}
                  >
                    {tx.keepPlaying}
                  </button>
                  <button
                    onClick={restart}
                    className="flex-1 py-3 rounded-xl text-white/70 font-semibold"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {tx.newGame}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Instructions */}
        <div className="text-white/30 text-[10px] text-center mt-auto">
          {tx.instructions}
        </div>
      </div>
    </div>
  );
}

// ── Tile component ─────────────────────────────────────────

function TileView({
  tile,
  cellSize,
  gap,
  sequence,
  locale,
}: {
  tile: Tile;
  cellSize: number;
  gap: number;
  sequence: number[];
  locale: string;
}) {
  const level = tile.value;
  const { bg, text } = getTileColor(level);
  const surah = getSurahForLevel(sequence, level);

  const left = tile.col * (cellSize + gap);
  const top = tile.row * (cellSize + gap);

  const numFontSize = cellSize < 60 ? "text-xs" : "text-sm";
  const nameFontSize = cellSize < 60 ? "text-[8px]" : "text-[10px]";
  const arabicNameSize = cellSize < 60 ? "text-[10px]" : "text-xs";

  const animClass = tile.mergedFrom ? "game-pop" : tile.isNew ? "game-tile-appear" : "";

  return (
    <div
      className="absolute transition-[left,top] duration-200 ease-in-out"
      style={{
        width: cellSize,
        height: cellSize,
        left,
        top,
        zIndex: tile.mergedFrom ? 2 : 1,
      }}
    >
      <div
        className={`w-full h-full rounded-lg flex flex-col items-center justify-center ${animClass}`}
        style={{ background: bg, color: text }}
      >
        {surah && (
          <>
            <span
              className={`leading-none font-semibold ${arabicNameSize}`}
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {surah.nameArabic}
            </span>
            <span className={`leading-none mt-1 opacity-60 ${nameFontSize}`}>
              {getSurahName(surah.id, locale)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Game over screen ──────────────────────────────────────

function GameOverScreen({
  mode,
  data,
  onRestart,
  onMenu,
}: {
  mode: GameMode;
  data: GameOverData;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const { t, locale } = useTranslation();
  const tx = t.ayet2048;
  const achT = t.achievements;
  const TIER_ICONS = ["", "\u25CB", "\u25CE", "\u2605"];

  return (
    <div
      className="game-bg min-h-dvh flex flex-col items-center justify-center game-bounce-in"
      style={gameBgStyle(THEME, "ayet-2048")}
    >
      <div className="mx-auto max-w-md px-4 py-8 text-center flex flex-col items-center gap-5 w-full">
        {/* Trophy / highest surah */}
        <div
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center game-star-spin"
          style={{
            background: `linear-gradient(135deg, ${THEME.primary}30, ${THEME.primary}10)`,
            boxShadow: `0 0 24px ${THEME.glow}`,
          }}
        >
          {data.highestSurah ? (
            <>
              <span
                className="text-lg font-bold leading-none"
                style={{ color: THEME.primary, fontFamily: "var(--font-arabic)" }}
              >
                {data.highestSurah.nameArabic}
              </span>
              <span className="text-[10px] mt-1" style={{ color: `${THEME.primary}99` }}>
                {getSurahName(data.highestSurah.id, locale)}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold" style={{ color: THEME.primary }}>
              --
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white">{tx.gameOver}</h2>

        {/* New high score */}
        {data.isNewHighScore && (
          <p className="text-sm font-bold game-pop" style={{ color: THEME.primary }}>
            {t.gameScoring?.newHighScore ?? "New High Score!"}
          </p>
        )}

        {/* Final score */}
        <p className="text-5xl font-extrabold tabular-nums" style={{ color: THEME.primary }}>
          {data.score}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-3 w-full">
          <div className="flex-1 flex flex-col items-center py-3 rounded-xl" style={{ background: THEME.surface }}>
            <span className="text-xl font-extrabold tabular-nums text-white">{data.discoveredCount}</span>
            <span className="text-[10px] text-white/50 mt-0.5">{tx.discoveredSurahs}</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3 rounded-xl" style={{ background: THEME.surface }}>
            <span className="text-xl font-extrabold tabular-nums text-white">{data.totalSurahs}</span>
            <span className="text-[10px] text-white/50 mt-0.5">{tx.target}</span>
          </div>
        </div>

        {/* Achievements */}
        {data.newAchievements.length > 0 && (
          <div className="w-full p-3 rounded-xl" style={{ background: THEME.surface }}>
            <p className="text-xs font-bold mb-2" style={{ color: THEME.primary }}>
              {achT?.unlocked ?? "Achievements Unlocked!"}
            </p>
            <div className="flex flex-col gap-1.5">
              {data.newAchievements.map((id) => {
                const def = ACHIEVEMENT_MAP.get(id);
                const tierIcon = def?.tier ? TIER_ICONS[def.tier] : "\u2713";
                let name: string;
                if (def?.category === "game-score" && def.gameId && def.tier) {
                  const tierKey = `score-${def.tier}` as keyof typeof achT;
                  const gameTitle = GAME_TITLES[def.gameId] ?? def.gameId;
                  name = `${gameTitle} - ${(achT?.[tierKey] ?? id) as string}`;
                } else if (def?.category === "game-plays" && def.gameId && def.tier) {
                  const tierKey = `plays-${def.tier}` as keyof typeof achT;
                  const gameTitle = GAME_TITLES[def.gameId] ?? def.gameId;
                  name = `${gameTitle} - ${(achT?.[tierKey] ?? id) as string}`;
                } else {
                  name = (achT?.[id as keyof typeof achT] ?? id) as string;
                }
                return (
                  <div key={id} className="flex items-center gap-2 text-left">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: `${THEME.primary}20`, color: THEME.primary }}
                    >
                      {tierIcon}
                    </span>
                    <span className="text-sm text-white">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary || THEME.primary})`,
              boxShadow: `0 4px 14px ${THEME.glow}`,
            }}
          >
            {tx.tryAgain}
          </button>
          <button
            onClick={onMenu}
            className="text-sm text-white/50 hover:text-white/70 py-2 font-medium"
          >
            {tx.newGame}
          </button>
          <Link to="/games/scoreboard" search={{ game: "ayet-2048" }} className="text-sm text-white/50 hover:text-white/70 font-medium">
            {t.gamesHub?.scoreboard ?? "Skor Tablosu"}
          </Link>
          <Link to="/games" className="text-sm text-white/40 hover:text-white/60 font-medium">
            {t.gameScoring?.backToGames ?? "Back to Games"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Collection screen ──────────────────────────────────────

function CollectionScreen({ mode, onBack }: { mode: GameMode; onBack: () => void }) {
  const { t, locale } = useTranslation();
  const tx = t.ayet2048;
  const discovered = useMemo(() => loadDiscovered(mode.id), [mode.id]);

  return (
    <div className="game-bg" style={gameBgStyle(THEME, "ayet-2048")}>
      <div className="mx-auto max-w-md px-4 py-6 min-h-dvh">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 rounded-lg" style={{ background: THEME.surface }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{tx.collection}</h1>
            <p className="text-sm text-white/50">{discovered.size}/{mode.sequence.length} {tx.discovered}</p>
          </div>
        </div>

        {/* Surah grid in mode order */}
        <div className="grid grid-cols-3 gap-2">
          {mode.sequence.map((surahId, level) => {
            const surah = SURAHS.find((s) => s.id === surahId)!;
            const found = discovered.has(surahId);
            return (
              <div
                key={surahId}
                className="p-2 rounded-xl text-center"
                style={{
                  background: found ? getTileColor(level).bg : "rgba(255,255,255,0.05)",
                  opacity: found ? 1 : 0.4,
                }}
              >
                <div className="text-white/50 text-[10px]">{surah.id}</div>
                <div
                  className="text-white font-semibold text-xs leading-tight"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {found ? surah.nameArabic : "?"}
                </div>
                <div className="text-white/60 text-[10px]">
                  {found ? getSurahName(surahId, locale) : "---"}
                </div>
                {found && (
                  <div className="text-white/40 text-[9px]">
                    {toArabicNum(surah.ayahCount)} {tx.ayat}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
