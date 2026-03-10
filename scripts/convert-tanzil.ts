/**
 * convert-tanzil.ts
 *
 * Converts Tanzil.net XML files into per-surah JSON + meta.json
 * for static Quran text serving.
 *
 * Source: Tanzil Quran Text (CC-BY 3.0) — https://tanzil.net
 *
 * Outputs to apps/web/public/quran/:
 *   meta.json              — chapter metadata + juz/page/hizb boundaries
 *   uthmani/{1..114}.json  — per-surah Uthmani text with per-verse metadata
 *   simple/{1..114}.json   — per-surah Simple text with per-verse metadata
 *
 * Usage: npx tsx scripts/convert-tanzil.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = join(__dirname, "tanzil-source");
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "quran");

// ---------- XML Parsing Helpers ----------

function parseAttr(tag: string, attr: string): string {
  const re = new RegExp(`${attr}="([^"]*)"`, "i");
  const m = tag.match(re);
  return m ? m[1] : "";
}

function parseIntAttr(tag: string, attr: string): number {
  return parseInt(parseAttr(tag, attr), 10) || 0;
}

// ---------- Parse quran-data.xml ----------

interface SuraMeta {
  index: number;
  ayas: number;
  start: number; // cumulative verse offset (0-based)
  name: string; // Arabic name
  tname: string; // Transliterated name
  ename: string; // English name
  type: string; // Meccan / Medinan
  order: number; // Revelation order
  rukus: number;
}

interface BoundaryEntry {
  index: number;
  sura: number;
  aya: number;
}

function parseQuranData(xml: string) {
  // Parse sura metadata
  const suras: SuraMeta[] = [];
  const suraRe = /<sura\s+([^/]+)\/>/g;
  let m: RegExpExecArray | null;
  // Only match suras inside the <suras> section (they have `ayas` attr)
  while ((m = suraRe.exec(xml)) !== null) {
    const tag = m[1];
    if (!tag.includes("ayas=")) continue;
    suras.push({
      index: parseIntAttr(tag, "index"),
      ayas: parseIntAttr(tag, "ayas"),
      start: parseIntAttr(tag, "start"),
      name: parseAttr(tag, 'name'),
      tname: parseAttr(tag, "tname"),
      ename: parseAttr(tag, "ename"),
      type: parseAttr(tag, "type"),
      order: parseIntAttr(tag, "order"),
      rukus: parseIntAttr(tag, "rukus"),
    });
  }

  // Parse juz boundaries
  const juzs: BoundaryEntry[] = [];
  const juzRe = /<juz\s+([^/]+)\/>/g;
  while ((m = juzRe.exec(xml)) !== null) {
    juzs.push({
      index: parseIntAttr(m[1], "index"),
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
    });
  }

  // Parse hizb quarter boundaries
  const quarters: BoundaryEntry[] = [];
  const quarterRe = /<quarter\s+([^/]+)\/>/g;
  while ((m = quarterRe.exec(xml)) !== null) {
    quarters.push({
      index: parseIntAttr(m[1], "index"),
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
    });
  }

  // Parse page boundaries
  const pages: BoundaryEntry[] = [];
  const pageRe = /<page\s+([^/]+)\/>/g;
  while ((m = pageRe.exec(xml)) !== null) {
    pages.push({
      index: parseIntAttr(m[1], "index"),
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
    });
  }

  // Parse manzil boundaries
  const manzils: BoundaryEntry[] = [];
  const manzilRe = /<manzil\s+([^/]+)\/>/g;
  while ((m = manzilRe.exec(xml)) !== null) {
    manzils.push({
      index: parseIntAttr(m[1], "index"),
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
    });
  }

  // Parse ruku boundaries
  const rukuList: BoundaryEntry[] = [];
  const rukuRe = /<ruku\s+([^/]+)\/>/g;
  while ((m = rukuRe.exec(xml)) !== null) {
    rukuList.push({
      index: parseIntAttr(m[1], "index"),
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
    });
  }

  // Parse sajda info
  const sajdas: { sura: number; aya: number; type: string }[] = [];
  const sajdaRe = /<sajda\s+([^/]+)\/>/g;
  while ((m = sajdaRe.exec(xml)) !== null) {
    sajdas.push({
      sura: parseIntAttr(m[1], "sura"),
      aya: parseIntAttr(m[1], "aya"),
      type: parseAttr(m[1], "type"),
    });
  }

  return { suras, juzs, quarters, pages, manzils, rukuList, sajdas };
}

// ---------- Parse Quran text XML ----------

interface ParsedSura {
  index: number;
  name: string;
  bismillah?: string;
  ayas: { index: number; text: string }[];
}

function parseQuranText(xml: string): ParsedSura[] {
  const suras: ParsedSura[] = [];
  // Match each <sura ...>...</sura> block
  const suraBlockRe = /<sura\s+([^>]+)>([\s\S]*?)<\/sura>/g;
  let m: RegExpExecArray | null;
  while ((m = suraBlockRe.exec(xml)) !== null) {
    const suraAttrs = m[1];
    const suraBody = m[2];
    const suraIndex = parseIntAttr(suraAttrs, "index");
    const suraName = parseAttr(suraAttrs, "name");

    const ayas: { index: number; text: string }[] = [];
    let bismillah: string | undefined;

    const ayaRe = /<aya\s+([^/]+)\/>/g;
    let am: RegExpExecArray | null;
    while ((am = ayaRe.exec(suraBody)) !== null) {
      const ayaAttrs = am[1];
      const ayaIndex = parseIntAttr(ayaAttrs, "index");
      const text = parseAttr(ayaAttrs, "text");
      ayas.push({ index: ayaIndex, text });

      // Bismillah attr is on the first aya of surahs 2-114 (except 9)
      if (ayaIndex === 1 && !bismillah) {
        const bism = parseAttr(ayaAttrs, "bismillah");
        if (bism) bismillah = bism;
      }
    }

    suras.push({ index: suraIndex, name: suraName, bismillah, ayas });
  }
  return suras;
}

// ---------- Build per-verse metadata lookup ----------

function buildVerseMeta(data: ReturnType<typeof parseQuranData>) {
  // Create lookup: "sura:aya" → { page, juz, hizb, ruku, manzil, sajdah }
  const meta: Map<
    string,
    { p: number; j: number; h: number; rk: number; m: number; sj: number }
  > = new Map();

  // Build sorted boundary arrays for binary-search assignment
  // For each verse, find which boundary it falls under

  // First, build all verses list
  for (const sura of data.suras) {
    for (let aya = 1; aya <= sura.ayas; aya++) {
      const key = `${sura.index}:${aya}`;
      meta.set(key, { p: 0, j: 0, h: 0, rk: 0, m: 0, sj: 0 });
    }
  }

  // Helper: compare two sura:aya positions
  const compare = (s1: number, a1: number, s2: number, a2: number) => {
    if (s1 !== s2) return s1 - s2;
    return a1 - a2;
  };

  // Assign boundaries using the sorted boundary entries
  // For each verse, find the highest boundary index where boundary <= verse
  function assignBoundary(
    boundaries: BoundaryEntry[],
    field: "p" | "j" | "h" | "rk" | "m"
  ) {
    let bi = 0;
    for (const sura of data.suras) {
      for (let aya = 1; aya <= sura.ayas; aya++) {
        // Advance boundary pointer
        while (
          bi + 1 < boundaries.length &&
          compare(
            boundaries[bi + 1].sura,
            boundaries[bi + 1].aya,
            sura.index,
            aya
          ) <= 0
        ) {
          bi++;
        }
        const m = meta.get(`${sura.index}:${aya}`)!;
        m[field] = boundaries[bi].index;
      }
    }
  }

  assignBoundary(data.pages, "p");
  assignBoundary(data.juzs, "j");
  assignBoundary(data.quarters, "h");
  assignBoundary(data.rukuList, "rk");
  assignBoundary(data.manzils, "m");

  // Sajdas
  for (const s of data.sajdas) {
    const m = meta.get(`${s.sura}:${s.aya}`);
    if (m) m.sj = s.type === "obligatory" ? 2 : 1;
  }

  return meta;
}

// ---------- Build meta.json ----------

interface StaticChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_translation: string;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  verses_count: number;
  pages: [number, number];
}

function buildMetaJson(
  data: ReturnType<typeof parseQuranData>,
  verseMeta: Map<string, { p: number; j: number; h: number; rk: number; m: number; sj: number }>
) {
  const chapters: StaticChapter[] = data.suras.map((s) => {
    // Find page range for this surah
    const firstPage = verseMeta.get(`${s.index}:1`)?.p ?? 1;
    const lastPage = verseMeta.get(`${s.index}:${s.ayas}`)?.p ?? firstPage;

    return {
      id: s.index,
      name_arabic: s.name,
      name_simple: s.tname,
      name_translation: s.ename,
      revelation_place: s.type === "Meccan" ? "makkah" : "madinah",
      revelation_order: s.order,
      bismillah_pre: s.index !== 1 && s.index !== 9, // All except Fatiha (part of text) & Tawba
      verses_count: s.ayas,
      pages: [firstPage, lastPage],
    };
  });

  // pageToSurahs: which surahs appear on each page
  const pageToSurahs: Record<number, number[]> = {};
  for (const sura of data.suras) {
    for (let aya = 1; aya <= sura.ayas; aya++) {
      const page = verseMeta.get(`${sura.index}:${aya}`)?.p ?? 1;
      if (!pageToSurahs[page]) pageToSurahs[page] = [];
      if (!pageToSurahs[page].includes(sura.index)) {
        pageToSurahs[page].push(sura.index);
      }
    }
  }

  // juzBoundaries
  const juzBoundaries: Record<number, { start: string; end: string }> = {};
  for (let ji = 0; ji < data.juzs.length; ji++) {
    const juz = data.juzs[ji];
    const startKey = `${juz.sura}:${juz.aya}`;

    // End is right before the next juz starts (or last verse of Quran)
    let endKey: string;
    if (ji + 1 < data.juzs.length) {
      const nextJuz = data.juzs[ji + 1];
      // Go backwards from next juz start
      if (nextJuz.aya === 1) {
        // End is last verse of previous surah
        const prevSura = data.suras[nextJuz.sura - 2]; // 0-indexed
        endKey = `${prevSura.index}:${prevSura.ayas}`;
      } else {
        endKey = `${nextJuz.sura}:${nextJuz.aya - 1}`;
      }
    } else {
      endKey = "114:6"; // Last verse of the Quran
    }

    juzBoundaries[juz.index] = { start: startKey, end: endKey };
  }

  return { chapters, pageToSurahs, juzBoundaries };
}

// ---------- Build per-surah JSON ----------

interface VerseEntry {
  v: number;
  t: string;
  p: number;
  j: number;
  h: number;
  rk: number;
  m: number;
  sj?: number; // only present if sajdah verse
}

interface SurahJson {
  bismillah?: string;
  verses: VerseEntry[];
}

function buildSurahJson(
  parsedSura: ParsedSura,
  verseMeta: Map<string, { p: number; j: number; h: number; rk: number; m: number; sj: number }>
): SurahJson {
  const verses: VerseEntry[] = parsedSura.ayas.map((aya) => {
    const vm = verseMeta.get(`${parsedSura.index}:${aya.index}`)!;
    const entry: VerseEntry = {
      v: aya.index,
      t: aya.text,
      p: vm.p,
      j: vm.j,
      h: vm.h,
      rk: vm.rk,
      m: vm.m,
    };
    if (vm.sj > 0) entry.sj = vm.sj;
    return entry;
  });

  const result: SurahJson = { verses };
  if (parsedSura.bismillah) {
    result.bismillah = parsedSura.bismillah;
  }
  return result;
}

// ---------- Main ----------

function main() {
  console.log("Reading Tanzil XML files...");
  const dataXml = readFileSync(join(SOURCE_DIR, "quran-data.xml"), "utf-8");
  const uthmaniXml = readFileSync(join(SOURCE_DIR, "quran-uthmani.xml"), "utf-8");
  const simpleXml = readFileSync(join(SOURCE_DIR, "quran-simple.xml"), "utf-8");

  console.log("Parsing quran-data.xml...");
  const data = parseQuranData(dataXml);
  console.log(`  ${data.suras.length} suras, ${data.juzs.length} juzs, ${data.pages.length} pages, ${data.quarters.length} quarters, ${data.rukuList.length} rukus, ${data.sajdas.length} sajdas`);

  console.log("Building per-verse metadata...");
  const verseMeta = buildVerseMeta(data);
  console.log(`  ${verseMeta.size} verse entries`);

  console.log("Parsing Uthmani text...");
  const uthmaniSuras = parseQuranText(uthmaniXml);
  console.log(`  ${uthmaniSuras.length} suras`);

  console.log("Parsing Simple text...");
  const simpleSuras = parseQuranText(simpleXml);
  console.log(`  ${simpleSuras.length} suras`);

  // Verify counts
  if (uthmaniSuras.length !== 114) throw new Error(`Expected 114 suras in Uthmani, got ${uthmaniSuras.length}`);
  if (simpleSuras.length !== 114) throw new Error(`Expected 114 suras in Simple, got ${simpleSuras.length}`);

  let totalUthmaniVerses = 0;
  let totalSimpleVerses = 0;
  for (const s of uthmaniSuras) totalUthmaniVerses += s.ayas.length;
  for (const s of simpleSuras) totalSimpleVerses += s.ayas.length;
  console.log(`  Total verses: Uthmani=${totalUthmaniVerses}, Simple=${totalSimpleVerses}`);

  // Create output directories
  mkdirSync(join(OUTPUT_DIR, "uthmani"), { recursive: true });
  mkdirSync(join(OUTPUT_DIR, "simple"), { recursive: true });

  // Write per-surah JSON files
  console.log("Writing per-surah JSON files...");
  let totalSize = 0;

  for (const sura of uthmaniSuras) {
    const json = buildSurahJson(sura, verseMeta);
    const content = JSON.stringify(json);
    const path = join(OUTPUT_DIR, "uthmani", `${sura.index}.json`);
    writeFileSync(path, content);
    totalSize += content.length;
  }

  for (const sura of simpleSuras) {
    const json = buildSurahJson(sura, verseMeta);
    const content = JSON.stringify(json);
    const path = join(OUTPUT_DIR, "simple", `${sura.index}.json`);
    writeFileSync(path, content);
    totalSize += content.length;
  }

  console.log(`  228 surah files written (${(totalSize / 1024).toFixed(0)} KB total)`);

  // Write meta.json
  console.log("Building meta.json...");
  const metaJson = buildMetaJson(data, verseMeta);
  const metaContent = JSON.stringify(metaJson);
  writeFileSync(join(OUTPUT_DIR, "meta.json"), metaContent);
  console.log(`  meta.json written (${(metaContent.length / 1024).toFixed(1)} KB)`);

  // Verification
  console.log("\nVerification:");
  console.log(`  Chapters: ${metaJson.chapters.length}`);
  console.log(`  Pages mapped: ${Object.keys(metaJson.pageToSurahs).length}`);
  console.log(`  Juz boundaries: ${Object.keys(metaJson.juzBoundaries).length}`);
  console.log(`  Fatiha page: ${metaJson.chapters[0].pages[0]}-${metaJson.chapters[0].pages[1]}`);
  console.log(`  Baqara page: ${metaJson.chapters[1].pages[0]}-${metaJson.chapters[1].pages[1]}`);
  console.log(`  Nas page: ${metaJson.chapters[113].pages[0]}-${metaJson.chapters[113].pages[1]}`);

  // Check a few verses
  const baqara1 = verseMeta.get("2:1");
  console.log(`  2:1 → page=${baqara1?.p}, juz=${baqara1?.j}, hizb=${baqara1?.h}`);
  const baqara255 = verseMeta.get("2:255");
  console.log(`  2:255 → page=${baqara255?.p}, juz=${baqara255?.j}`);

  console.log("\nDone!");
}

main();
