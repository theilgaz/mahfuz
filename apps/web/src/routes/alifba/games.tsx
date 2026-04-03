/**
 * Mini Oyunlar hub — /alifba/games
 * Hafıza, Hız ve Boşluk Doldur oyunlarına giriş.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/alifba/games")({
  component: GamesHubPage,
});

function GamesHubPage() {
  const { t } = useTranslation();
  const gameHighScores = useAlifbaStore(useShallow((s) => s.gameHighScores));

  const games = [
    {
      id: "memory" as const,
      to: "/alifba/games/memory" as const,
      label: t.alifba.memoryGame,
      desc: t.alifba.memoryGameDesc,
      emoji: "🧠",
    },
    {
      id: "speed" as const,
      to: "/alifba/games/speed" as const,
      label: t.alifba.speedGame,
      desc: t.alifba.speedGameDesc,
      emoji: "⚡",
    },
    {
      id: "fill" as const,
      to: "/alifba/games/fill" as const,
      label: t.alifba.fillGame,
      desc: t.alifba.fillGameDesc,
      emoji: "✏️",
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <Link to="/alifba/" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <h1 className="text-sm font-semibold">{t.alifba.games}</h1>
        <div className="w-12" />
      </div>

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.to}
            className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors active:scale-[0.99]"
          >
            <span className="text-3xl">{game.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{game.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{game.desc}</p>
            </div>
            {gameHighScores[game.id] > 0 && (
              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.highScore}</p>
                <p className="text-sm font-semibold text-[var(--color-accent)]">{gameHighScores[game.id]}</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
