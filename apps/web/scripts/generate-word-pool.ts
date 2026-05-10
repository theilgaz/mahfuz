/**
 * Generate a static Quran word pool bucketed into normal/zor for word games.
 *
 * Usage (from apps/web/):
 *   npx tsx scripts/generate-word-pool.ts
 *
 * Sources:
 *   scripts/data/arabic-words.json — full Quran words per verse (for frequency)
 *   public/wbw-tr-patch.json       — arabic → turkish meaning map
 *
 * Output: public/data/quran-word-pool.json
 *   { normal: [{arabic, meaning}], zor: [{arabic, meaning}] }
 *
 * Bucketing:
 *   Top 40% of unique forms by occurrence count → normal
 *   Bottom 60% → zor
 *   Words without a Turkish meaning are skipped.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ARABIC_WORDS = resolve(ROOT, "scripts/data/arabic-words.json");
const WBW_PATCH = resolve(ROOT, "public/wbw-tr-patch.json");
const OUT_DIR = resolve(ROOT, "public/data");
const OUT_FILE = resolve(OUT_DIR, "quran-word-pool.json");

interface ArabicWord { pos: number; text: string; translit: string; }
interface VerseData { arabic: ArabicWord[]; turkish: string; }

interface PoolEntry {
  arabic: string;
  meaning: string;
  count: number;
}

function main() {
  console.log("Loading sources...");
  const verses = JSON.parse(readFileSync(ARABIC_WORDS, "utf-8")) as Record<string, VerseData>;
  const meanings = JSON.parse(readFileSync(WBW_PATCH, "utf-8")) as Record<string, string>;
  console.log(`  arabic-words.json: ${Object.keys(verses).length} verses`);
  console.log(`  wbw-tr-patch.json: ${Object.keys(meanings).length} meanings`);

  // Count frequency of each arabic form across all verses.
  const freq = new Map<string, number>();
  for (const v of Object.values(verses)) {
    for (const w of v.arabic) {
      freq.set(w.text, (freq.get(w.text) ?? 0) + 1);
    }
  }
  console.log(`  unique arabic forms: ${freq.size}`);

  // Join with translations, drop words without a meaning.
  const entries: PoolEntry[] = [];
  for (const [arabic, count] of freq) {
    const meaning = meanings[arabic];
    if (!meaning || !meaning.trim()) continue;
    entries.push({ arabic, meaning: meaning.trim(), count });
  }
  console.log(`  with turkish meaning: ${entries.length}`);

  entries.sort((a, b) => b.count - a.count);

  // Top 40% by frequency = normal pool, the rest = zor pool.
  const splitIdx = Math.ceil(entries.length * 0.4);
  const normalRaw = entries.slice(0, splitIdx);
  const zorRaw = entries.slice(splitIdx);

  const strip = ({ arabic, meaning }: PoolEntry) => ({ arabic, meaning });
  const normal = normalRaw.map(strip);
  const zor = zorRaw.map(strip);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: { normal: normal.length, zor: zor.length, total: entries.length },
    minOccurrenceNormal: normalRaw[normalRaw.length - 1]?.count ?? 0,
    maxOccurrenceZor: zorRaw[0]?.count ?? 0,
    normal,
    zor,
  };
  writeFileSync(OUT_FILE, JSON.stringify(payload));

  const sizeKb = Math.round(JSON.stringify(payload).length / 1024);
  console.log(`Wrote ${OUT_FILE} (${sizeKb} KB)`);
  console.log(`  normal: ${normal.length} (occurrences ≥ ${payload.minOccurrenceNormal})`);
  console.log(`  zor:    ${zor.length} (max occurrence ${payload.maxOccurrenceZor})`);
}

main();
