/**
 * In-game score bar with round dots, score badge, streak indicator.
 */
import type { GameTheme } from "~/lib/game-themes";
import { TOTAL_ROUNDS } from "~/lib/game-scoring";

interface GameScoreBarProps {
  theme: GameTheme;
  round: number;
  score: number;
  streak: number;
  lastDelta: number | null;
}

export function GameScoreBar({ theme, round, score, streak, lastDelta }: GameScoreBarProps) {
  const P = theme.primary;

  return (
    <div className="flex items-center justify-between gap-3 px-1 mb-4">
      {/* Round dots */}
      <div className="game-round-dots flex-wrap">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            className="game-round-dot"
            style={{
              backgroundColor: i < round - 1 ? P : i === round - 1 ? `${P}cc` : `${P}25`,
              width: i === round - 1 ? 10 : 8,
              height: i === round - 1 ? 10 : 8,
            }}
          />
        ))}
      </div>

      {/* Score + streak */}
      <div className="flex items-center gap-2">
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
