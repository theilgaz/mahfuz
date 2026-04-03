/**
 * Arap harflerinin ses dosyalarını indirir.
 *
 * Kaynak: elsanussi-s-mneina/arabic-alphabet-audio-speller-html-js (MIT)
 * Dosya adlandırması: Unicode codepoint onaltılık (ل → 0644.mp3)
 *
 * Kullanım:
 *   npx tsx scripts/download-letter-audio.ts
 *   pnpm download:letter-audio
 *
 * Çıktı: apps/web/public/kids/audio/{id}.mp3  (28 dosya)
 */

import { createWriteStream, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL =
  "https://raw.githubusercontent.com/elsanussi-s-mneina/arabic-alphabet-audio-speller-html-js/trunk/audio";

const OUT_DIR = join(__dirname, "../public/kids/audio");

/** id → Arapça karakter eşleşmesi */
const LETTERS: { id: string; arabic: string }[] = [
  { id: "alif",  arabic: "ا" },
  { id: "ba",    arabic: "ب" },
  { id: "ta",    arabic: "ت" },
  { id: "tha",   arabic: "ث" },
  { id: "jim",   arabic: "ج" },
  { id: "ha",    arabic: "ح" },
  { id: "kha",   arabic: "خ" },
  { id: "dal",   arabic: "د" },
  { id: "dhal",  arabic: "ذ" },
  { id: "ra",    arabic: "ر" },
  { id: "zay",   arabic: "ز" },
  { id: "sin",   arabic: "س" },
  { id: "shin",  arabic: "ش" },
  { id: "sad",   arabic: "ص" },
  { id: "dad",   arabic: "ض" },
  { id: "taa",   arabic: "ط" },
  { id: "dhaa",  arabic: "ظ" },
  { id: "ayn",   arabic: "ع" },
  { id: "ghayn", arabic: "غ" },
  { id: "fa",    arabic: "ف" },
  { id: "qaf",   arabic: "ق" },
  { id: "kaf",   arabic: "ك" },
  { id: "lam",   arabic: "ل" },
  { id: "mim",   arabic: "م" },
  { id: "nun",   arabic: "ن" },
  { id: "haa",   arabic: "ه" },
  { id: "waw",   arabic: "و" },
  { id: "ya",    arabic: "ي" },
];

function toCodepoint(char: string): string {
  const cp = char.codePointAt(0);
  if (!cp) throw new Error(`Invalid char: ${char}`);
  return cp.toString(16).padStart(4, "0").toUpperCase();
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  if (!res.body) throw new Error(`No body — ${url}`);
  await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`\n📥  Ses dosyaları indiriliyor → ${OUT_DIR}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const { id, arabic } of LETTERS) {
    const dest = join(OUT_DIR, `${id}.mp3`);

    if (existsSync(dest)) {
      console.log(`  ⏭  ${id}.mp3 zaten mevcut, atlandı`);
      skip++;
      continue;
    }

    const cp = toCodepoint(arabic);
    const url = `${BASE_URL}/${cp}.mp3`;

    try {
      process.stdout.write(`  ⬇  ${id}.mp3 (${arabic} → ${cp})…`);
      await download(url, dest);
      process.stdout.write(" ✓\n");
      ok++;
    } catch (err) {
      process.stdout.write(` ✗  ${(err as Error).message}\n`);
      fail++;
    }

    // Rate-limit: GitHub raw CDN'e saygı göster
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n✅  Tamamlandı: ${ok} indirildi, ${skip} atlandı, ${fail} hata\n`);

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
