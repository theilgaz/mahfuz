/**
 * Yuksek cozunurluklu mushaf sayfalarini kaynak PDF'ten cikarir.
 *
 * Kaynak PDF: 617 sayfa, 480x695pt, mushaf p1 = PDF p7 (offset +6)
 * Cikti:      public/mushaf-pages/{N}.webp (~2570x3770, q=92)
 *
 * Akis:
 *   1. pdftoppm -r 400 ile PDF sayfa 7..610 -> /tmp/mushaf-pdf-png/
 *   2. cwebp q=92 ile her PNG -> public/mushaf-pages/{N}.webp (mushaf page no)
 *   3. Tmp PNG'leri sil
 *
 * Onkoşul:
 *   - poppler kurulu (brew install poppler) -> pdftoppm
 *   - cwebp PATH'te (brew install webp)
 *
 * Kullanim:
 *   npx tsx scripts/extract-mushaf-from-pdf.ts <pdf-path>
 *   npx tsx scripts/extract-mushaf-from-pdf.ts <pdf-path> 1 20    # mushaf 1-20
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, readdirSync, statSync, rmSync, renameSync } from "node:fs";
import { resolve, join } from "node:path";

const SRC_DIR = resolve("public/mushaf-pages");
const TMP_PNG_DIR = "/tmp/mushaf-pdf-png";
const DPI = 400;
const WEBP_QUALITY = 92;
const PDF_PAGE_OFFSET = 6; // mushaf p1 = PDF p7
const TOTAL_PAGES = 604;

function run(cmd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { code: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

async function main() {
  const args = process.argv.slice(2);
  const pdfPath = args[0];
  if (!pdfPath || !existsSync(pdfPath)) {
    console.error("Kullanim: npx tsx scripts/extract-mushaf-from-pdf.ts <pdf-path> [start] [end]");
    process.exit(1);
  }
  const startMushaf = args[1] ? parseInt(args[1], 10) : 1;
  const endMushaf = args[2] ? parseInt(args[2], 10) : TOTAL_PAGES;
  const startPdf = startMushaf + PDF_PAGE_OFFSET;
  const endPdf = endMushaf + PDF_PAGE_OFFSET;

  // Onkoşul kontrolu
  if (run("pdftoppm", ["-v"]).code > 1) {
    console.error("pdftoppm bulunamadi. Kurulum: brew install poppler");
    process.exit(1);
  }
  if (run("cwebp", ["-version"]).code !== 0) {
    console.error("cwebp bulunamadi. Kurulum: brew install webp");
    process.exit(1);
  }

  mkdirSync(SRC_DIR, { recursive: true });
  if (existsSync(TMP_PNG_DIR)) rmSync(TMP_PNG_DIR, { recursive: true, force: true });
  mkdirSync(TMP_PNG_DIR, { recursive: true });

  console.log(`PDF -> PNG (${DPI} DPI, mushaf ${startMushaf}-${endMushaf})...`);
  const t0 = Date.now();
  const ext = spawnSync(
    "pdftoppm",
    [
      "-r", String(DPI),
      "-f", String(startPdf),
      "-l", String(endPdf),
      "-png",
      pdfPath,
      join(TMP_PNG_DIR, "p"),
    ],
    { stdio: "inherit" },
  );
  if (ext.status !== 0) {
    console.error(`pdftoppm basarisiz, code=${ext.status}`);
    process.exit(1);
  }
  const extractSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`PDF extract tamamlandi: ${extractSec}s`);

  // PNG dosya isimleri: p-007.png, p-008.png, ... pdftoppm zero-pad genisligi PDF buyuklugune gore
  console.log(`PNG -> WebP (q=${WEBP_QUALITY})...`);
  const pngFiles = readdirSync(TMP_PNG_DIR).filter((f) => f.startsWith("p-") && f.endsWith(".png"));
  let encoded = 0;
  let failed = 0;

  for (const png of pngFiles) {
    const m = png.match(/^p-(\d+)\.png$/);
    if (!m) continue;
    const pdfPageNum = parseInt(m[1], 10);
    const mushafPageNum = pdfPageNum - PDF_PAGE_OFFSET;
    if (mushafPageNum < 1 || mushafPageNum > TOTAL_PAGES) continue;

    const inPath = join(TMP_PNG_DIR, png);
    const outPath = join(SRC_DIR, `${mushafPageNum}.webp`);
    const r = run("cwebp", ["-q", String(WEBP_QUALITY), "-quiet", inPath, "-o", outPath]);
    if (r.code !== 0) {
      console.error(`  x mushaf ${mushafPageNum} -- cwebp basarisiz: ${r.stderr.trim().slice(0, 200)}`);
      failed++;
      continue;
    }
    encoded++;
    if (encoded % 50 === 0 || encoded === pngFiles.length) {
      const size = statSync(outPath).size;
      console.log(`  + ${encoded}/${pngFiles.length} (mushaf ${mushafPageNum}: ${Math.round(size / 1024)}KB)`);
    }
  }

  rmSync(TMP_PNG_DIR, { recursive: true, force: true });
  console.log(`\nTamamlandi! ${encoded} basarili, ${failed} hatali.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
