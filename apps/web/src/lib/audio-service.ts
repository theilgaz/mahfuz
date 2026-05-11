/**
 * Audio veri servisi — QDC API'den chapter audio verisi çeker.
 *
 * Segment verisi olmayan kâriler için Mishari'nin segment oranları
 * referans alınıp mevcut kârinin ayet süresine ölçeklenir.
 *
 * Chapter-only kâriler (QDC API'de olmayan, sadece sure-bazlı mp3 sunan)
 * `CHAPTER_ONLY_RECITERS` üzerinden yönlendirilir; bu kâriler için
 * verseTimings boş döner — kelime/ayet senkron yapılmaz, audio baştan sona oynar.
 */

import type { ChapterAudioData } from "@mahfuz/audio-engine";

const QDC_API = "https://api.qurancdn.com/api/qdc";
const AUDIO_CDN = "https://audio.qurancdn.com/";
const FALLBACK_RECITER_ID = 7; // Mishari Rashid al-Afasy

/** Slug → QDC reciter ID mapping */
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
  "yasser-ad-dossari": 97,
};

/**
 * Slug → sure-bazlı mp3 base URL.
 * Pattern: `${baseUrl}/${NNN}.mp3` (3 haneli sure no, 001-114).
 */
const CHAPTER_ONLY_RECITERS: Record<string, string> = {
  "badr-al-turki": "https://download.quranicaudio.com/quran/badr_al_turki/mp3",
  "omar-al-qazabri": "https://server9.mp3quran.net/omar_warsh",
  "abdullah-awad-al-juhani": "https://download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee",
  "abdullah-basfar": "https://download.quranicaudio.com/quran/abdullaah_basfar",
  "abu-bakr-al-shatri": "https://download.quranicaudio.com/quran/abu_bakr_ash-shaatree",
  "ali-abdur-rahman-al-huthaify": "https://download.quranicaudio.com/quran/huthayfi",
  "khalid-al-qahtani": "https://download.quranicaudio.com/quran/khaalid_al-qahtaanee",
  "nabil-ar-rifai": "https://download.quranicaudio.com/quran/nabil_rifa3i",
  "abdulmuhsin-al-qasim": "https://download.quranicaudio.com/quran/abdul_muhsin_alqasim",
  "muhammad-jibreel": "https://download.quranicaudio.com/quran/muhammad_jibreel/complete",
  "fares-abbad": "https://download.quranicaudio.com/quran/fares",
  "abdulbari-ath-thubaity": "https://download.quranicaudio.com/quran/thubaity",
  "sahl-yasin": "https://download.quranicaudio.com/quran/sahl_yaaseen",
  "salah-bukhatir": "https://download.quranicaudio.com/quran/salaah_bukhaatir",
  "ahmed-ibn-ali-al-ajmy": "https://download.quranicaudio.com/quran/ahmed_ibn_3ali_al-3ajamy",
  "sudais-and-shuraym": "https://download.quranicaudio.com/quran/sodais_and_shuraim",
  "abdulazeez-al-ahmad": "https://download.quranicaudio.com/quran/abdulazeez_al-ahmad",
  "muhammad-ayyoob": "https://download.quranicaudio.com/quran/muhammad_ayyoob",
  "tawfeeq-ibn-said-as-sawaigh": "https://download.quranicaudio.com/quran/tawfeeq_bin_saeed-as-sawaaigh",
  "abdullah-ali-jabir-taraweeh": "https://download.quranicaudio.com/quran/abdullaah_alee_jaabir",
  "muhammad-al-mehysni": "https://download.quranicaudio.com/quran/mehysni",
  "hani-ar-rifai": "https://download.quranicaudio.com/quran/rifai",
  "ibrahim-al-jibrin": "https://download.quranicaudio.com/quran/jibreen",
  "abdulwadud-haneef": "https://download.quranicaudio.com/quran/abdulwadood_haneef",
  "salah-al-budair": "https://download.quranicaudio.com/quran/salahbudair",
  "aziz-alili": "https://download.quranicaudio.com/quran/aziz_alili",
  "muhammad-al-luhaidan": "https://download.quranicaudio.com/quran/muhammad_alhaidan",
  "abdulbaset-abdulsamad-warsh": "https://download.quranicaudio.com/quran/abdulbaset_warsh",
  "al-hussayni-al-azazy-with-children": "https://download.quranicaudio.com/quran/alhusaynee_al3azazee_with_children",
  "abdur-rashid-sufi-soosi": "https://download.quranicaudio.com/quran/abdurrashid_sufi_soosi_rec",
  "sadaqat-ali": "https://download.quranicaudio.com/quran/sadaqat_ali",
  "abdur-rashid-sufi-khalaf": "https://download.quranicaudio.com/quran/abdurrashid_sufi_-_khalaf_3an_7amza_recitation",
  "hamad-sinan": "https://download.quranicaudio.com/quran/hamad_sinan",
  "abdur-razaq-bin-abtan-al-dulaimi-mujawwad": "https://download.quranicaudio.com/quran/abdulrazaq_bin_abtan_al_dulaimi",
  "abdullah-ali-jabir": "https://download.quranicaudio.com/quran/abdullaah_alee_jaabir_studio",
  "muhammad-abdul-kareem": "https://download.quranicaudio.com/quran/muhammad_abdulkareem",
  "mustafa-al-azawi": "https://download.quranicaudio.com/quran/mustafa_al3azzawi",
  "abdullah-khayat": "https://download.quranicaudio.com/quran/khayat",
  "mahmoud-khalil-al-husary-doori": "https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree_doori",
  "muhammad-hassan": "https://download.quranicaudio.com/quran/mu7ammad_7assan",
  "salah-al-hashim": "https://download.quranicaudio.com/quran/salah_alhashim",
  "adel-kalbani": "https://download.quranicaudio.com/quran/adel_kalbani",
  "hatem-farid-taraweeh-1432": "https://download.quranicaudio.com/quran/hatem_farid/taraweeh1432",
  "hatem-farid-taraweeh-1431": "https://download.quranicaudio.com/quran/hatem_farid/taraweeh1431",
  "mostafa-ismaeel": "https://download.quranicaudio.com/quran/mostafa_ismaeel",
  "muhammad-sulaiman-patel": "https://download.quranicaudio.com/quran/muhammad_patel",
  "mohammad-al-tablawi": "https://download.quranicaudio.com/quran/mohammad_altablawi",
  "mohammad-ismaeel-al-muqaddim": "https://download.quranicaudio.com/quran/mohammad_ismaeel_almuqaddim",
  "imad-zuhair-hafez": "https://download.quranicaudio.com/quran/imad_zuhair_hafez",
  "mishari-al-afasy-taraweeh-1430": "https://download.quranicaudio.com/quran/mishaari_california",
  "ibrahim-al-akhdar": "https://download.quranicaudio.com/quran/ibrahim_al_akhdar",
  "nasser-al-qatami": "https://download.quranicaudio.com/quran/nasser_bin_ali_alqatami",
  "abdulkareem-al-hazmi": "https://download.quranicaudio.com/quran/abdulkareem_al_hazmi",
  "muhammad-ayyoob-taraweeh": "https://download.quranicaudio.com/quran/muhammad_ayyoob_hq",
  "abdul-munim-abdul-mubdi": "https://download.quranicaudio.com/quran/abdulmun3im_abdulmubdi2",
  "abdur-rashid-sufi": "https://download.quranicaudio.com/quran/abdurrashid_sufi",
  "abdur-rashid-sufi-abi-al-haarith-an-al-kasaaee": "https://download.quranicaudio.com/quran/abdurrashid_sufi_abi_al7arith",
  "abdur-rashid-sufi-ad-doori-an-abi-amr": "https://download.quranicaudio.com/quran/abdurrashid_sufi_doori",
  "abdur-rashid-sufi-shubah-an-asim": "https://download.quranicaudio.com/quran/abdurrashid_sufi_shu3ba",
  "ahmad-al-huthaify": "https://download.quranicaudio.com/quran/ahmad_alhuthayfi",
  "ali-al-huthaify-qaloon": "https://download.quranicaudio.com/quran/huthayfi_qaloon",
  "abu-bakr-al-shatri-taraweeh": "https://download.quranicaudio.com/quran/abu_bakr_ash-shatri_tarawee7",
  "idrees-abkar": "https://download.quranicaudio.com/quran/idrees_abkar",
  "masjid-quba-taraweeh-1434": "https://download.quranicaudio.com/quran/masjid_quba_1434",
  "muhammad-al-mehysni-taraweeh-1435": "https://download.quranicaudio.com/quran/muhaisny_1435",
  "abdullah-matroud": "https://download.quranicaudio.com/quran/abdullah_matroud",
  "abdulwadood-haneef": "https://download.quranicaudio.com/quran/abdul_wadood_haneef_rare",
  "ahmad-nauina": "https://download.quranicaudio.com/quran/ahmad_nauina",
  "akram-al-alaqmi": "https://download.quranicaudio.com/quran/akram_al_alaqmi",
  "ali-hajjaj-alsouasi": "https://download.quranicaudio.com/quran/ali_hajjaj_alsouasi",
  "mahmood-ali-al-bana": "https://download.quranicaudio.com/quran/mahmood_ali_albana",
  "wadee-hammadi-al-yamani": "https://download.quranicaudio.com/quran/wadee_hammadi_al-yamani",
  "asim-abdul-aleem": "https://download.quranicaudio.com/quran/asim_abdulaleem",
  "abdallah-abdal": "https://download.quranicaudio.com/quran/abdallah_abdal",
  "abdur-rashid-sufi-soosi-2020": "https://download.quranicaudio.com/quran/abdurrashid_sufi_soosi_2020",
  "hatem-farid-taraweeh-1430": "https://download.quranicaudio.com/quran/hatem_farid/taraweeh1430",
  "mahmoud-khaleel-al-husary-muallam": "https://download.quranicaudio.com/quran/husary_muallim",
  "mahmoud-khaleel-al-husary-with-children": "https://download.quranicaudio.com/quran/husary_muallim_kids_repeat",
  "noreen-siddiq-ad-doori-an-abi-amr": "https://download.quranicaudio.com/quran/noreen_siddiq",
  "saud-ash-shuraym-older-recitation": "https://download.quranicaudio.com/quran/sa3ood_al-shuraym/older",
  "sudais-and-shuraym-older-recitation": "https://download.quranicaudio.com/quran/sodais_and_shuraim/older",
  "khalifah-taniji": "https://download.quranicaudio.com/quran/khalifah_taniji",
  "abdulrahman-al-shahat": "https://download.quranicaudio.com/quran/abdulrahman_al_shahat",
  "abdulaziz-bin-saleh-al-zahrani": "https://download.quranicaudio.com/quran/abdulaziz_bin_saleh_alzahrani",
  "mahmoud-khaleel-al-husary-mujawwad": "https://download.quranicaudio.com/quran/generated/husary_mujawwad",
  "alijon-qari": "https://download.quranicaudio.com/quran/alijon_qari/mp3",
  "raad-mohammad-al-kurdi": "https://download.quranicaudio.com/quran/raad_mohammad_al_kurdi/mp3",
  "peshawa-qadir-al-kurdi": "https://download.quranicaudio.com/quran/peshawa_qadir_al-kurdi/mp3",
  "farman-shawani": "https://download.quranicaudio.com/quran/farman_shawani/mp3",
};

