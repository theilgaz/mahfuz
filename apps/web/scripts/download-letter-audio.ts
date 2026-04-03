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

/**
 * Kaynak: razunatmohammed88-cyber/arabic-alphabet-audio (MIT, 2025)
 * Tenvin (ün/un) yok — doğal harf isimleri.
 */
const BASE_URL =
  "https://raw.githubusercontent.com/razunatmohammed88-cyber/arabic-alphabet-audio/main";

const OUT_DIR = join(__dirname, "../public/kids/audio");

/**
 * id → repo'daki dosya adı (uzantısız)
 * Dosya adlarındaki özel karakterler encodeURIComponent ile işlenir.
 *   taa'.mp3  = ت  (yumuşak t)
 *   taa.mp3   = ط  (vurgulu T)
 *   haa.mp3   = ح  (boğumsal h)
 *   haa'.mp3  = ه  (normal h)
 *   thaa.mp3  = ث
 *   thaal.mp3 = ذ
 *   thaa'.mp3 = ظ
 *   àyn.mp3   = ع  (à = U+00E0)
 */
const LETTERS: { id: string; file: string }[] = [
  { id: "alif",  file: "alif"   },
  { id: "ba",    file: "baa"    },
  { id: "ta",    file: "taa'"   },
  { id: "tha",   file: "thaa"   },
  { id: "jim",   file: "jiim"   },
  { id: "ha",    file: "haa"    },
  { id: "kha",   file: "khaa"   },
  { id: "dal",   file: "daal"   },
  { id: "dhal",  file: "thaal"  },
  { id: "ra",    file: "raa"    },
  { id: "zay",   file: "zaay"   },
  { id: "sin",   file: "siin"   },
  { id: "shin",  file: "shiin"  },
  { id: "sad",   file: "saad"   },
  { id: "dad",   file: "daad"   },
  { id: "taa",   file: "taa"    },
  { id: "dhaa",  file: "thaa'"  },
  { id: "ayn",   file: "\u00E0yn" }, // àyn
  { id: "ghayn", file: "ghayn"  },
  { id: "fa",    file: "faa"    },
  { id: "qaf",   file: "qaaf"   },
  { id: "kaf",   file: "kaaf"   },
  { id: "lam",   file: "laam"   },
  { id: "mim",   file: "miim"   },
  { id: "nun",   file: "nuun"   },
  { id: "haa",   file: "haa'"   },
  { id: "waw",   file: "waaw"   },
  { id: "ya",    file: "yaa"    },
];

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

  for (const { id, file } of LETTERS) {
    const dest = join(OUT_DIR, `${id}.mp3`);
    const url = `${BASE_URL}/${encodeURIComponent(file)}.mp3`;

    try {
      process.stdout.write(`  ⬇  ${id}.mp3 (${file})…`);
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
