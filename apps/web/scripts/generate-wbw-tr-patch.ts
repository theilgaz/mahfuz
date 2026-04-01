/**
 * Quran.com WBW Türkçe Yama Üreticisi
 *
 * Quran.com API'sinde Türkçe karşılığı olmayan Arapça kelimeleri
 * Claude API kullanarak toplu çevirir ve public/wbw-tr-patch.json oluşturur.
 *
 * Kullanım:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-wbw-tr-patch.ts
 *
 * Çıktı: apps/web/public/wbw-tr-patch.json
 *   { "تَرَ": "gördün", "يَجْعَلْ": "kıldı", ... }
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT_FILE = resolve(import.meta.dirname, "../public/wbw-tr-patch.json");
const BATCH_SIZE = 60;
const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(
  client: Anthropic,
  batch: Array<{ arabic: string; english: string }>,
): Promise<Record<string, string>> {
  const lines = batch
    .map((w, i) => `${i + 1}. Arapça: ${w.arabic} | İngilizce: ${w.english}`)
    .join("\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Aşağıdaki Kur'an Arapçası kelimelerini Türkçeye çevir. Her kelime bir Kur'an ayetinde geçen tek bir kelime formudur. İngilizce çeviri bağlam için verilmiştir.

Kurallar:
- Her kelime için kısa ve öz bir Türkçe karşılık ver (1-4 kelime)
- Kur'an Türkçesine uygun klasik kelimeler kullan
- Zamir eklerini (-i, -ı, -nın, -si vb.) dahil et
- Sadece numara ve çeviriyi yaz, açıklama ekleme

Format (TAM OLARAK bu formatta yanıtla):
1. <türkçe çeviri>
2. <türkçe çeviri>
...

Kelimeler:
${lines}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const result: Record<string, string> = {};
  const responseLines = text.trim().split("\n");

  for (let i = 0; i < batch.length; i++) {
    const line = responseLines[i] ?? "";
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) {
      result[batch[i].arabic] = match[1].trim();
    }
  }

  return result;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY ortam değişkeni gerekli");
    process.exit(1);
  }

  // Tarama dosyasını bul
  const scanFile = "/tmp/wbw_missing_tr.json";
  if (!existsSync(scanFile)) {
    console.error(`Tarama dosyası bulunamadı: ${scanFile}`);
    console.error("Önce tüm sureleri tara ve /tmp/wbw_missing_tr.json oluştur.");
    process.exit(1);
  }

  const scanData = JSON.parse(readFileSync(scanFile, "utf-8"));
  const uniqueWords: Record<string, string> = scanData.unique_words ?? {};
  const entries = Object.entries(uniqueWords); // [arabic, english][]

  console.log(`Toplam eksik kelime: ${entries.length}`);
  console.log(`Batch boyutu: ${BATCH_SIZE}`);
  console.log(`Tahmini batch sayısı: ${Math.ceil(entries.length / BATCH_SIZE)}`);

  // Mevcut patch varsa yükle (kaldığımız yerden devam)
  let patch: Record<string, string> = {};
  if (existsSync(OUT_FILE)) {
    patch = JSON.parse(readFileSync(OUT_FILE, "utf-8"));
    const existing = Object.keys(patch).length;
    console.log(`Mevcut patch yüklendi: ${existing} kelime`);
  }

  const client = new Anthropic({ apiKey });

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Zaten çevrilenleri atla
  const remaining = entries.filter(([ar]) => !patch[ar]);
  console.log(`Çevrilecek: ${remaining.length} kelime\n`);

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE).map(([arabic, english]) => ({
      arabic,
      english,
    }));

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${batch.length} kelime)... `);

    try {
      const translations = await translateBatch(client, batch);
      const count = Object.keys(translations).length;
      Object.assign(patch, translations);
      processed += count;

      if (count < batch.length) {
        skipped += batch.length - count;
        process.stdout.write(`✓ ${count}/${batch.length} çevrildi\n`);
      } else {
        process.stdout.write(`✓\n`);
      }

      // Her batch'ten sonra kaydet (kesmeler için güvenli)
      writeFileSync(OUT_FILE, JSON.stringify(patch, null, 2), "utf-8");
    } catch (err) {
      errors++;
      process.stdout.write(`✗ Hata: ${err}\n`);
    }

    if (i + BATCH_SIZE < remaining.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n--- Tamamlandı ---`);
  console.log(`Çevrilen: ${processed}`);
  console.log(`Atlanan: ${skipped}`);
  console.log(`Hata: ${errors}`);
  console.log(`Toplam patch: ${Object.keys(patch).length} kelime`);
  console.log(`Çıktı: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
