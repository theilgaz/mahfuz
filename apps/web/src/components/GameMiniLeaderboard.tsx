/**
 * Mini leaderboard for a single game — shown on game setup screens.
 */

import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import {
  getGameLeaderboard,
  type LeaderboardEntry,
} from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";

interface Props {
  gameId: string;
  /** Dark variant for game screens with custom dark backgrounds. */
  dark?: boolean;
}

export function GameMiniLeaderboard({ gameId, dark }: Props) {
  const { t } = useTranslation();
  const { session } = useRouteContext({ from: "__root__" });
  const userId = session?.user?.id;

  const { data: board } = useQuery<LeaderboardEntry[]>({
    queryKey: ["game-leaderboard", gameId, "all"],
    queryFn: () => getGameLeaderboard({ data: { gameId, period: "all" } }),
    staleTime: 60_000,
  });

  if (!board?.length) return null;

  const top5 = board.slice(0, 5);

  const containerCls = dark
    ? "mt-5 rounded-2xl overflow-hidden"
    : "mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden";
  const containerStyle = dark ? { background: "rgba(255,255,255,0.08)" } : undefined;
  const headerCls = dark
    ? "flex items-center justify-between px-4 py-2.5 border-b border-white/10"
    : "flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]";
  const titleCls = dark
    ? "text-xs font-semibold text-white/80"
    : "text-xs font-semibold text-[var(--color-text-primary)]";
  const textPrimary = dark ? "text-white/90" : "text-[var(--color-text-primary)]";
  const textSecondary = dark ? "text-white/40" : "text-[var(--color-text-secondary)]";
  const avatarBg = dark ? "bg-white/15" : "bg-[var(--color-border)]";

  return (
    <div className={containerCls} style={containerStyle}>
      <div className={headerCls}>
        <h3 className={titleCls}>
          {t.gamesHub.scoreboard}
        </h3>
        <Link
          to="/games/scoreboard"
          search={{ game: gameId }}
          className="text-[10px] text-[var(--color-accent)] hover:underline"
        >
          {t.gamesHub.seeAll}
        </Link>
      </div>
      <div className="px-4 py-2.5 flex flex-col gap-2">
        {top5.map((entry) => {
          const isMe = entry.userId === userId;
          return (
            <div key={entry.userId} className="flex items-center gap-2.5">
              <span className={`w-4 text-center text-[10px] font-medium ${textSecondary} tabular-nums shrink-0`}>
                {entry.rank}
              </span>
              {entry.userImage ? (
                <img
                  src={entry.userImage}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={`w-5 h-5 rounded-full ${avatarBg} flex items-center justify-center shrink-0 text-[8px] font-bold ${textSecondary}`}>
                  {entry.userName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
              <span
                className={`flex-1 text-xs truncate ${
                  isMe
                    ? "text-[var(--color-accent)] font-medium"
                    : textPrimary
                }`}
              >
                {entry.userName}
              </span>
              <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>
                {entry.bestScore}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
