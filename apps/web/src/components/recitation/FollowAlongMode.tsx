/**
 * "Takip Et" — recite while reading, app highlights current position.
 */

import { useEffect } from "react";
import { useRecitationStore } from "~/stores/recitation.store";
import { useRecitationEngine } from "~/hooks/useRecitationEngine";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";

interface FollowAlongModeProps {
  surahId: number;
  /** Called when a verse is recognized — parent can scroll to it */
  onVerseRecognized?: (surah: number, ayah: number) => void;
}

export function FollowAlongMode({ surahId, onVerseRecognized }: FollowAlongModeProps) {
  const { t, locale } = useTranslation();
  const lastMatch = useRecitationStore((s) => s.lastMatch);
  const engine = useRecitationEngine();

  // Notify parent when a verse is recognized
  useEffect(() => {
    if (lastMatch && lastMatch.surah === surahId) {
      onVerseRecognized?.(lastMatch.surah, lastMatch.ayah);
    }
  }, [lastMatch, surahId, onVerseRecognized]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Mic toggle */}
      <button
        onClick={() => engine.isRecording ? engine.stopListening() : engine.startListening()}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
          engine.isRecording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-[var(--color-accent)] text-white"
        }`}
        aria-label={engine.isRecording ? (t.recitation?.stop ?? "Durdur") : (t.recitation?.start ?? "Başlat")}
      >
        {engine.isRecording ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
          </svg>
        )}
      </button>

      {/* Status */}
      <div className="flex-1 min-w-0">
        {engine.isRecording ? (
          <div className="flex items-center gap-2">
            <WaveformVisualizer rmsLevel={engine.rmsLevel} isActive={true} />
            {lastMatch ? (
              <span className="text-xs text-[var(--color-accent)] font-medium truncate">
                {getSurahName(lastMatch.surah, locale)} : {lastMatch.ayah}
              </span>
            ) : (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {t.recitation?.listening ?? "Dinleniyor..."}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t.recitation?.followAlongDesc ?? "Okurken sizi takip edelim"}
          </span>
        )}
      </div>
    </div>
  );
}
