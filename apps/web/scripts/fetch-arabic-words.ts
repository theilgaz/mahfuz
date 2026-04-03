/**
 * Faz A — Arapça Kelime Verisi Toplama
 *
 * Quran.com API v4'ten tüm 6,236 ayetin kelime bazlı Arapça verisini çeker
 * ve Ömer Çelik mealiyle birleştirerek hizalama scriptine hazır bir
 * veri dosyası üretir.
 *
 * Kullanım (apps/web/ dizininden):
 *   npx tsx scripts/fetch-arabic-words.ts
 *
 * Çıktı: scripts/data/arabic-words.json
 *   {
 *     "1:1": {
 *       "arabic": [{ "pos": 1, "text": "بِسْمِ", "translit": "bis'mi" }, ...],
 *       "turkish": "Rahmân ve Rahîm Allah'ın ismiyle…"
 *     },
 *     ...
 *   }
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const QDC_API = "https://api.quran.com/api/v4";
const OC_FILE = resolve(import.meta.dirname, "../public/translations/omer-celik.json");
const OUT_FILE = resolve(import.meta.dirname, "data/arabic-words.json");
const TOTAL_SURAHS = 114;

/** İstek başarısız olursa kaç kez tekrar dene */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

interface QDCWord {
  position: number;
  text_uthmani: string;
  char_type_name: string;
  transliteration?: { text: string };
}

interface QDCVerse {
  verse_key: string;
  words: QDCWord[];
}

interface QDCResponse {
  verses: QDCVerse[];
  pagination: { total_pages: number; current_page: number; total_records: number };
}

interface ArabicWord {
  pos: number;
  text: string;
  translit: string;
}

interface VerseData {
  arabic: ArabicWord[];
  turkish: string;
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
      if (res.status === 429) {
        // Rate limit — bekle
        const wait = RETRY_DELAY_MS * attempt;
        console.warn(`  Rate limit (${res.status}), ${wait}ms bekliyor…`);
        await sleep(wait);
        continue;
      }
      throw new Error(`HTTP ${res.status}: ${url}`);
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`  Hata (deneme ${attempt}/${MAX_RETRIES}): ${err}`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw new Error(`Tüm denemeler başarısız: ${url}`);
}

async function fetchSurahWords(
  surahId: number
): Promise<Map<string, ArabicWord[]>> {
  const wordMap = new Map<string, ArabicWord[]>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url =
      `${QDC_API}/verses/by_chapter/${surahId}` +
      `?words=true` +
      `&word_fields=text_uthmani,transliteration` +
      `&per_page=50` +
      `&page=${page}`;

    const res = await fetchWithRetry(url);
    const data: QDCResponse = await res.json();
    totalPages = data.pagination.total_pages;

    for (const verse of data.verses) {
      const words: ArabicWord[] = verse.words
        .filter((w) => w.char_type_name === "word")
        .map((w) => ({
          pos: w.position,
          text: w.text_uthmani,
          translit: w.transliteration?.text ?? "",
        }));
      wordMap.set(verse.verse_key, words);
    }

    page++;
    // Sayfalama arası kısa bekleme — rate limit önlemi
    if (page <= totalPages) await sleep(200);
  }

  return wordMap;
}

async function main() {
  // Ömer Çelik mealini yükle
  if (!existsSync(OC_FILE)) {
    console.error(`Ömer Çelik meali bulunamadı: ${OC_FILE}`);
    process.exit(1);
  }
  const ocData = JSON.parse(readFileSync(OC_FILE, "utf-8"));
  const ocVerses: Record<string, string> = ocData.verses;
  console.log(`Ömer Çelik: ${Object.keys(ocVerses).length} ayet yüklendi.`);

  // Mevcut çıktı varsa yükle (kaldığımız yerden devam)
  let result: Record<string, VerseData> = {};
  if (existsSync(OUT_FILE)) {
    result = JSON.parse(readFileSync(OUT_FILE, "utf-8"));
    const done = Object.keys(result).length;
    console.log(`Mevcut veri: ${done} ayet (kaldığımız yerden devam).`);
  }

  // Hangi sureler işlenmemiş?
  const doneSurahs = new Set<number>();
  for (const key of Object.keys(result)) {
    doneSurahs.add(parseInt(key.split(":")[0]));
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });

  let totalVerses = 0;
  let totalWords = 0;

  for (let surahId = 1; surahId <= TOTAL_SURAHS; surahId++) {
    if (doneSurahs.has(surahId)) {
      // Bu sure zaten işlenmiş — sadece sayım
      const suraVerses = Object.keys(result).filter(
        (k) => k.startsWith(`${surahId}:`)
      );
      totalVerses += suraVerses.length;
      for (const k of suraVerses) {
        totalWords += result[k].arabic.length;
      }
      process.stdout.write(
        `\rSure ${surahId}/${TOTAL_SURAHS} (önbellekten) — toplam ${totalVerses} ayet, ${totalWords} kelime`
      );
      continue;
    }

    process.stdout.write(`\rSure ${surahId}/${TOTAL_SURAHS} çekiliyor…      `);

    try {
      const wordMap = await fetchSurahWords(surahId);

      for (const [verseKey, words] of wordMap) {
        const turkish = ocVerses[verseKey] ?? "";
        result[verseKey] = { arabic: words, turkish };
        totalVerses++;
        totalWords += words.length;
      }

      // Her sure sonrası kaydet
      writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), "utf-8");

      process.stdout.write(
        `\rSure ${surahId}/${TOTAL_SURAHS} ✓ — toplam ${totalVerses} ayet, ${totalWords} kelime`
      );

      // Sureler arası bekleme
      await sleep(500);
    } catch (err) {
      console.error(`\nSure ${surahId} hatası: ${err}`);
      console.error("Kaldığımız yerden devam etmek için scripti tekrar çalıştırın.");
      // Mevcut veriyi kaydet
      writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), "utf-8");
      process.exit(1);
    }
  }

  console.log(`\n\n=== Faz A Tamamlandı ===`);
  console.log(`Toplam ayet   : ${totalVerses}`);
  console.log(`Toplam kelime : ${totalWords}`);
  console.log(`Çıktı         : ${OUT_FILE}`);
  console.log(`\nSıradaki adım: npx tsx scripts/build-wbw-oc.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
