/**
 * İbn Kesir Türkçe mealini fawazahmed0/quran-api kaynağından çeker
 * ve diğer mealler gibi public/translations/ibni-kesir-tr.json'a yazar.
 *
 * Kullanım (apps/web/ dizininden):
 *   npx tsx scripts/fetch-ibni-kesir.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/tur-ibnikesir.json";
const OUT_DIR = resolve(import.meta.dirname, "../public/translations");
const OUT_FILE = resolve(OUT_DIR, "ibni-kesir-tr.json");

interface FawazVerse { chapter: number; verse: number; text: string }
interface FawazPayload { quran: FawazVerse[] }

async function main() {
  console.log(`Fetching ${SOURCE_URL}...`);
  const resp = await fetch(SOURCE_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for source`);
  const data = (await resp.json()) as FawazPayload;
  if (!Array.isArray(data.quran)) throw new Error("Unexpected response shape");
  console.log(`  Loaded ${data.quran.length} verses`);

  const verses: Record<string, string> = {};
  for (const v of data.quran) {
    const key = `${v.chapter}:${v.verse}`;
    const text = v.text.replace(/\s+/g, " ").trim();
    verses[key] = text;
  }
  const count = Object.keys(verses).length;
  if (count !== 6236) {
    console.warn(`  Warning: expected 6236 verses, got ${count}`);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    id: "ibni-kesir-tr",
    name: "İbn Kesir",
    verses,
  };
  writeFileSync(OUT_FILE, JSON.stringify(payload));

  const sizeKb = Math.round(JSON.stringify(payload).length / 1024);
  console.log(`Wrote ${OUT_FILE} (${sizeKb} KB, ${count} verses)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
