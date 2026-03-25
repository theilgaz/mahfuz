/**
 * Tüm import scriptlerini sırasıyla çalıştırır.
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";

const cwd = resolve(import.meta.dirname, "..");

function run(script: string, args: string = "") {
  const cmd = `npx tsx scripts/${script}.ts ${args}`;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`▶ ${cmd}`);
  console.log(`${"═".repeat(60)}\n`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

async function main() {
  const start = Date.now();

  // 1. Kuran metni (sureler + ayetler)
  run("import-quran-text");

  // 2. Mealler (varsayılan: öncelikli 4 meal)
  // --all argümanı verilmişse tüm mealleri import et
  const allTranslations = process.argv.includes("--all") ? "--all" : "";
  run("import-translations", allTranslations);

  // 3. Kâriler
  run("import-reciters");

  // 4. Doğrulama
  run("verify-data");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`✓ Tüm veriler ${elapsed}s'de başarıyla import edildi!`);
  console.log(`${"═".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
