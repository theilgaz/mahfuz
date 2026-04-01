/**
 * Quran.com WBW Türkçe Yama Üreticisi
 *
 * Quran.com API'sinde Türkçe karşılığı olmayan Arapça kelimelerin
 * İngilizce fallback çevirilerini MyMemory (ücretsiz, key gerektirmez)
 * aracılığıyla Türkçeye çevirir ve public/wbw-tr-patch.json oluşturur.
 *
 * Kullanım (apps/web/ dizininden):
 *   npx tsx scripts/generate-wbw-tr-patch.ts
 *
 * Çıktı: apps/web/public/wbw-tr-patch.json
 *   { "تَرَ": "gördün", "يَجْعَلْ": "kıldı", ... }
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT_FILE = resolve(import.meta.dirname, "../public/wbw-tr-patch.json");
const SCAN_FILE = "/tmp/wbw_missing_tr.json";

/** Aynı anda kaç kelime paralel çevrilsin */
const CONCURRENCY = 5;
/** İstekler arası bekleme (ms) — MyMemory rate limiti için */
const DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * MyMemory ücretsiz API ile en → tr çevirisi.
 * Başarısız olursa boş string döner (hata fırlatmaz).
 */
async function translateEnToTr(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "";
    const data = await res.json();
    const translated: string = data?.responseData?.translatedText ?? "";
    // MyMemory bazen kaynağı döner — farklıysa kabul et
    if (translated && translated.toLowerCase() !== text.toLowerCase()) {
      return translated;
    }
    return "";
  } catch {
    return "";
  }
}

async function main() {
  // Tarama dosyasını kontrol et
  if (!existsSync(SCAN_FILE)) {
    console.error(`Tarama dosyası bulunamadı: ${SCAN_FILE}`);
    console.error(
      "Önce tüm sureleri tara. Tarama dosyası generate-wbw-tr-patch script'i çalıştırıldığında otomatik oluşturulur.",
    );
    console.error(
      "Veya sureleri elle trayarak /tmp/wbw_missing_tr.json dosyası oluşturun.",
    );
    process.exit(1);
  }

  const scanData = JSON.parse(readFileSync(SCAN_FILE, "utf-8"));
  const uniqueWords: Record<string, string> = scanData.unique_words ?? {};
  const entries = Object.entries(uniqueWords); // [arabic, english][]

  console.log(`Toplam eksik kelime: ${entries.length}`);

  // Mevcut patch varsa yükle (kaldığımız yerden devam et)
  let patch: Record<string, string> = {};
  if (existsSync(OUT_FILE)) {
    patch = JSON.parse(readFileSync(OUT_FILE, "utf-8"));
    const existing = Object.keys(patch).length;
    console.log(`Mevcut patch yüklendi: ${existing} kelime`);
  }

  // Zaten çevrilenleri atla
  const remaining = entries.filter(([ar]) => !patch[ar]);
  console.log(`Çevrilecek: ${remaining.length} kelime\n`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const chunk = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async ([arabic, english]) => {
        const tr = await translateEnToTr(english);
        return { arabic, english, tr };
      }),
    );

    for (const { arabic, english, tr } of results) {
      if (tr) {
        patch[arabic] = tr;
        processed++;
      } else {
        failed++;
        if (failed <= 10) {
          console.warn(`  Çevrilemedi: ${arabic} (${english})`);
        }
      }
    }

    // Her 50 kelimede bir ara kaydet
    if ((i + CONCURRENCY) % 50 === 0 || i + CONCURRENCY >= remaining.length) {
      writeFileSync(OUT_FILE, JSON.stringify(patch, null, 2), "utf-8");
      const pct = Math.min(100, Math.round(((i + CONCURRENCY) / remaining.length) * 100));
      process.stdout.write(`\r${pct}% (${i + CONCURRENCY}/${remaining.length}) ...`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\n--- Tamamlandı ---`);
  console.log(`Çevrilen: ${processed}`);
  console.log(`Başarısız: ${failed}`);
  console.log(`Toplam patch: ${Object.keys(patch).length} kelime`);
  console.log(`Çıktı: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
