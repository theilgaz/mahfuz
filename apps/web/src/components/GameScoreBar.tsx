/**
 * In-game score bar with countdown timer, score badge, streak indicator.
 */
import type { GameTheme } from "~/lib/game-themes";

interface GameScoreBarProps {
  theme: GameTheme;
  timerDisplay: string;
  timerProgress: number;
  score: number;
  streak: number;
  lastDelta: number | null;
  round: number;
}

export function GameScoreBar({ theme, timerDisplay, timerProgress, score, streak, lastDelta, round }: GameScoreBarProps) {
  const P = theme.primary;
  const urgent = timerProgress < 0.25;

  return (
    <div className="mb-4">
      {/* Timer bar */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`text-xs font-bold tabular-nums ${urgent ? "text-red-500" : ""}`}
          style={urgent ? undefined : { color: P }}
        >
          {timerDisplay}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${Math.max(0, timerProgress * 100)}%`,
              backgroundColor: urgent ? "#ef4444" : P,
            }}
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">#{round}</span>
      </div>

      {/* Score + streak */}
      <div className="flex items-center justify-end gap-2">
        {streak >= 2 && (
          <span
            className="game-streak-fire"
            style={{ color: P, backgroundColor: `${P}15`, ["--glow-color" as string]: theme.glow }}
          >
            {streak}x
          </span>
        )}
        <div className="relative">
          <span
            className="game-score-badge"
            style={{ backgroundColor: `${P}15`, color: P }}
          >
            {score}
          </span>
          {lastDelta !== null && lastDelta > 0 && (
            <span className="game-score-fly absolute -top-1 right-0 text-xs font-bold" style={{ color: P }}>
              +{lastDelta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
