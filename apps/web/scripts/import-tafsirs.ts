/**
 * Tefsirleri public/tafsir/{slug}/*.json'dan LibSQL veritabanına aktarır.
 *
 * Her sure dosyası: { "surahId:ayahNumber": { textHtml, textPlain, groupKey? } }
 *
 * Kullanım (apps/web/ dizininden):
 *   pnpm import:tafsir                 # tüm tefsirler
 *   pnpm import:tafsir diyanet         # sadece diyanet
 *   pnpm import:tafsir diyanet elmalili
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray } from "drizzle-orm";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { tafsirs, tafsirSources } from "../src/db/quran-schema";

const TAFSIR_DIR = resolve(import.meta.dirname, "../public/tafsir");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

interface TafsirSourceMeta {
  slug: string;
  language: string;
  author: string;
  name: string;
  isDefault?: boolean;
}

const SOURCE_META: Record<string, TafsirSourceMeta> = {
  diyanet: {
    slug: "diyanet",
    language: "tr",
    author: "Diyanet İşleri Başkanlığı",
    name: "Kur'an Yolu Tefsiri",
    isDefault: true,
  },
  tefhim: {
    slug: "tefhim",
    language: "tr",
    author: "Mevdudi (TR çev.)",
    name: "Tefhimü'l-Kur'an",
  },
  // İlerleyen tefsirler:
  // "elmalili": { ... }
  // "ibni-kesir": { ... }
  // "omer-celik": { ... }
};

interface TafsirEntry {
  textHtml: string;
  textPlain: string;
  groupKey?: string;
}

interface TafsirRow {
  sourceId: number;
  surahId: number;
  ayahNumber: number;
  textHtml: string;
  textPlain: string;
  groupKey: string | null;
}

async function importSource(slug: string): Promise<number> {
  const meta = SOURCE_META[slug];
  if (!meta) throw new Error(`No metadata for tafsir source '${slug}'`);

  const dir = resolve(TAFSIR_DIR, slug);
  if (!existsSync(dir)) throw new Error(`Directory not found: ${dir}`);

  // Source kaydı (upsert)
  const [existing] = await db
    .select()
    .from(tafsirSources)
    .where(eq(tafsirSources.slug, slug));

  let sourceId: number;
  if (existing) {
    sourceId = existing.id;
    await db.delete(tafsirs).where(eq(tafsirs.sourceId, sourceId));
    await db
      .update(tafsirSources)
      .set({
        language: meta.language,
        author: meta.author,
        name: meta.name,
        isDefault: meta.isDefault ?? false,
      })
      .where(eq(tafsirSources.id, sourceId));
  } else {
    const inserted = await db
      .insert(tafsirSources)
      .values({
        slug,
        language: meta.language,
        author: meta.author,
        name: meta.name,
        isDefault: meta.isDefault ?? false,
      })
      .returning({ id: tafsirSources.id });
    sourceId = inserted[0].id;
  }

  // Tüm sure JSON'larını oku
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const rows: TafsirRow[] = [];
  // surahId → set of ayah numbers already written (groupKey expansion'da çakışma engellemek için)
  const writtenPerSurah = new Map<number, Set<number>>();

  for (const f of files) {
    const filePath = resolve(dir, f);
    if (!statSync(filePath).isFile()) continue;
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, TafsirEntry>;
    for (const [key, entry] of Object.entries(data)) {
      const [surahStr, ayahStr] = key.split(":");
      const surahId = parseInt(surahStr, 10);
      const sourceAyah = parseInt(ayahStr, 10);

      // groupKey "X-Y" varsa X..Y için duplicate satırlar yaz (UX: her ayet kendi tefsirini bulur)
      let range: [number, number] = [sourceAyah, sourceAyah];
      if (entry.groupKey) {
        const m = /^(\d+)-(\d+)$/.exec(entry.groupKey);
        if (m) range = [parseInt(m[1], 10), parseInt(m[2], 10)];
      }

      if (!writtenPerSurah.has(surahId)) writtenPerSurah.set(surahId, new Set());
      const written = writtenPerSurah.get(surahId)!;

      for (let ayahNumber = range[0]; ayahNumber <= range[1]; ayahNumber++) {
        if (written.has(ayahNumber)) continue; // çakışma → ilk gelen kazanır
        written.add(ayahNumber);
        rows.push({
          sourceId,
          surahId,
          ayahNumber,
          textHtml: entry.textHtml,
          textPlain: entry.textPlain,
          groupKey: entry.groupKey ?? null,
        });
      }
    }
  }

  // Batch insert (SQLite parametre limiti ~999; row başına 6 sütun)
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(tafsirs).values(rows.slice(i, i + BATCH));
  }

  console.log(`  ✓ ${slug}: ${rows.length} ayet → sourceId=${sourceId}`);
  return rows.length;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const all = args.length === 0;
  const slugs = all
    ? readdirSync(TAFSIR_DIR).filter((f) => {
        const p = resolve(TAFSIR_DIR, f);
        return statSync(p).isDirectory() && SOURCE_META[f];
      })
    : args;

  if (slugs.length === 0) {
    console.log("Hiç tefsir bulunamadı.");
    return;
  }

  console.log(`Tefsirler import ediliyor: ${slugs.join(", ")}\n`);
  let total = 0;
  for (const slug of slugs) {
    total += await importSource(slug);
  }
  console.log(`\nToplam ${total} tefsir kaydı yazıldı.`);
  client.close();
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
