/**
 * Mic icon button — triggers recitation from various contexts.
 */

import { useRecitationStore, type RecitationMode } from "~/stores/recitation.store";
import { useTranslation } from "~/hooks/useTranslation";

interface RecitationButtonProps {
  mode?: RecitationMode;
  targetSurah?: number;
  targetAyah?: number;
  size?: number;
  className?: string;
  label?: string;
}

export function RecitationButton({
  mode = "find-verse",
  targetSurah,
  targetAyah,
  size = 20,
  className = "",
  label,
}: RecitationButtonProps) {
  const { t } = useTranslation();
  const setMode = useRecitationStore((s) => s.setMode);
  const showBar = useRecitationStore((s) => s.showBar);
  const engineState = useRecitationStore((s) => s.engineState);

  const isLoading = engineState === "downloading" || engineState === "loading";

  return (
    <button
      onClick={() => {
        setMode(mode, { surah: targetSurah, ayah: targetAyah });
        showBar();
      }}
      className={`flex items-center gap-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface)] ${className}`}
      aria-label={label ?? t.recitation.title}
    >
      {isLoading ? (
        <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-[var(--color-accent)]">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
        </svg>
      )}
      {label && <span className="text-xs text-[var(--color-accent)] font-medium">{label}</span>}
    </button>
  );
}
