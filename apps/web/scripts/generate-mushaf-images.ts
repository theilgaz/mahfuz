/**
 * Mushaf sayfa goruntuleri olusturur — V2 QCF renderer'i Playwright ile render eder.
 *
 * Onkoşul:
 *   1. Dev server calisiyor olmali: npx pnpm@9 dev
 *   2. Playwright yuklu olmali: npx playwright install chromium
 *   3. QCF verileri mevcut olmali: npx tsx scripts/fetch-qcf-words.ts
 *   4. Labs aktif ve rendering engine V2 QCF secili olmali
 *
 * Kullanim:
 *   npx tsx scripts/generate-mushaf-images.ts
 *   npx tsx scripts/generate-mushaf-images.ts 1 20    # sayfa 1-20 arasi
 *
 * Cikti: public/mushaf-images/p{N}.webp (604 dosya)
 */

const DEV_SERVER = "http://localhost:3001";
const OUT_DIR = "public/mushaf-images";
const TOTAL_PAGES = 604;
// Viewport matches mushaf container (max-w-3xl = 768px) so QCF glyphs render at
// their natural layout size; DPR 3 yields ~2300px wide PNGs, sharp on retina.
const VIEWPORT = { width: 768, height: 1130 }; // aspect ratio ~0.68
const DEVICE_SCALE_FACTOR = 3;

async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  // Playwright'i dinamik import et (dev dependency)
  let chromium: any;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    console.error("Playwright yuklu degil. Yuklemek icin:");
    console.error("  npm install -D playwright");
    console.error("  npx playwright install chromium");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const startPage = args[0] ? parseInt(args[0], 10) : 1;
  const endPage = args[1] ? parseInt(args[1], 10) : TOTAL_PAGES;

  const outDir = path.resolve(OUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Mushaf goruntuleri olusturuluyor (sayfa ${startPage}-${endPage})...\n`);

  // Dev server'in calisiyor mu kontrol et
  try {
    const res = await fetch(DEV_SERVER);
    if (!res.ok) throw new Error();
  } catch {
    console.error(`Dev server (${DEV_SERVER}) calismiyoer. Once calistirin:`);
    console.error("  npx pnpm@9 dev");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  });

  // localStorage'a settings + locale yaz: dil dialogunu ve gereksiz UI'yi atla
  await context.addInitScript(() => {
    // Locale store: dil secimi dialogunu atla
    localStorage.setItem("mahfuz-core-locale", JSON.stringify({
      state: { locale: "tr", hasChosenLocale: true },
      version: 0,
    }));

    // Settings store: v2-qcf-fonts, meal kapali
    const existing = localStorage.getItem("mahfuz-core-settings");
    let settings: any = {};
    if (existing) {
      try { settings = JSON.parse(existing); } catch {}
    }
    settings.state = {
      ...settings.state,
      labsEnabled: true,
      mushafRenderingEngine: "v2-qcf-fonts",
      showTranslation: false,
      mushafStyle: "medine",
    };
    settings.version = 7;
    localStorage.setItem("mahfuz-core-settings", JSON.stringify(settings));
  });

  const page = await context.newPage();
  let success = 0;
  let fail = 0;

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    try {
      await page.goto(`${DEV_SERVER}/page/${pageNum}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // QCF fontun yuklenmesini bekle
      await page.waitForTimeout(1500);

      // Mushaf frame'i bul ve screenshot al
      const frame = await page.locator("[data-mushaf-style]").first();
      if (await frame.isVisible()) {
        const outPath = path.join(outDir, `p${pageNum}.webp`);
        await frame.screenshot({
          path: outPath,
          type: "png", // webp playwright tarafindan desteklenmiyor, sonra donusturecegiz
        });
        // PNG -> WebP donusumu (sharp gerektirmeden rename)
        const pngPath = outPath.replace(".webp", ".png");
        if (outPath !== pngPath) {
          fs.renameSync(outPath, pngPath);
        }
        const stats = fs.statSync(pngPath);
        console.log(`  + Sayfa ${pageNum} -- ${Math.round(stats.size / 1024)}KB`);
        success++;
      } else {
        console.error(`  x Sayfa ${pageNum} -- mushaf frame bulunamadi`);
        fail++;
      }
    } catch (err) {
      console.error(`  x Sayfa ${pageNum} -- ${err}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\nTamamlandi! ${success} basarili, ${fail} hatali.`);

  if (success > 0) {
    console.log(`\nNot: Goruntular PNG olarak kaydedildi.`);
    console.log(`WebP'ye donusturmek icin (opsiyonel, boyut tasarrufu):`);
    console.log(`  for f in ${OUT_DIR}/p*.png; do cwebp -q 85 "$f" -o "\${f%.png}.webp" && rm "$f"; done`);
  }
}

main();

export {};
