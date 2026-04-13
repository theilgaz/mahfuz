/**
 * "Ezberimi Doğrula" — recite from memory, app confirms correctness.
 */

import { useState, useCallback, useEffect } from "react";
import { useRecitationStore } from "~/stores/recitation.store";
import { useRecitationEngine } from "~/hooks/useRecitationEngine";
import { useHifzStore, SURAH_VERSE_COUNTS } from "~/stores/hifz.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface VerificationModeProps {
  surahId: number;
  startAyah?: number;
  endAyah?: number;
}

interface VerseResult {
  ayah: number;
  success: boolean;
  matchedAyah?: number;
  score?: number;
}

export function VerificationMode({ surahId, startAyah = 1, endAyah }: VerificationModeProps) {
  const { t, locale } = useTranslation();
  const totalAyahs = SURAH_VERSE_COUNTS[surahId] ?? 7;
  const end = endAyah ?? totalAyahs;

  const [currentAyah, setCurrentAyah] = useState(startAyah);
  const [results, setResults] = useState<VerseResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const toggleVerse = useHifzStore((s) => s.toggleVerse);
  const memorized = useHifzStore((s) => s.memorized[surahId] ?? []);
  const engine = useRecitationEngine();
  const lastMatch = useRecitationStore((s) => s.lastMatch);

  // When we get a match, check if it's the expected verse
  useEffect(() => {
    if (!lastMatch || !engine.isRecording) return;

    const success = lastMatch.surah === surahId && lastMatch.ayah === currentAyah;
    const result: VerseResult = {
      ayah: currentAyah,
      success,
      matchedAyah: lastMatch.ayah,
      score: lastMatch.score,
    };

    setResults((prev) => [...prev, result]);

    // Auto-add to memorized on success
    if (success && !memorized.includes(currentAyah)) {
      toggleVerse(surahId, currentAyah);
    }

    // Advance or complete
    if (currentAyah < end) {
      setCurrentAyah((a) => a + 1);
      engine.reset();
    } else {
      setIsComplete(true);
      engine.stopListening();
    }
  }, [lastMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    setResults([]);
    setCurrentAyah(startAyah);
    setIsComplete(false);
    await engine.startListening();
  }, [engine, startAyah]);

  const correctCount = results.filter((r) => r.success).length;
  const totalAttempted = results.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {getSurahName(surahId, locale)}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t.recitation?.verify ?? "Ezber Doğrulama"} · {startAyah}-{end}. ayetler
          </p>
        </div>
        {!engine.isRecording && !isComplete && (
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium"
          >
            {t.recitation?.start ?? "Başlat"}
          </button>
        )}
      </div>

      {/* Current verse prompt */}
      {engine.isRecording && !isComplete && (
        <div className="rounded border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-4 text-center">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Ayet {currentAyah}</p>
          <p className="text-lg font-bold text-[var(--color-accent)]">
            {currentAyah}. ayeti okuyun
          </p>
          <div className="flex justify-center mt-3">
            <WaveformVisualizer rmsLevel={engine.rmsLevel} isActive={true} />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((r) => (
            <div
              key={r.ayah}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                r.success
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}
            >
              <span className="text-sm">
                Ayet {r.ayah}
              </span>
              <span className={`text-xs font-medium ${r.success ? "text-green-600" : "text-red-500"}`}>
                {r.success ? (t.recitation?.correct ?? "Doğru!") : (t.recitation?.incorrect ?? "Yanlış")}
                {r.score ? ` (%${Math.round(r.score * 100)})` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {isComplete && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {correctCount} / {totalAttempted}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t.recitation?.accuracy ?? "Doğruluk"}: %{totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0}
          </p>
          <button
            onClick={handleStart}
            className="mt-3 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
          >
            {t.recitation?.tryAgain ?? "Tekrar Dene"}
          </button>
        </div>
      )}
    </div>
  );
}
