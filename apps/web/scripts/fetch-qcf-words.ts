/**
 * quran.com API'den sayfa bazli QCF V2 glif kodlarini ceker → public/qcf-words/{page}.json
 *
 * Format: { lines: [{ words: [{ g: "glyph_code_v2", c: "w"|"e"|"p", vk: "1:1", p: 1 }] }] }
 *   - g = code_v2 (QCF V2 font glifi)
 *   - c = char_type (word/end/pause)
 *   - vk = verse_key (surahId:ayahNumber)
 *   - p = position (kelime pozisyonu, 1-indexed)
 *
 * Kullanim: npx tsx scripts/fetch-qcf-words.ts
 *           npx tsx scripts/fetch-qcf-words.ts 1 20   # sayfa 1-20 arasi
 */

const API_BASE = "https://api.quran.com/api/v4/verses/by_page";
const OUT_DIR = "public/qcf-words";
const DELAY_MS = 350;
const TOTAL_PAGES = 604;

interface QcfWord {
  /** QCF V2 glyph code */
  g: string;
  /** char_type: w=word, e=end, p=pause */
  c: "w" | "e" | "p";
  /** verse key: "surahId:ayahNumber" */
  vk: string;
  /** word position in verse (1-indexed) */
  p: number;
}

interface QcfPageData {
  lines: { words: QcfWord[] }[];
}

function charTypeShort(ct: string): "w" | "e" | "p" {
  if (ct === "end") return "e";
  if (ct === "pause") return "p";
  return "w";
}

async function fetchPage(page: number): Promise<QcfPageData> {
  const lines: Map<number, QcfWord[]> = new Map();
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const url = `${API_BASE}/${page}?words=true&word_fields=code_v2,v2_page&per_page=50&page=${currentPage}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page}`);
    const data = await res.json();
    totalPages = data.pagination.total_pages;

    for (const verse of data.verses) {
      for (const w of verse.words) {
        const ln = w.line_number as number;
        if (!lines.has(ln)) lines.set(ln, []);
        lines.get(ln)!.push({
          g: w.code_v2 ?? "",
          c: charTypeShort(w.char_type_name),
          vk: verse.verse_key,
          p: w.position,
        });
      }
    }
    currentPage++;
  }

  // Satir numarasina gore sirala
  const sorted = [...lines.entries()].sort((a, b) => a[0] - b[0]);
  return { lines: sorted.map(([, words]) => ({ words })) };
}

async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const args = process.argv.slice(2);
  const startPage = args[0] ? parseInt(args[0], 10) : 1;
  const endPage = args[1] ? parseInt(args[1], 10) : TOTAL_PAGES;

  const outDir = path.resolve(OUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`QCF V2 glif verisi cekiliyor (sayfa ${startPage}-${endPage})...\n`);

  let success = 0;
  let fail = 0;

  for (let page = startPage; page <= endPage; page++) {
    try {
      const data = await fetchPage(page);
      const outPath = path.join(outDir, `${page}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data));
      const totalWords = data.lines.reduce((s, l) => s + l.words.length, 0);
      console.log(`  + Sayfa ${page} -- ${data.lines.length} satir, ${totalWords} kelime`);
      success++;
    } catch (err) {
      console.error(`  x Sayfa ${page} -- ${err}`);
      fail++;
    }

    if (page < endPage) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nTamamlandi! ${success} basarili, ${fail} hatali.`);
}

main();

export {};
