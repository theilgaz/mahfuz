/**
 * Floating recitation bar — mic capture, model download, verse result display.
 * Positioned above AudioBar when both visible.
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRecitationStore } from "~/stores/recitation.store";
import { useRecitationEngine } from "~/hooks/useRecitationEngine";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";

export function RecitationBar() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const isBarVisible = useRecitationStore((s) => s.isBarVisible);
  const mode = useRecitationStore((s) => s.mode);
  const lastMatch = useRecitationStore((s) => s.lastMatch);
  const lastTranscript = useRecitationStore((s) => s.lastTranscript);
  const hideBar = useRecitationStore((s) => s.hideBar);
  const dismissResult = useRecitationStore((s) => s.dismissResult);
  const setMatchStore = useRecitationStore((s) => s.setMatch);
  const setEngineStateStore = useRecitationStore((s) => s.setEngineState);
  const setProgressStore = useRecitationStore((s) => s.setDownloadProgress);
  const setRmsStore = useRecitationStore((s) => s.setRmsLevel);
  const setErrorStore = useRecitationStore((s) => s.setError);

  const engine = useRecitationEngine();

  // Sync engine state to store
  useEffect(() => {
    setEngineStateStore(engine.state);
  }, [engine.state, setEngineStateStore]);

  useEffect(() => {
    setProgressStore(engine.progress);
  }, [engine.progress, setProgressStore]);

  useEffect(() => {
    setRmsStore(engine.rmsLevel);
  }, [engine.rmsLevel, setRmsStore]);

  useEffect(() => {
    if (engine.lastMatch !== null || engine.lastTranscript) {
      setMatchStore(engine.lastMatch, engine.lastTranscript);
    }
  }, [engine.lastMatch, engine.lastTranscript, setMatchStore]);

  useEffect(() => {
    setErrorStore(engine.error || engine.micError || null);
  }, [engine.error, engine.micError, setErrorStore]);

  if (!isBarVisible) return null;

  const isDownloading = engine.state === "downloading" || engine.state === "loading";
  const isReady = engine.state === "ready";
  const isListening = engine.isRecording;
  const hasResult = lastMatch !== null;
  const hasError = !!(engine.error || engine.micError);

  const handleMicToggle = async () => {
    if (isListening) {
      engine.stopListening();
    } else {
      dismissResult();
      await engine.startListening();
    }
  };

  const handleGoToVerse = () => {
    if (!lastMatch) return;
    navigate({
      to: "/surah/$surahSlug",
      params: { surahSlug: surahSlug(lastMatch.surah) },
      search: { ayah: lastMatch.ayah },
    });
    hideBar();
  };

  return (
    <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,380px)]">
      <div className="rounded bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <span className="text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-wide">
            {t.recitation.title}
          </span>
          <button
            onClick={hideBar}
            className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            aria-label={t.common.close}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3L11 11M11 3L3 11" />
            </svg>
          </button>
        </div>

        <div className="px-3 pb-3">
          {/* Downloading state */}
          {isDownloading && (
            <div className="py-3">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                {t.recitation.downloading} ({engine.progress}%)
              </p>
              <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${engine.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1.5">
                {t.recitation.downloadDesc}
              </p>
            </div>
          )}

          {/* Error state */}
          {hasError && !isDownloading && (
            <div className="py-3">
              <p className="text-xs text-red-500 mb-2">{engine.error || engine.micError}</p>
              <button
                onClick={() => engine.init()}
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white"
              >
                {t.recitation.tryAgain}
              </button>
            </div>
          )}

          {/* Ready / Listening / Result */}
          {!isDownloading && !hasError && (
            <div className="flex items-center gap-3 py-2">
              {/* Mic button */}
              <button
                onClick={handleMicToggle}
                className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[var(--color-accent)] text-white hover:opacity-90"
                }`}
                aria-label={isListening ? t.recitation.stop : t.recitation.start}
              >
                {isListening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <path d="M12 17v4" />
                  </svg>
                )}
              </button>

              {/* Content area */}
              <div className="flex-1 min-w-0">
                {isListening && !hasResult && (
                  <div className="flex items-center gap-2">
                    <WaveformVisualizer rmsLevel={engine.rmsLevel} isActive={true} />
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {t.recitation.listening}
                    </span>
                  </div>
                )}

                {hasResult && (
                  <div>
                    <p className="text-sm font-medium truncate">
                      {getSurahName(lastMatch.surah, locale) || `Sure ${lastMatch.surah}`}
                      <span className="text-[var(--color-text-secondary)] font-normal"> : {lastMatch.ayah}</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                      {lastMatch.text.slice(0, 60)}...
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-1 flex-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${lastMatch.score * 100}%`,
                            backgroundColor: lastMatch.score > 0.7 ? "var(--color-accent)" : lastMatch.score > 0.4 ? "#e0aa30" : "#e04040",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0">
                        {Math.round(lastMatch.score * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {!isListening && !hasResult && (isReady || engine.state === "idle") && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {t.recitation.findVerseDesc}
                  </p>
                )}
              </div>

              {/* Go to verse button */}
              {hasResult && (
                <button
                  onClick={handleGoToVerse}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-medium shrink-0 hover:opacity-90 transition-opacity"
                >
                  {t.recitation.goToVerse}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 2L8 6L4 10" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
