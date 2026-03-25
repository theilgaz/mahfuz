/**
 * Import edilen verilerin doğruluğunu kontrol eder.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { count, eq } from "drizzle-orm";
import { surahs, ayahs, translations, translationSources, reciters } from "../src/db/quran-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

async function main() {
  console.log("Veri doğrulama başlatılıyor...\n");

  let allOk = true;

  // 1. Sureler
  const [surahCount] = await db.select({ count: count() }).from(surahs);
  const surahOk = surahCount.count === 114;
  console.log(`  ${surahOk ? "✓" : "✗"} ${surahCount.count} sure (beklenen: 114)`);
  if (!surahOk) allOk = false;

  // 2. Ayetler
  const [ayahCount] = await db.select({ count: count() }).from(ayahs);
  const ayahOk = ayahCount.count === 6236;
  console.log(`  ${ayahOk ? "✓" : "✗"} ${ayahCount.count} ayet (beklenen: 6236)`);
  if (!ayahOk) allOk = false;

  // 3. Fatiha kontrolü
  const fatiha = await db
    .select()
    .from(ayahs)
    .where(eq(ayahs.surahId, 1))
    .orderBy(ayahs.ayahNumber);
  const fatihaOk = fatiha.length === 7;
  console.log(`  ${fatihaOk ? "✓" : "✗"} Fatiha: ${fatiha.length} ayet (beklenen: 7)`);
  if (!fatihaOk) allOk = false;

  // 4. Meal kaynakları
  const sources = await db.select().from(translationSources);
  console.log(`  ✓ ${sources.length} meal kaynağı:`);
  for (const s of sources) {
    const [tCount] = await db
      .select({ count: count() })
      .from(translations)
      .where(eq(translations.sourceId, s.id));
    const tOk = tCount.count === 6236;
    console.log(`    ${tOk ? "✓" : "✗"} ${s.slug} (${s.language}): ${tCount.count} ayet ${s.isDefault ? "← varsayılan" : ""}`);
    if (!tOk) allOk = false;
  }

  // 5. Kâriler
  const [reciterCount] = await db.select({ count: count() }).from(reciters);
  console.log(`  ✓ ${reciterCount.count} kâri`);

  const defaultReciter = await db
    .select()
    .from(reciters)
    .where(eq(reciters.isDefault, true));
  if (defaultReciter.length === 1) {
    console.log(`    Varsayılan: ${defaultReciter[0].name}`);
  } else {
    console.log(`    ✗ Varsayılan kâri bulunamadı!`);
    allOk = false;
  }

  // 6. Sayfa dağılımı kontrolü
  const page1 = await db
    .select()
    .from(ayahs)
    .where(eq(ayahs.pageNumber, 1));
  const page604 = await db
    .select()
    .from(ayahs)
    .where(eq(ayahs.pageNumber, 604));
  console.log(`  ✓ Sayfa 1: ${page1.length} ayet, Sayfa 604: ${page604.length} ayet`);

  // Sonuç
  console.log(`\n${allOk ? "✓ Tüm doğrulamalar başarılı!" : "✗ Bazı doğrulamalar başarısız!"}`);

  client.close();

  if (!allOk) process.exit(1);
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
