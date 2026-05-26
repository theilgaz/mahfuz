/**
 * Tefhimü'l-Kur'an (Mevdudi) Türkçe tefsirini kuranmeali.com'dan çeker.
 *
 * URL: https://www.kuranmeali.com/Tefsir.php?sureno={S}&ayet={A}
 *
 * Yapı: <hr>'den sonra tefsir gövdesi başlar, </div> ile biter.
 *   Bundle ipucu: meal kısmındaki <font color=red>X</font>-<font color=red>Y</font> ayet aralığı.
 *
 * Çıktı: public/tafsir/tefhim/{surahId}.json
 *
 * Kullanım (apps/web/ dizininden):
 *   npx tsx scripts/fetch-tafsir-tefhim.ts            # tüm Kuran
 *   npx tsx scripts/fetch-tafsir-tefhim.ts 1 2 3      # belirli sureler
 *   npx tsx scripts/fetch-tafsir-tefhim.ts --start=10
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

const OUT_DIR = resolve(import.meta.dirname, "../public/tafsir/tefhim");
const BASE = "https://www.kuranmeali.com/Tefsir.php";
const DELAY_MS = 400;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

interface AyahRow {
  surahId: number;
  ayahNumber: number;
}

interface TafsirEntry {
  textHtml: string;
  textPlain: string;
  groupKey?: string; // ör. "1-3" — bu ayetin tefsiri 1-3 aralığına ait
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

/** Sayfanın meal kısmındaki <font color=red>X</font>-<font color=red>Y</font> aralığı, varsa. */
function detectGroupKey(html: string, ayahNumber: number): string | undefined {
  // meal alanı <p align=left>...</p> içinde, başında "<font color=red>X</font>-<font color=red>Y</font>"
  const mealMatch = /<p align=left>([\s\S]*?)<\/p>/i.exec(html);
  if (!mealMatch) return undefined;
  const meal = mealMatch[1];
  // İlk "X-Y" deseni
  const rangeRe = /^\s*(?:<font[^>]*>\s*(\d+)\s*<\/font>\s*)+-\s*(?:<font[^>]*>\s*(\d+)\s*<\/font>\s*)+/;
  const m = rangeRe.exec(meal);
  if (m) {
    // <font color=red>1</font><font color=red>0</font> şeklinde rakam rakam ayrılmış olabilir
    // Toparlayalım: ardışık <font>...</font>'ları birleştir
    const cleaned = meal.replace(/<font[^>]*>\s*(\d)\s*<\/font>/g, "$1");
    const m2 = /^\s*(\d+)\s*-\s*(\d+)/.exec(cleaned);
    if (m2) {
      const start = Number(m2[1]);
      const end = Number(m2[2]);
      if (start <= ayahNumber && ayahNumber <= end && start < end) {
        return `${start}-${end}`;
      }
    }
  }
  return undefined;
}

/** <hr>'den sonra ve son </div> öncesi gövdeyi al. */
function extractBody(html: string): string | null {
  const hrIdx = html.indexOf("<hr>");
  if (hrIdx === -1) return null;
  const after = html.substring(hrIdx + 4);
  // Gövdenin sonu: ilk </div> veya "<a href=\"javascript:window.close" öncesi
  let endIdx = after.indexOf("</div>");
  if (endIdx === -1) endIdx = after.length;
  const body = after.substring(0, endIdx);
  return body;
}

function normaliseHtml(raw: string): string {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    // <font color=red>X</font> dipnot numaraları → <strong>X</strong>
    .replace(/<font[^>]*color=["']?red["']?[^>]*>([^<]*)<\/font>/gi, "<strong>$1</strong>")
    .replace(/<font[^>]*>([^<]*)<\/font>/gi, "$1")
    // p tag normalize
    .replace(/<p\b[^>]*>/gi, "<p>")
    // br normalize
    .replace(/<br\s*\/?\s*>/gi, "<br>")
    // izin verilenler dışındakileri at
    .replace(/<(?!\/?(p|br|em|strong|i|b)\b)[^>]+>/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/\s*<p>\s*/gi, "<p>")
    .replace(/\s*<\/p>\s*/gi, "</p>")
    .trim();
}

async function fetchAyah(surahId: number, ayahNumber: number): Promise<TafsirEntry | null> {
  const url = `${BASE}?sureno=${surahId}&ayet=${ayahNumber}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const body = extractBody(html);
  if (!body) return null;

  const textPlain = stripTags(body);
  // Minimum anlamlı tefsir: 40 char+
  if (textPlain.length < 40) return null;

  const textHtml = normaliseHtml(body);
  const groupKey = detectGroupKey(html, ayahNumber);

  return groupKey ? { textHtml, textPlain, groupKey } : { textHtml, textPlain };
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

  const dbUrl = process.env.TURSO_DATABASE_URL || "file:./local.db";
  const db = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  const result = await db.execute(
    "SELECT surah_id as surahId, ayah_number as ayahNumber FROM ayahs ORDER BY id",
  );
  const allAyahs = result.rows as unknown as AyahRow[];
  console.log(`DB'den ${allAyahs.length} ayet okundu`);

  const targetSurahs = surahs ?? Array.from({ length: 114 }, (_, i) => i + 1);
  const filtered = targetSurahs.filter((s) => s >= start);

  let totalFetched = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const surahId of filtered) {
    const verses = allAyahs.filter((a) => a.surahId === surahId);
    if (verses.length === 0) continue;

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
        const entry = await fetchAyah(ayah.surahId, ayah.ayahNumber);
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
      `Sure ${surahId.toString().padStart(3, " ")} | yeni: ${surahFetched.toString().padStart(3, " ")} | atlanan: ${surahSkipped.toString().padStart(3, " ")} | hata: ${surahFailed.toString().padStart(2, " ")} | ${sizeKb}KB → tefhim/${surahId}.json`,
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
