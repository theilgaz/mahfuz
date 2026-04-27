/**
 * Audio veri servisi — QDC API'den chapter audio verisi çeker.
 *
 * Segment verisi olmayan kâriler için Mishari'nin segment oranları
 * referans alınıp mevcut kârinin ayet süresine ölçeklenir.
 */

import type { ChapterAudioData } from "@mahfuz/audio-engine";

const QDC_API = "https://api.qurancdn.com/api/qdc";
const AUDIO_CDN = "https://audio.qurancdn.com/";
const FALLBACK_RECITER_ID = 7; // Mishari Rashid al-Afasy

/** Slug → QDC reciter ID mapping */
export const SLUG_TO_QDC_ID: Record<string, number> = {
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
  "yasser-ad-dossari": 97,
};

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

/** Segment cache — aynı sure için tekrar API çağrısı yapmamak için */
const segmentCache = new Map<string, QDCVerseTiming[]>();

async function fetchRawTimings(reciterId: number, chapterId: number): Promise<QDCAudioResponse | null> {
  const url = `${QDC_API}/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Mishari'nin segment oranlarını alıp hedef kârinin ayet süresine ölçekler.
 *
 * Her segment [wordPos, startMs, endMs] formatında.
 * Oran: (segStart - verseStart) / verseDuration → hedef ayet süresine çarp.
 */
function scaleSegments(
  referenceSegments: [number, number, number][],
  refFrom: number,
  refTo: number,
  targetFrom: number,
  targetTo: number,
): [number, number, number][] {
  const refDuration = refTo - refFrom;
  const targetDuration = targetTo - targetFrom;
  if (refDuration <= 0 || targetDuration <= 0) return [];

  const ratio = targetDuration / refDuration;
  return referenceSegments.map(([wordPos, startMs, endMs]) => [
    wordPos,
    Math.round(targetFrom + (startMs - refFrom) * ratio),
    Math.round(targetFrom + (endMs - refFrom) * ratio),
  ]);
}

/**
 * Verse timing'lerde segment verisi eksikse Mishari'den fallback çeker.
 */
async function fillMissingSegments(
  timings: QDCVerseTiming[],
  chapterId: number,
  reciterId: number,
): Promise<QDCVerseTiming[]> {
  // Segment verisi olan ayet var mı kontrol et
  const hasSegments = timings.some((vt) => vt.segments && vt.segments.length > 0);
  if (hasSegments) return timings; // Zaten segment var, dokunma

  // Kendisi fallback kâri ise yapacak bir şey yok
  if (reciterId === FALLBACK_RECITER_ID) return timings;

  // Mishari'nin verilerini çek (cache'den veya API'den)
  const cacheKey = `${FALLBACK_RECITER_ID}:${chapterId}`;
  let refTimings = segmentCache.get(cacheKey);

  if (!refTimings) {
    try {
      const refData = await fetchRawTimings(FALLBACK_RECITER_ID, chapterId);
      const refFile = refData?.audio_files?.[0];
      if (refFile?.verse_timings) {
        refTimings = refFile.verse_timings;
        segmentCache.set(cacheKey, refTimings);
      }
    } catch {
      // Fallback çekilemezse segment'siz devam et
      return timings;
    }
  }

  if (!refTimings) return timings;

  // Verse key → referans timing map
  const refMap = new Map(refTimings.map((vt) => [vt.verse_key, vt]));

  return timings.map((vt) => {
    if (vt.segments && vt.segments.length > 0) return vt; // Zaten var

    const ref = refMap.get(vt.verse_key);
    if (!ref || !ref.segments || ref.segments.length === 0) return vt;

    return {
      ...vt,
      segments: scaleSegments(
        ref.segments,
        ref.timestamp_from,
        ref.timestamp_to,
        vt.timestamp_from,
        vt.timestamp_to,
      ),
    };
  });
}

/**
 * QDC API'den chapter audio verisini çeker.
 * Segment verisi yoksa Mishari'den orantılı fallback üretir.
 */
export async function fetchChapterAudio(
  reciterId: number,
  chapterId: number,
): Promise<ChapterAudioData | null> {
  try {
    const data = await fetchRawTimings(reciterId, chapterId);
    const file = data?.audio_files?.[0];

    if (!file) return null;

    const timings = await fillMissingSegments(file.verse_timings, chapterId, reciterId);

    return {
      audioUrl: normalizeUrl(file.audio_url),
      verseTimings: timings.map((vt) => ({
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
