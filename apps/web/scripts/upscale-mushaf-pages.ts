/**
 * Mushaf sayfa scan'lerini Real-ESRGAN ile 2x upscale eder.
 *
 * Kaynak: public/mushaf-pages/{N}.webp (~1500x2150, lossy)
 * Cikti:  public/mushaf-pages/{N}.webp (~3000x4300, q=92)
 * Yedek:  public/mushaf-pages-1x/{N}.webp (orijinal 1x kopyalari)
 *
 * Akis:
 *   1. mushaf-pages-1x/ yedek varsa kullan, yoksa olustur
 *   2. realesrgan-ncnn-vulkan ile yedek -> /tmp/mushaf-upscaled-png/ (PNG)
 *   3. cwebp ile PNG -> mushaf-pages/{N}.webp (q=92)
 *   4. Tmp PNG'leri sil
 *
 * Onkoşul:
 *   - scripts/tools/realesrgan/realesrgan-ncnn-vulkan binary'si mevcut
 *   - cwebp PATH'te (brew install webp)
 *
 * Kullanim:
 *   npx tsx scripts/upscale-mushaf-pages.ts          # tum 604 sayfa
 *   npx tsx scripts/upscale-mushaf-pages.ts 1 20     # sayfa 1-20
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, readdirSync, copyFileSync, statSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const SRC_DIR = resolve("public/mushaf-pages");
const BACKUP_DIR = resolve("public/mushaf-pages-1x");
const TMP_PNG_DIR = "/tmp/mushaf-upscaled-png";
const REALESRGAN = resolve("scripts/tools/realesrgan/realesrgan-ncnn-vulkan");
const MODELS_DIR = resolve("scripts/tools/realesrgan/models");
const MODEL = "realesr-animevideov3-x2";
const SCALE = 2;
const WEBP_QUALITY = 92;
const TOTAL_PAGES = 604;

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function run(cmd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { code: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

async function main() {
  const args = process.argv.slice(2);
  const startPage = args[0] ? parseInt(args[0], 10) : 1;
  const endPage = args[1] ? parseInt(args[1], 10) : TOTAL_PAGES;

  if (!existsSync(REALESRGAN)) {
    console.error(`Real-ESRGAN binary bulunamadi: ${REALESRGAN}`);
    process.exit(1);
  }
  const cwebpCheck = run("cwebp", ["-version"]);
  if (cwebpCheck.code !== 0) {
    console.error("cwebp PATH'te yok. Kurmak icin: brew install webp");
    process.exit(1);
  }

  // 1. Backup: mushaf-pages -> mushaf-pages-1x (sadece eksik dosyalar)
  ensureDir(BACKUP_DIR);
  let backedUp = 0;
  for (let n = 1; n <= TOTAL_PAGES; n++) {
    const src = join(SRC_DIR, `${n}.webp`);
    const dst = join(BACKUP_DIR, `${n}.webp`);
    if (!existsSync(dst) && existsSync(src)) {
      copyFileSync(src, dst);
      backedUp++;
    }
  }
  console.log(`Yedek: ${BACKUP_DIR} (yeni kopya: ${backedUp})`);

  // 2. Realesrgan batch: backup -> tmp PNG dir
  // Binary directory mode kullaniyoruz; -i ve -o klasor olabilir.
  // Sayfa araligi icin filtreli kopyalama yapip o klasoru besliyoruz.
  if (existsSync(TMP_PNG_DIR)) rmSync(TMP_PNG_DIR, { recursive: true, force: true });
  ensureDir(TMP_PNG_DIR);
  const stagingDir = "/tmp/mushaf-upscale-staging";
  if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true, force: true });
  ensureDir(stagingDir);
  let staged = 0;
  for (let n = startPage; n <= endPage; n++) {
    const src = join(BACKUP_DIR, `${n}.webp`);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(stagingDir, `${n}.webp`));
    staged++;
  }
  console.log(`Staged: ${staged} sayfa -> ${stagingDir}`);

  console.log(`Upscale baslatiliyor (model: ${MODEL}, scale: ${SCALE}x)...`);
  const t0 = Date.now();
  const upscale = spawnSync(
    REALESRGAN,
    [
      "-i", stagingDir,
      "-o", TMP_PNG_DIR,
      "-n", MODEL,
      "-s", String(SCALE),
      "-m", MODELS_DIR,
      "-f", "png",
    ],
    { stdio: "inherit" },
  );
  if (upscale.status !== 0) {
    console.error(`Real-ESRGAN basarisiz, code=${upscale.status}`);
    process.exit(1);
  }
  const upscaleSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Upscale tamamlandi: ${upscaleSec}s`);

  // 3. PNG -> WebP q=92 (kaynak yerine yaz)
  console.log(`WebP encode (q=${WEBP_QUALITY})...`);
  const pngFiles = readdirSync(TMP_PNG_DIR).filter((f) => f.endsWith(".png"));
  let encoded = 0;
  let failed = 0;
  for (const png of pngFiles) {
    const pageNum = png.replace(".png", "");
    const inPath = join(TMP_PNG_DIR, png);
    const outPath = join(SRC_DIR, `${pageNum}.webp`);
    const r = run("cwebp", ["-q", String(WEBP_QUALITY), "-quiet", inPath, "-o", outPath]);
    if (r.code !== 0) {
      console.error(`  x sayfa ${pageNum} -- cwebp basarisiz: ${r.stderr.trim().slice(0, 200)}`);
      failed++;
      continue;
    }
    encoded++;
    if (encoded % 50 === 0 || encoded === pngFiles.length) {
      const size = statSync(outPath).size;
      console.log(`  + ${encoded}/${pngFiles.length} (sayfa ${pageNum}: ${Math.round(size / 1024)}KB)`);
    }
  }

  // 4. Tmp temizle
  rmSync(TMP_PNG_DIR, { recursive: true, force: true });
  rmSync(stagingDir, { recursive: true, force: true });

  console.log(`\nTamamlandi! ${encoded} basarili, ${failed} hatali.`);
  console.log(`Yedek: ${BACKUP_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
