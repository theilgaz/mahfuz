/**
 * Akıllı oynatma butonu — tüm okuma modlarında üst barda gösterilir.
 * Sure modunda: doğrudan oynatır/duraklatır.
 * Sayfa modunda: sayfadaki sureleri listeler, akıllı önerilerle oynatır.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudio, SLUG_TO_QDC_ID } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import { pageDataQueryOptions } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";

type SmartPlayButtonProps =
  | { mode: "surah"; surahId: number }
  | { mode: "page"; pageNumber: number };

export function SmartPlayButton(props: SmartPlayButtonProps) {
  if (props.mode === "surah") {
    return <SurahPlayButton surahId={props.surahId} />;
  }
  return <PagePlayButton pageNumber={props.pageNumber} />;
}

// ── Sure modu: doğrudan oynat/duraklat ──────────────────

function SurahPlayButton({ surahId }: { surahId: number }) {
  const [loading, setLoading] = useState(false);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const chapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const { t } = useTranslation();

  const isThisActive = chapterId === surahId;
  const isPlaying = isThisActive && playbackState === "playing";

  const handleClick = useCallback(async () => {
    if (isThisActive) {
      togglePlayPause();
      return;
    }
    setLoading(true);
    try {
      const reciterId = SLUG_TO_QDC_ID[reciterSlug] ?? 7;
      const audioData = await fetchChapterAudio(reciterId, surahId);
      if (audioData) {
        playSurah(surahId, SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`, audioData);
      }
    } finally {
      setLoading(false);
    }
  }, [isThisActive, surahId, reciterSlug, playSurah, togglePlayPause]);

  return (
    <PlayButtonBase
      isPlaying={isPlaying}
      isLoading={loading}
      onClick={handleClick}
      ariaLabel={isPlaying ? t.a11y.pause : t.reader.playSurah}
    />
  );
}

// ── Sayfa modu: sayfadaki sureleri listele ───────────────

function PagePlayButton({ pageNumber }: { pageNumber: number }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const chapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const { t } = useTranslation();

  // Sayfa verisi loader tarafından zaten yüklenmiş — cache'den anında gelir
  const { data: pageData } = useQuery(pageDataQueryOptions(pageNumber));
  const groups = pageData?.surahGroups ?? [];
  const idsOnPage = groups.map((g) => g.surah.id);
  const isPageActive = chapterId != null && idsOnPage.includes(chapterId);
  const isPagePlaying = isPageActive && playbackState === "playing";
  const isPagePaused = isPageActive && playbackState === "paused";

  // Popover dışına tıklanınca kapat
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const playFrom = useCallback(
    async (sid: number, verseKey: string) => {
      setLoadingId(sid);
      setOpen(false);
      try {
        const reciterId = SLUG_TO_QDC_ID[reciterSlug] ?? 7;
        const audioData = await fetchChapterAudio(reciterId, sid);
        if (audioData) {
          playSurah(sid, SURAH_NAMES_TR[sid] ?? `Sure ${sid}`, audioData, verseKey);
        }
      } finally {
        setLoadingId(null);
      }
    },
    [reciterSlug, playSurah],
  );

  const handleClick = useCallback(async () => {
    // Aynı sayfa çalıyor/duraklatılmış → toggle
    if (isPagePlaying || isPagePaused) {
      togglePlayPause();
      return;
    }
    if (groups.length === 0) return;

    // Tek sure ve sure bu sayfada başlıyorsa → doğrudan oynat
    if (groups.length === 1 && groups[0].isStart) {
      const g = groups[0];
      await playFrom(g.surah.id, `${g.surah.id}:1`);
      return;
    }

    // Birden fazla sure ya da ortadan başlayan sure → öneri listesi göster
    setOpen(true);
  }, [isPagePlaying, isPagePaused, groups, togglePlayPause, playFrom]);

  return (
    <div className="relative">
      <PlayButtonBase
        isPlaying={isPagePlaying}
        isLoading={loadingId !== null}
        onClick={handleClick}
        ariaLabel={isPagePlaying ? t.a11y.pause : t.reader.playPage}
      />

      {open && groups.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={popoverRef}
            className="absolute right-0 top-full mt-1.5 w-52 rounded bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm z-50 py-1.5 overflow-hidden"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <p className="px-3 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              {t.reader.startListening}
            </p>
            {groups.map((g) => {
              const name = SURAH_NAMES_TR[g.surah.id] ?? g.surah.nameSimple;
              const firstAyah = g.ayahs[0]?.ayahNumber ?? 1;
              const isLoading = loadingId === g.surah.id;
              return (
                <button
                  key={g.surah.id}
                  onClick={() => playFrom(g.surah.id, `${g.surah.id}:${firstAyah}`)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--color-surface)] transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                    {isLoading ? (
                      <svg
                        width="10" height="10" viewBox="0 0 10 10"
                        className="animate-spin" stroke="var(--color-accent)" fill="none" strokeWidth="1.5"
                      >
                        <circle cx="5" cy="5" r="3.5" strokeDasharray="11 7" />
                      </svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--color-accent)">
                        <path d="M2 1.5L7 4L2 6.5V1.5Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-[var(--color-text-primary)] truncate">
                      {g.surah.id}. {name}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {g.isStart ? t.reader.fromStart : t.reader.fromVerse.replace("{n}", String(firstAyah))}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Ortak oynat/duraklat butonu ──────────────────────────

function PlayButtonBase({
  isPlaying,
  isLoading,
  onClick,
  ariaLabel,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
        isPlaying
          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25"
          : "hover:bg-[var(--color-surface)] text-[var(--color-text-primary)]"
      }`}
      aria-label={ariaLabel}
    >
      {isLoading ? (
        <svg
          width="14" height="14" viewBox="0 0 14 14"
          className="animate-spin" stroke="currentColor" fill="none" strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="5.5" strokeDasharray="17 10" />
        </svg>
      ) : isPlaying ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="2.5" y="2" width="3" height="10" rx="1" />
          <rect x="8.5" y="2" width="3" height="10" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3.5 2L12 7L3.5 12V2Z" />
        </svg>
      )}
    </button>
  );
}
