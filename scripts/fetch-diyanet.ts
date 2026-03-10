/**
 * fetch-diyanet.ts
 *
 * Downloads Diyanet İşleri translation (resource_id=77) from quran.com API
 * and saves as local JSON file matching the existing translation format.
 *
 * Usage: npx tsx scripts/fetch-diyanet.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "translations");
const API_BASE = "https://api.quran.com/api/v4";
const RESOURCE_ID = 77; // Diyanet İşleri

interface ApiVerse {
  verse_key: string;
  translations: { text: string }[];
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const verses: Record<string, string> = {};
  let totalFetched = 0;

  // Fetch chapter by chapter (quran.com limits perPage to 50)
  const CHAPTER_VERSE_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
    54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
    49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
    44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
    26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
    6, 3, 5, 4, 5, 6,
  ];

  for (let chapter = 1; chapter <= 114; chapter++) {
    const verseCount = CHAPTER_VERSE_COUNTS[chapter - 1];
    const pages = Math.ceil(verseCount / 50);

    for (let page = 1; page <= pages; page++) {
      const url = `${API_BASE}/verses/by_chapter/${chapter}?language=tr&translations=${RESOURCE_ID}&translation_fields=text&fields=&per_page=50&page=${page}`;

      if (page === 1) {
        console.log(`Chapter ${chapter}/114 (${verseCount} verses, ${pages} pages)...`);
      }

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} for chapter ${chapter} page ${page}`);
      const data = await resp.json();

      for (const v of data.verses as ApiVerse[]) {
        if (v.translations?.[0]?.text) {
          // Clean HTML tags from translation text
          let text = v.translations[0].text
            .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
            .replace(/<[^>]+>/g, "")
            .trim();
          verses[v.verse_key] = text;
          totalFetched++;
        }
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const output = {
    id: "diyanet",
    name: "Diyanet İşleri",
    verses,
  };

  const outPath = join(OUTPUT_DIR, "diyanet.json");
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`\nWrote ${outPath} (${totalFetched} verses)`);

  if (totalFetched < 6236) {
    console.warn(`⚠ Expected 6236 verses, got ${totalFetched}`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
