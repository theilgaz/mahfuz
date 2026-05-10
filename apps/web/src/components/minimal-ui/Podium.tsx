/**
 * Podyum — top 3 oyuncu için 1. ortada, 2. solda, 3. sağda dizilen kart.
 * Liderlik tablosu ve sezon kupalarında kullanılır.
 */

import { LeagueBadge } from "./LeagueIcons";
import type { League } from "~/lib/league";

export interface PodiumEntry {
  userId: string;
  userName: string;
  userImage: string | null;
  bestScore: number;
  league: League;
  rank?: number;
}

interface PodiumProps {
  entries: PodiumEntry[];
  currentUserId?: string | null;
  scoreSuffix?: string;
}

const PLACE_COLORS: Record<number, string> = {
  1: "#d4a437",
  2: "#a8a8a8",
  3: "#b87333",
};

function CrownIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 8.5l4 3 5-6 5 6 4-3-1.5 9.5h-15L3 8.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="3" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="21" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="3.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function Podium({ entries, currentUserId, scoreSuffix }: PodiumProps) {
  if (entries.length === 0) return null;

  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;

  return (
    <div className="mu-podium">
      <PodiumSlot entry={second} place={2} currentUserId={currentUserId} scoreSuffix={scoreSuffix} />
      <PodiumSlot entry={first} place={1} currentUserId={currentUserId} scoreSuffix={scoreSuffix} />
      <PodiumSlot entry={third} place={3} currentUserId={currentUserId} scoreSuffix={scoreSuffix} />
    </div>
  );
}

function PodiumSlot({
  entry,
  place,
  currentUserId,
  scoreSuffix,
}: {
  entry: PodiumEntry | null;
  place: 1 | 2 | 3;
  currentUserId?: string | null;
  scoreSuffix?: string;
}) {
  const color = PLACE_COLORS[place];
  if (!entry) {
    return (
      <div className={`mu-podium-slot place-${place} empty`} aria-hidden="true">
        <div className="mu-podium-pillar" data-place={place}>
          <span className="mu-podium-pillar-num">{place}</span>
        </div>
      </div>
    );
  }
  const isYou = currentUserId === entry.userId;
  return (
    <div className={`mu-podium-slot place-${place}`}>
      {place === 1 && (
        <span className="mu-podium-crown" style={{ color }}>
          <CrownIcon size={26} />
        </span>
      )}
      <div className="mu-podium-avatar" style={{ borderColor: color }}>
        {entry.userImage ? (
          <img src={entry.userImage} alt="" />
        ) : (
          <span className="mu-podium-initial">
            {(entry.userName || "?")[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="mu-podium-meta">
        <div className="mu-podium-name-row">
          <LeagueBadge league={entry.league} size={12} />
          <span className="mu-podium-name">{entry.userName || "Anonim"}</span>
          {isYou && <span className="mu-ybadge">sen</span>}
        </div>
        <div className="mu-podium-score">
          {entry.bestScore.toLocaleString("tr-TR")}
          {scoreSuffix ? <span className="mu-podium-score-suffix"> {scoreSuffix}</span> : null}
        </div>
      </div>
      <div className="mu-podium-pillar" data-place={place} style={{ background: color }}>
        <span className="mu-podium-pillar-num">{place}</span>
      </div>
    </div>
  );
}
