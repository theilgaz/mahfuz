/**
 * Mealleri LibSQL veritabanına aktarır.
 *
 * Kaynak: apps/legacy/public/translations/*.json
 * Her dosya: { id, name, verses: { "surahId:ayahNumber": "text" } }
 *
 * Varsayılan meal: Ömer Çelik
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { translationSources, translations } from "../src/db/quran-schema";

const CORE_PUBLIC = resolve(import.meta.dirname, "../public");
const TRANSLATIONS_DIR = resolve(CORE_PUBLIC, "translations");

// ── DB bağlantısı ──────────────────────────────────────

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// ── Meal slug → dil eşleştirmesi ───────────────────────

const SLUG_TO_LANGUAGE: Record<string, string> = {
  "elmali-yeni": "tr",
  "omer-celik": "tr",
  "diyanet": "tr",
  "omer-nasuhi-bilmen": "tr",
  "ali-fikri-yavuz": "tr",
  "sahih-international": "en",
  "taisirul-quran": "bn",
  "islamhouse-fa": "fa",
  "montada-fr": "fr",
  "kfqpc-id": "id",
  "piccardo": "it",
  "abdalsalaam-nl": "nl",
  "helmi-nasr": "pt",
  "kuliev": "ru",
  "nahi": "sq",
  "kfqpc-th": "th",
  "junagarhi": "ur",
  "ma-jian": "zh",
  "basmeih": "ms",
  "isa-garcia": "es",
  "barwani": "sw",
  "ruwwad-vi": "vi",
  "muyassar-ar": "ar",
  "bubenheim-de": "de",
  "pickthall-en": "en",
};

const DEFAULT_SLUG = "omer-celik";

// ── Hangi mealleri import edeceğimizi belirle ──────────

// Argüman yoksa sadece Ömer Çelik ve Diyanet
// --all ile hepsini import et
const importAll = process.argv.includes("--all");
const PRIORITY_SLUGS = [
  "omer-celik", "diyanet", "elmali-yeni",       // TR
  "sahih-international", "pickthall-en",          // EN
  "isa-garcia",                                   // ES
  "montada-fr",                                   // FR
  "muyassar-ar",                                  // AR
  "bubenheim-de",                                 // DE
  "abdalsalaam-nl",                               // NL
];

// ── Ana fonksiyon ──────────────────────────────────────

interface TranslationFile {
  id: string;
  name: string;
  verses: Record<string, string>; // "surahId:ayahNumber" → text
}

async function main() {
  console.log("Mealler import ediliyor...\n");

  const files = readdirSync(TRANSLATIONS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "wbw-tr-fallback.json")
    .map((f) => basename(f, ".json"));

  const slugsToImport = importAll ? files : files.filter((s) => PRIORITY_SLUGS.includes(s));

  console.log(`  ${slugsToImport.length} meal bulundu: ${slugsToImport.join(", ")}`);

  // Tabloları temizle
  await db.delete(translations);
  await db.delete(translationSources);

  let sourceId = 0;

  for (const slug of slugsToImport) {
    sourceId++;
    const filePath = resolve(TRANSLATIONS_DIR, `${slug}.json`);
    const data: TranslationFile = JSON.parse(readFileSync(filePath, "utf-8"));

    const language = SLUG_TO_LANGUAGE[slug] || "tr";

    // Source kaydı ekle
    await db.insert(translationSources).values({
      id: sourceId,
      slug,
      language,
      author: data.name || slug,
      name: data.name || slug,
      isDefault: slug === DEFAULT_SLUG,
    });

    // Ayet çevirilerini parse et ve batch insert
    const verses = Object.entries(data.verses);
    console.log(`  ${slug}: ${verses.length} ayet işleniyor...`);

    // Batch insert (1000'lik parçalar halinde — SQLite limit)
    const BATCH_SIZE = 500;
    const rows = verses.map(([key, text]) => {
      const [surahStr, ayahStr] = key.split(":");
      return {
        surahId: parseInt(surahStr, 10),
        ayahNumber: parseInt(ayahStr, 10),
        sourceId,
        text,
      };
    });

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await db.insert(translations).values(batch);
    }

    console.log(`  ✓ ${slug}: ${verses.length} ayet eklendi`);
  }

  console.log(`\n✓ Toplam ${sourceId} meal başarıyla import edildi!`);

  client.close();
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
