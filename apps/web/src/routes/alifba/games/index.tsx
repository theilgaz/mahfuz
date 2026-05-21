/**
 * Mini Oyunlar hub — /alifba/games
 * Hafıza, Hız ve Boşluk Doldur oyunlarına giriş.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/games/")({
  head: () => staticHead("alifba-games"),
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
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="9" height="11" rx="2"/><rect x="13" y="3" width="9" height="11" rx="2"/><rect x="2" y="17" width="9" height="4" rx="2"/><rect x="13" y="17" width="9" height="4" rx="2"/></svg>,
    },
    {
      id: "speed" as const,
      to: "/alifba/games/speed" as const,
      label: t.alifba.speedGame,
      desc: t.alifba.speedGameDesc,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    },
    {
      id: "fill" as const,
      to: "/alifba/games/fill" as const,
      label: t.alifba.fillGame,
      desc: t.alifba.fillGameDesc,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M15 5l4 4"/></svg>,
    },
    {
      id: "word" as const,
      to: "/alifba/games/word" as const,
      label: t.alifba.wordGame,
      desc: t.alifba.wordGameDesc,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <Link to="/alifba" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
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
            className="flex items-center gap-4 px-4 py-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors active:scale-[0.99]"
          >
            <span className="w-10 h-10 rounded bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">{game.icon}</span>
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
