/**
 * Quran.com API'den eksik dillerin meallerini çeker.
 *
 * AR: Al-Muyassar (King Fahd Quran Complex)
 * DE: Bubenheim & Elyas
 * EN: Pickthall (ek seçenek)
 *
 * Usage: npx tsx scripts/fetch-extra-translations.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(import.meta.dirname, "../public/translations");

const API_BASE = "https://api.quran.com/api/v4";
const DELAY_MS = 300;

interface QuranComVerse {
  verse_key: string; // "1:1"
  text: string;
}

interface TranslationToFetch {
  /** Quran.com resource_id */
  resourceId: number;
  slug: string;
  name: string;
}

const TRANSLATIONS: TranslationToFetch[] = [
  { resourceId: 78, slug: "muyassar-ar", name: "Al-Muyassar" },
  { resourceId: 27, slug: "bubenheim-de", name: "Bubenheim & Elyas" },
  { resourceId: 19, slug: "pickthall-en", name: "Pickthall" },
];

async function fetchTranslation(t: TranslationToFetch) {
  console.log(`\nFetching ${t.name} (resource ${t.resourceId})...`);

  const verses: Record<string, string> = {};
  const PER_PAGE = 50;

  // API paginates — iterate through all pages
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/quran/translations/${t.resourceId}?fields=verse_key&per_page=${PER_PAGE}&page=${page}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);

    const data = await resp.json();

    if (page === 1) {
      totalPages = data.pagination?.total_pages || Math.ceil((data.pagination?.total_records || 6236) / PER_PAGE);
      console.log(`  Total pages: ${totalPages}`);
    }

    for (const item of data.translations) {
      const key = item.verse_key;
      // Strip HTML tags from translation text
      const text = (item.text as string)
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
      verses[key] = text;
    }

    if (page % 10 === 0 || page === totalPages) {
      console.log(`  Page ${page}/${totalPages} — ${Object.keys(verses).length} verses so far`);
    }

    page++;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`  ✓ ${Object.keys(verses).length} verses fetched`);

  const output = { id: t.slug, name: t.name, verses };
  const outPath = resolve(OUT_DIR, `${t.slug}.json`);
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`  Wrote ${outPath}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const t of TRANSLATIONS) {
    await fetchTranslation(t);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
