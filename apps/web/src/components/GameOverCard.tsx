/**
 * Shared game-over card with animated stats and themed styling.
 */
import { Link } from "@tanstack/react-router";
import type { GameTheme } from "~/lib/game-themes";
import { gameBgStyle } from "~/lib/game-themes";
import { ACHIEVEMENT_MAP } from "~/lib/game-achievements";
import { GAME_TITLES } from "~/lib/score-service";
import { LEAGUE_LABELS, type League } from "~/lib/league";
import { MedalLeague } from "~/components/minimal-ui/LeagueIcons";
import { useTranslation } from "~/hooks/useTranslation";

interface GameOverCardProps {
  theme: GameTheme;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestStreak: number;
  isNewHighScore: boolean;
  t: any;
  newAchievements?: string[];
  leagueUp?: { from: League; to: League } | null;
  onRestart: () => void;
  onSetup?: () => void;
  setupLabel?: string;
}

export function GameOverCard({
  theme, score, correctCount, wrongCount, bestStreak,
  isNewHighScore, t, newAchievements, leagueUp, onRestart, onSetup, setupLabel,
}: GameOverCardProps) {
  const P = theme.primary;
  const total = correctCount + wrongCount;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div
      className="max-w-3xl mx-auto px-4 pt-8 pb-20 text-center game-bounce-in min-h-dvh flex flex-col items-center justify-center game-bg"
      style={gameBgStyle(theme)}
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
        <StatBox label={t.gameScoring.correctCount.replace("{count}", "")} value={String(correctCount)} />
        <StatBox label={t.gameScoring.wrongCount.replace("{count}", "")} value={String(wrongCount)} />
        <StatBox label={t.gameScoring.streakBest.replace("{count}", "")} value={String(bestStreak)} />
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

      {/* League up */}
      {leagueUp && (
        <div
          className="mb-4 px-4 py-3 rounded-xl border flex items-center gap-3 game-pop"
          style={{ borderColor: `${P}40`, background: `linear-gradient(135deg, ${P}15, ${P}05)` }}
        >
          <MedalLeague league={leagueUp.to} size={32} />
          <div className="text-left flex-1">
            <p className="text-xs font-bold" style={{ color: P }}>Lig Atladın!</p>
            <p className="text-sm text-[var(--color-text-primary)]">
              {LEAGUE_LABELS[leagueUp.from]} → <strong>{LEAGUE_LABELS[leagueUp.to]}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Achievements unlocked */}
      {newAchievements && newAchievements.length > 0 && (
        <AchievementBanner achievements={newAchievements} primary={P} />
      )}

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

function AchievementBanner({ achievements, primary }: { achievements: string[]; primary: string }) {
  const { t } = useTranslation();
  const achT = t.achievements;
  const TIER_ICONS = ["", "\u25CB", "\u25CE", "\u2605"]; // bronze, silver, gold

  return (
    <div className="mb-6 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <p className="text-xs font-bold mb-2" style={{ color: primary }}>
        {achT?.unlocked ?? "Achievements Unlocked!"}
      </p>
      <div className="flex flex-col gap-1.5">
        {achievements.map((id) => {
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
          } else if (def?.category === "flawless" && def.gameId) {
            const gameTitle = GAME_TITLES[def.gameId] ?? def.gameId;
            name = `${gameTitle} - ${(achT?.["flawless" as keyof typeof achT] ?? "Flawless") as string}`;
          } else {
            name = (achT?.[id as keyof typeof achT] ?? id) as string;
          }
          return (
            <div key={id} className="flex items-center gap-2 text-left">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: `${primary}20`, color: primary }}
              >
                {tierIcon}
              </span>
              <span className="text-sm text-[var(--color-text-primary)]">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <span className="text-xl font-extrabold tabular-nums text-[var(--color-text-primary)]">{value}</span>
      <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{label.trim()}</span>
    </div>
  );
}
