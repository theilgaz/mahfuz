import type { ReactNode } from "react";
import { useTranslation } from "~/hooks/useTranslation";

interface GameHeaderProps {
  img: string;
  bg: string;
  isDark: boolean;
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

/**
 * Colored sticky header for game screens.
 * Uses the game's cover-image palette as a gradient fade.
 */
export function GameHeader({ img, bg, isDark, title, onBack, right }: GameHeaderProps) {
  const { t } = useTranslation();
  const fg = isDark ? "rgba(255,255,255,0.92)" : "rgba(20,12,4,0.88)";
  const btnBg = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  return (
    <div
      className="sticky top-0 z-20 -mx-4 px-4"
      style={{
        background: `linear-gradient(to bottom, ${bg}f2 0%, ${bg}bb 60%, transparent 100%)`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto py-3">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 active:opacity-60 transition-opacity"
          style={{ background: btnBg }}
          aria-label={t.nav.back}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: fg }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Icon */}
        <img
          src={img}
          alt=""
          className="w-9 h-9 rounded-[22%] shrink-0"
          draggable={false}
          style={{ boxShadow: `0 2px 8px ${bg}80` }}
        />

        {/* Title */}
        <span className="flex-1 text-sm font-bold truncate" style={{ color: fg }}>
          {title}
        </span>

        {/* Right slot */}
        {right && (
          <div className="shrink-0 flex items-center gap-2" style={{ color: fg }}>
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