export function isChapterOnlyReciter(slug: string): boolean {
  return slug in CHAPTER_ONLY_RECITERS;
}

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
async function fetchChapterAudio(
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

/**
 * Chapter-only kâri için ham mp3 URL üretir, boş verseTimings ile döner.
 * Audio engine boş timing'i destekliyor (sure baştan sona oynar, ayet senkronu yok).
 */
function buildChapterOnlyAudio(
  baseUrl: string,
  chapterId: number,
): ChapterAudioData {
  const padded = String(chapterId).padStart(3, "0");
  return {
    audioUrl: `${baseUrl}/${padded}.mp3`,
    verseTimings: [],
  };
}

/**
 * Slug üzerinden chapter audio çeker. Chapter-only kârileri otomatik yönlendirir.
 */
export async function fetchChapterAudioForSlug(
  slug: string,
  chapterId: number,
): Promise<ChapterAudioData | null> {
  const chapterOnlyBase = CHAPTER_ONLY_RECITERS[slug];
  if (chapterOnlyBase) {
    return buildChapterOnlyAudio(chapterOnlyBase, chapterId);
  }
  const reciterId = SLUG_TO_QDC_ID[slug] ?? FALLBACK_RECITER_ID;
  return fetchChapterAudio(reciterId, chapterId);
}
