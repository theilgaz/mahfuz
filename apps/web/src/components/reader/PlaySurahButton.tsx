/**
 * Sure ses oynatma butonu — QDC'den audio verisini çekip oynatır.
 */

import { useState, useCallback } from "react";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudio } from "~/lib/audio-service";

// Slug → QDC reciter ID mapping
const SLUG_TO_QDC_ID: Record<string, number> = {
  "mishary-rashid-alafasy": 7,
  "mahmoud-khalil-al-husary": 6,
  "mahmood-ali-al-banna": 129,
  "mahmoud-khalil-al-husary-muallim": 12,
  "khalid-al-jalil": 170,
  "fatih-seferagic": 134,
  "abdulbasit-abdulsamad-mujawwad": 1,
  "abdulbasit-abdulsamad-murattal": 2,
  "abdur-rahman-as-sudais": 3,
  "maher-al-muaiqly": 52,
  "saad-al-ghamdi": 13,
  "saud-ash-shuraim": 10,
  "minshawi-murattal": 9,
  "minshawi-mujawwad": 8,
};

interface PlaySurahButtonProps {
  surahId: number;
  surahName: string;
}

export function PlaySurahButton({ surahId, surahName }: PlaySurahButtonProps) {
  const [loading, setLoading] = useState(false);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const chapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);

  const isThisSurahPlaying = chapterId === surahId && playbackState === "playing";

  const handleClick = useCallback(async () => {
    // Aynı sure çalıyorsa toggle
    if (chapterId === surahId) {
      togglePlayPause();
      return;
    }

    setLoading(true);
    try {
      const reciterId = SLUG_TO_QDC_ID[reciterSlug] ?? 7;
      const audioData = await fetchChapterAudio(reciterId, surahId);
      if (audioData) {
        playSurah(surahId, surahName, audioData);
      }
    } finally {
      setLoading(false);
    }
  }, [surahId, surahName, chapterId, reciterSlug, playSurah, togglePlayPause]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
      aria-label={isThisSurahPlaying ? "Duraklat" : `${surahName} dinle`}
    >
      {loading ? (
        <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin" stroke="currentColor" fill="none" strokeWidth="2">
          <circle cx="9" cy="9" r="7" strokeDasharray="22 14" />
        </svg>
      ) : isThisSurahPlaying ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="4" y="3" width="3" height="12" rx="1" />
          <rect x="11" y="3" width="3" height="12" rx="1" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M5 3L15 9L5 15V3Z" />
        </svg>
      )}
    </button>
  );
}
