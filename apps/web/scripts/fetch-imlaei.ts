/**
 * quran.com API'den imlâî metin çeker → public/imlaei/{surahId}.json
 *
 * Format: { "1:1": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", ... }
 *
 * Kullanım: npx tsx scripts/fetch-imlaei.ts
 */

const API_BASE = "https://api.quran.com/api/v4/quran/verses/imlaei";
const OUT_DIR = "public/imlaei";
const DELAY_MS = 300;

async function fetchSurah(surahId: number): Promise<Record<string, string>> {
  const url = `${API_BASE}?chapter_number=${surahId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for surah ${surahId}`);
  const data = await res.json();

  const result: Record<string, string> = {};
  for (const verse of data.verses) {
    result[verse.verse_key] = verse.text_imlaei;
  }
  return result;
}

async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const outDir = path.resolve(OUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  console.log("İmlâî metin çekiliyor...\n");

  for (let surahId = 1; surahId <= 114; surahId++) {
    try {
      const data = await fetchSurah(surahId);
      const count = Object.keys(data).length;
      const outPath = path.join(outDir, `${surahId}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data));
      console.log(`  ✓ Sure ${surahId} — ${count} ayet`);
    } catch (err) {
      console.error(`  ✗ Sure ${surahId} — ${err}`);
    }

    if (surahId < 114) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log("\nTamamlandı! public/imlaei/ altında 114 JSON dosyası.");
}

main();
