/**
 * Diyanet Kur'an Yolu tefsirini kuran.diyanet.gov.tr'den çeker.
 *
 * URL pattern: /tefsir/x/{globalAyahId}/{ayahInSurah}-ayet-tefsiri
 *   (slug ignore ediliyor, x yeterli)
 *
 * Parse: HTML'den .tefsir-text div'i çıkartılır, paragraf yapısı korunur.
 *
 * Çıktı: public/tafsir/diyanet/{surahId}.json
 *
 * Kullanım (apps/web/ dizininden):
 *   npx tsx scripts/fetch-tafsir-diyanet.ts            # tüm Kuran
 *   npx tsx scripts/fetch-tafsir-diyanet.ts 1 2 3      # sadece belirtilen sureler
 *   npx tsx scripts/fetch-tafsir-diyanet.ts --start=10 # 10'dan başla
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

const OUT_DIR = resolve(import.meta.dirname, "../public/tafsir/diyanet");
const BASE = "https://kuran.diyanet.gov.tr/tefsir/x-suresi";
const DELAY_MS = 500;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

interface AyahRow {
  id: number;
  surahId: number;
  ayahNumber: number;
}

interface TafsirEntry {
  textHtml: string;
  textPlain: string;
  groupKey?: string;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, c) => String.fromCharCode(Number(c)));
}

function stripTags(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Extract content between opening tag (matching className) and its closing tag, handling nested divs. */
function extractByClass(html: string, className: string): string | null {
  const openRe = new RegExp(
    `<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`,
    "i",
  );
  const m = openRe.exec(html);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.substring(start, nextClose);
      }
      i = nextClose + 6;
    }
  }
  return null;
}

/** Keep paragraph structure: <p>, <br> → preserved as HTML, strip other tags. */
function normaliseHtml(raw: string): string {
  return raw
    // remove script/style blocks entirely
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    // strip inline classes/styles/data-* on remaining tags
    .replace(/<(p|br|em|strong|i|b)\b[^>]*>/gi, (_m, tag) =>
      tag.toLowerCase() === "br" ? "<br>" : `<${tag.toLowerCase()}>`,
    )
    // drop other tags
    .replace(/<(?!\/?(p|br|em|strong|i|b)\b)[^>]+>/gi, "")
    // collapse whitespace inside text
    .replace(/[ \t]+/g, " ")
    .replace(/\s*<p>\s*/gi, "<p>")
    .replace(/\s*<\/p>\s*/gi, "</p>")
    .trim();
}

async function fetchAyah(globalId: number, ayahInSurah: number): Promise<TafsirEntry | null> {
  const url = `${BASE}/${globalId}/${ayahInSurah}-ayet-tefsiri`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const raw = extractByClass(html, "tefsir-text");
  if (!raw) return null;

  const textHtml = normaliseHtml(raw);
  const textPlain = stripTags(raw);
  if (textPlain.length < 20) return null; // boş/çok kısa tefsir → atla

  return { textHtml, textPlain };
}

function parseArgs(): { surahs: number[] | null; start: number } {
  const args = process.argv.slice(2);
  let start = 1;
  const surahs: number[] = [];
  for (const a of args) {
    if (a.startsWith("--start=")) start = Number(a.slice(8));
    else if (/^\d+$/.test(a)) surahs.push(Number(a));
  }
  return { surahs: surahs.length ? surahs : null, start };
}

async function main() {
  const { surahs, start } = parseArgs();
  mkdirSync(OUT_DIR, { recursive: true });

  // DB'den ayet listesini al
  const dbUrl = process.env.TURSO_DATABASE_URL || "file:./local.db";
  const db = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  const result = await db.execute(
    "SELECT id, surah_id as surahId, ayah_number as ayahNumber FROM ayahs ORDER BY id",
  );
  const allAyahs = result.rows as unknown as AyahRow[];
  console.log(`DB'den ${allAyahs.length} ayet okundu`);

  // Filtre uygula
  const targetSurahs = surahs ?? Array.from({ length: 114 }, (_, i) => i + 1);
  const filtered = targetSurahs.filter((s) => s >= start);

  let totalFetched = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const surahId of filtered) {
    const verses = allAyahs.filter((a) => a.surahId === surahId);
    if (verses.length === 0) {
      console.log(`  Sure ${surahId}: ayet bulunamadı, atlandı`);
      continue;
    }

    const outFile = resolve(OUT_DIR, `${surahId}.json`);
    const existing: Record<string, TafsirEntry> = existsSync(outFile)
      ? JSON.parse(readFileSync(outFile, "utf-8"))
      : {};

    let surahFetched = 0;
    let surahSkipped = 0;
    let surahFailed = 0;

    for (const ayah of verses) {
      const key = `${ayah.surahId}:${ayah.ayahNumber}`;
      if (existing[key]) {
        surahSkipped++;
        continue;
      }

      try {
        const entry = await fetchAyah(ayah.id, ayah.ayahNumber);
        if (entry) {
          existing[key] = entry;
          surahFetched++;
        } else {
          surahSkipped++;
        }
      } catch (err) {
        console.error(`  ✗ ${key}: ${(err as Error).message}`);
        surahFailed++;
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    writeFileSync(outFile, JSON.stringify(existing, null, 2));
    const sizeKb = Math.round(JSON.stringify(existing).length / 1024);
    console.log(
      `Sure ${surahId.toString().padStart(3, " ")} | yeni: ${surahFetched.toString().padStart(3, " ")} | atlanan: ${surahSkipped.toString().padStart(3, " ")} | hata: ${surahFailed.toString().padStart(2, " ")} | ${sizeKb}KB → ${outFile.split("/").slice(-2).join("/")}`,
    );

    totalFetched += surahFetched;
    totalSkipped += surahSkipped;
    totalFailed += surahFailed;
  }

  console.log(
    `\nToplam: yeni ${totalFetched}, atlanan ${totalSkipped}, hata ${totalFailed}`,
  );
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
