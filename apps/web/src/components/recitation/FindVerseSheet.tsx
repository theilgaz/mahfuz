/**
 * "Ayetimi Bul" — recite anything, app identifies the verse.
 */

import { useRecitationStore } from "~/stores/recitation.store";
import { useRecitationEngine } from "~/hooks/useRecitationEngine";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

export function FindVerseSheet() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const lastMatch = useRecitationStore((s) => s.lastMatch);
  const matchHistory = useRecitationStore((s) => s.matchHistory);
  const engine = useRecitationEngine();

  const handleGo = useCallback(
    (surah: number, ayah: number) => {
      navigate({
        to: "/surah/$surahSlug",
        params: { surahSlug: surahSlug(surah) },
        search: { ayah },
      });
    },
    [navigate],
  );

  return (
    <div className="space-y-4">
      {/* Current result */}
      {lastMatch && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold">
                {getSurahName(lastMatch.surah, locale)} : {lastMatch.ayah}
              </p>
              <p
                className="text-sm mt-1 leading-[2] line-clamp-2"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {lastMatch.text}
              </p>
            </div>
            <button
              onClick={() => handleGo(lastMatch.surah, lastMatch.ayah)}
              className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-medium shrink-0"
            >
              {t.recitation.goToVerse}
            </button>
          </div>
          {/* Confidence */}
          <div className="flex items-center gap-2 mt-3">
            <div className="h-1.5 flex-1 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${lastMatch.score * 100}%`,
                  backgroundColor: lastMatch.score > 0.7 ? "var(--color-accent)" : lastMatch.score > 0.4 ? "#e0aa30" : "#e04040",
                }}
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">
              %{Math.round(lastMatch.score * 100)} {t.recitation.confidence}
            </span>
          </div>
        </div>
      )}

      {/* No match message */}
      {!lastMatch && engine.lastTranscript && !engine.isRecording && (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t.recitation.noMatch}
          </p>
        </div>
      )}

      {/* History */}
      {matchHistory.length > 1 && (
        <div>
          <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
            Son Sonuçlar
          </h3>
          <div className="space-y-1">
            {matchHistory.slice(1, 5).map((m, i) => (
              <button
                key={`${m.surah}:${m.ayah}:${i}`}
                onClick={() => handleGo(m.surah, m.ayah)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-left"
              >
                <span className="text-sm">
                  {getSurahName(m.surah, locale)} : {m.ayah}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  %{Math.round(m.score * 100)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
