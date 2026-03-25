/**
 * Audio veri servisi — QDC API'den chapter audio verisi çeker.
 *
 * URL pattern: https://api.qurancdn.com/api/qdc/audio/reciters/{reciterId}/audio_files?chapter={chapterId}&segments=true
 */

import type { ChapterAudioData } from "@mahfuz/audio-engine";

const QDC_API = "https://api.qurancdn.com/api/qdc";
const AUDIO_CDN = "https://audio.qurancdn.com/";

interface QDCVerseTiming {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  segments: [number, number, number][];
}

interface QDCAudioResponse {
  audio_files: Array<{
    audio_url: string;
    duration: number;
    verse_timings: QDCVerseTiming[];
  }>;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return AUDIO_CDN + url.replace(/^\//, "");
}

/**
 * QDC API'den chapter audio verisini çeker.
 */
export async function fetchChapterAudio(
  reciterId: number,
  chapterId: number,
): Promise<ChapterAudioData | null> {
  try {
    const url = `${QDC_API}/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=true`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data: QDCAudioResponse = await res.json();
    const file = data.audio_files?.[0];

    if (!file) return null;

    return {
      audioUrl: normalizeUrl(file.audio_url),
      verseTimings: file.verse_timings.map((vt) => ({
        verseKey: vt.verse_key,
        from: vt.timestamp_from,
        to: vt.timestamp_to,
        segments: vt.segments,
      })),
    };
  } catch (err) {
    console.error("[audio-service] Fetch error:", err);
    return null;
  }
}
