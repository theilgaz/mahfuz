/**
 * Shared game-over card with animated stats and themed styling.
 */
import { Link } from "@tanstack/react-router";
import type { GameTheme } from "~/lib/game-themes";

interface GameOverCardProps {
  theme: GameTheme;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestStreak: number;
  isNewHighScore: boolean;
  t: any;
  onRestart: () => void;
  onSetup?: () => void;
  setupLabel?: string;
}

export function GameOverCard({
  theme, score, correctCount, wrongCount, bestStreak,
  isNewHighScore, t, onRestart, onSetup, setupLabel,
}: GameOverCardProps) {
  const P = theme.primary;
  const total = correctCount + wrongCount;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div
      className="max-w-md mx-auto px-4 py-8 text-center game-bounce-in"
      style={{ "--game-bg-gradient": `linear-gradient(135deg, ${theme.bg}, ${theme.secondary})` } as React.CSSProperties}
    >
      {/* Trophy circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 game-star-spin"
        style={{ background: `linear-gradient(135deg, ${P}30, ${P}10)`, boxShadow: `0 0 24px ${theme.glow}` }}
      >
        <span className="text-2xl font-bold" style={{ color: P }}>{pct >= 80 ? "A+" : pct >= 50 ? "B" : "C"}</span>
      </div>

      {/* Score */}
      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">{t.gameScoring.gameOver}</h2>
      {isNewHighScore && (
        <p className="text-sm font-bold mb-2 game-pop" style={{ color: P }}>{t.gameScoring.newHighScore}</p>
      )}
      <p className="text-4xl font-extrabold mb-6 tabular-nums" style={{ color: P }}>
        {t.gameScoring.finalScore.replace("{score}", String(score))}
      </p>

      {/* Stats row */}
      <div className="flex justify-center gap-3 mb-6">
        <StatBox label={t.gameScoring.correctCount.replace("{count}", "")} value={String(correctCount)} color="#22c55e" />
        <StatBox label={t.gameScoring.wrongCount.replace("{count}", "")} value={String(wrongCount)} color="#ef4444" />
        <StatBox label={t.gameScoring.streakBest.replace("{count}", "")} value={String(bestStreak)} color={P} />
      </div>

      {/* Accuracy bar */}
      <div className="mx-auto max-w-[200px] mb-6">
        <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${P}, ${theme.secondary})` }}
          />
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">%{pct}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onRestart}
          className="px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${P}, ${theme.secondary || P})`, boxShadow: `0 4px 14px ${theme.glow}` }}
        >
          {t.gameScoring.playAgain}
        </button>
        {onSetup && (
          <button
            onClick={onSetup}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] py-2 font-medium"
          >
            {setupLabel || t.gameScoring.changeSurah}
          </button>
        )}
        <Link to="/games" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-medium">
          {t.gameScoring.backToGames}
        </Link>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-2.5 rounded-xl min-w-[72px]"
      style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
    >
      <span className="text-xl font-extrabold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{label.trim()}</span>
    </div>
  );
}
