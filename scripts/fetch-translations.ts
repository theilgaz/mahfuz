/**
 * fetch-translations.ts
 *
 * One-time script to download Turkish Quran translations and convert
 * them to a unified JSON format for the Mahfuz app.
 *
 * Sources:
 * - Ali Fikri Yavuz: GitHub (alialparslan/Kuran-Meali-Ebook-Olusturucu)
 * - Ömer Nasuhi Bilmen: GitHub (alialparslan/Kuran-Meali-Ebook-Olusturucu)
 * - Ömer Çelik: kuranvemeali.com (scraping)
 *
 * Usage: npx tsx scripts/fetch-translations.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "translations");

// ── Types ──

interface GitHubTranslation {
  name: string;
  sures: {
    name: string;
    ayetler: [string, string, boolean][];
  }[];
}

interface UnifiedTranslation {
  id: string;
  name: string;
  verses: Record<string, string>;
}

// ── GitHub downloads ──

const GITHUB_BASE =
  "https://raw.githubusercontent.com/alialparslan/Kuran-Meali-Ebook-Olusturucu/master/JSON";

const GITHUB_TRANSLATIONS: { filename: string; id: string; name: string }[] = [
  { filename: "Ali Fikri Yavuz.json", id: "ali-fikri-yavuz", name: "Ali Fikri Yavuz" },
  { filename: "Ömer Nasuhi Bilmen.json", id: "omer-nasuhi-bilmen", name: "Ömer Nasuhi Bilmen" },
];

function convertGitHubFormat(raw: GitHubTranslation, id: string, name: string): UnifiedTranslation {
  const verses: Record<string, string> = {};
  for (let si = 0; si < raw.sures.length; si++) {
    const surah = raw.sures[si];
    for (const ayah of surah.ayetler) {
      const verseNum = ayah[0];
      const text = ayah[1];
      verses[`${si + 1}:${verseNum}`] = text;
    }
  }
  return { id, name, verses };
}

async function fetchGitHubTranslations(): Promise<UnifiedTranslation[]> {
  const results: UnifiedTranslation[] = [];
  for (const t of GITHUB_TRANSLATIONS) {
    const url = `${GITHUB_BASE}/${encodeURIComponent(t.filename)}`;
    console.log(`Downloading ${t.name} from GitHub...`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
    const raw: GitHubTranslation = await resp.json();
    const unified = convertGitHubFormat(raw, t.id, t.name);
    console.log(`  → ${Object.keys(unified.verses).length} verses`);
    results.push(unified);
  }
  return results;
}

// ── Ömer Çelik scraping ──

// Surah slug mapping for www.kuranvemeali.com URLs (extracted from site dropdown)
const SURAH_SLUGS = [
  "fatiha", "bakara", "aliimran", "nisa", "maide", "enam", "araf", "enfal",
  "tevbe", "yunus", "hud", "yusuf", "rad", "ibrahim", "hicr", "nahl", "isra",
  "kehf", "meryem", "taha", "enbiya", "hac", "muminun", "nur", "furkan",
  "suara", "neml", "kasas", "ankebut", "rum", "lokman", "secde", "ahzab",
  "sebe", "fatir", "yasin", "saffat", "sad", "zumer", "mumin", "fussilet",
  "sura", "zuhruf", "duhan", "casiye", "ahkaf", "muhammed", "fetih", "hucurat",
  "kaf", "zariyat", "tur", "necm", "kamer", "rahman", "vakia", "hadid",
  "mucadele", "hasr", "mumtehine", "saf", "cuma", "munafikun", "tegabun",
  "talak", "tahrim", "mulk", "kalem", "hakka", "mearic", "nuh", "cin",
  "muzzemmil", "muddessir", "kiyamet", "insan", "murselat", "nebe", "naziat",
  "abese", "tekvir", "infitar", "mutaffifin", "insikak", "buruc", "tarik",
  "ala", "gasiye", "fecr", "beled", "sems", "leyl", "duha", "insirah",
  "tin", "alak", "kadir", "beyyine", "zilzal", "adiyat", "karia", "tekasur",
  "asr", "humeze", "fil", "kureys", "maun", "kevser", "kafirun", "nasr",
  "tebbet", "ihlas", "felak", "nas",
];

async function scrapeOmerCelik(): Promise<UnifiedTranslation> {
  const verses: Record<string, string> = {};
  console.log("Scraping Ömer Çelik from www.kuranvemeali.com...");

  for (let surahIdx = 0; surahIdx < 114; surahIdx++) {
    const surahNum = surahIdx + 1;
    const slug = SURAH_SLUGS[surahIdx];
    const url = `https://www.kuranvemeali.com/${slug}-suresi/omer-celik-meal`;

    if (surahNum % 10 === 1 || surahNum === 114) {
      console.log(`  Surah ${surahNum}/114 (${slug})...`);
    }

    let html: string;
    let retries = 3;
    while (true) {
      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html",
          },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        html = await resp.text();
        break;
      } catch (err) {
        retries--;
        if (retries <= 0) throw new Error(`Failed to fetch surah ${surahNum} (${slug}): ${err}`);
        console.log(`  Retrying surah ${surahNum}...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Parse verses from HTML
    // Pattern: "Karşılaştır</a> {SurahName} {verseNum}: <b>{translation}</b>"
    const verseRegex = /Karşılaştır<\/a>[^<]*?(\d+):\s*<b>([\s\S]*?)<\/b>/gi;
    let match;
    while ((match = verseRegex.exec(html)) !== null) {
      const verseNum = match[1];
      const text = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      if (text) {
        verses[`${surahNum}:${verseNum}`] = text;
      }
    }

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`  → ${Object.keys(verses).length} verses scraped`);
  return { id: "omer-celik", name: "Ömer Çelik", verses };
}

// ── Main ──

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Fetch GitHub translations
  const githubTranslations = await fetchGitHubTranslations();

  // Scrape Ömer Çelik
  let omerCelik: UnifiedTranslation;
  try {
    omerCelik = await scrapeOmerCelik();
  } catch (err) {
    console.error("Ömer Çelik scraping failed:", err);
    console.log("Continuing with GitHub translations only...");
    omerCelik = { id: "omer-celik", name: "Ömer Çelik", verses: {} };
  }

  const allTranslations = [...githubTranslations, omerCelik];

  for (const t of allTranslations) {
    const outPath = join(OUTPUT_DIR, `${t.id}.json`);
    writeFileSync(outPath, JSON.stringify(t, null, 0));
    const count = Object.keys(t.verses).length;
    console.log(`Wrote ${outPath} (${count} verses)`);
    if (count < 6236) {
      console.warn(`  ⚠ Expected 6236 verses, got ${count}`);
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
