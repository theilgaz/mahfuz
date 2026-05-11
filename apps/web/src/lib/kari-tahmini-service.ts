/**
 * "Kâri Tahmini" Meclis oyunu için server fn.
 *
 * Kısa, tanınır ayet havuzundan rastgele bir verse_key seçer; verse-level
 * mp3 desteği olan 4 kâri arasından birini doğru cevap olarak işaretler.
 * Audio URL quran.com v4 API'sinden runtime'da çözümlenir; reciters tablosundaki
 * audioBaseUrl değerleri çoğunlukla 404 verdiği için bu yola gidildi.
 */

import { createServerFn } from "@tanstack/react-start";
import { db, reciters } from "~/db";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Kısa, melodik, tanınır ayetler — kâri stilini ayırt etmek için
 * yeterli süre veriyor ama oyun ritmini bozmayacak kadar kısa.
 */
const VERSE_POOL: { key: string; surahName: string }[] = [
  { key: "1:1", surahName: "Fâtiha" },
  { key: "1:2", surahName: "Fâtiha" },
  { key: "1:6", surahName: "Fâtiha" },
  { key: "2:255", surahName: "Bakara (Ayetü'l-Kürsi)" },
  { key: "36:1", surahName: "Yâsîn" },
  { key: "55:1", surahName: "Rahmân" },
  { key: "55:13", surahName: "Rahmân" },
  { key: "67:1", surahName: "Mülk" },
  { key: "78:1", surahName: "Nebe" },
  { key: "93:1", surahName: "Duhâ" },
  { key: "94:1", surahName: "İnşirâh" },
  { key: "97:1", surahName: "Kadir" },
  { key: "99:1", surahName: "Zilzâl" },
  { key: "108:1", surahName: "Kevser" },
  { key: "109:1", surahName: "Kâfirûn" },
  { key: "110:1", surahName: "Nasr" },
  { key: "112:1", surahName: "İhlâs" },
  { key: "113:1", surahName: "Felak" },
  { key: "114:1", surahName: "Nâs" },
];

interface ReciterOption {
  slug: string;
  name: string;
}

export interface KariTahminiQuestion {
  verseKey: string;
  surahName: string;
  /** Doğru kârinin verse-level mp3 URL'i */
  audioUrl: string;
  correctSlug: string;
  options: ReciterOption[];
}

/**
 * Quran.com v4 API'sinde verse-level mp3'ü olduğu doğrulanmış qurancom_id'ler.
 * Bu liste dışındaki kâriler (Ghamdi, Maher, Yasser, Banna, Seferagic, Jalil)
 * /recitations/{id}/by_ayah endpoint'inden ses döndürmüyor, bu yüzden
 * Kâri Tahmini havuzuna dahil edilmiyor.
 */
const KARI_TAHMINI_SUPPORTED_IDS = [1, 2, 3, 6, 7, 8, 9, 10, 12];

async function resolveQuranComAudioUrl(qurancomId: number, verseKey: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.quran.com/api/v4/recitations/${qurancomId}/by_ayah/${verseKey}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { audio_files?: { url?: string }[] };
    const url = data.audio_files?.[0]?.url;
    if (!url) return null;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("http")) return url;
    return `https://verses.quran.com/${url}`;
  } catch {
    return null;
  }
}

export const getKariTahminiQuestion = createServerFn({ method: "GET" })
  .inputValidator((input: { optionCount?: number }) => input)
  .handler(async ({ data }): Promise<KariTahminiQuestion | null> => {
    const optionCount = data.optionCount ?? 4;
    const pool = await db
      .select()
      .from(reciters)
      .where(and(eq(reciters.isActive, true), inArray(reciters.qurancomId, KARI_TAHMINI_SUPPORTED_IDS)));
    if (pool.length < optionCount) return null;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, optionCount);
    const correct = picks[Math.floor(Math.random() * picks.length)];

    const verse = VERSE_POOL[Math.floor(Math.random() * VERSE_POOL.length)];
    if (correct.qurancomId == null) return null;
    const audioUrl = await resolveQuranComAudioUrl(correct.qurancomId, verse.key);
    if (!audioUrl) return null;

    return {
      verseKey: verse.key,
      surahName: verse.surahName,
      audioUrl,
      correctSlug: correct.slug,
      options: picks.map((r) => ({ slug: r.slug, name: r.name })),
    };
  });
