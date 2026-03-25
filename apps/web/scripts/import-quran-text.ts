/**
 * Kuran metni ve sure bilgilerini LibSQL veritabanına aktarır.
 *
 * Kaynak: apps/legacy/public/quran/ dizinindeki mevcut JSON dosyaları
 * - meta.json → surahs tablosu
 * - uthmani/{1-114}.json → ayahs tablosu (harekelenmiş)
 * - simple/{1-114}.json → ayahs.textSimple (harekesiz, arama için)
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { surahs, ayahs } from "../src/db/quran-schema";

const WEB_PUBLIC = resolve(import.meta.dirname, "../../web/public");

// ── DB bağlantısı ──────────────────────────────────────

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// ── Tipler ─────────────────────────────────────────────

interface MetaChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_translation: string;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  verses_count: number;
  pages: [number, number];
}

interface TanzilVerse {
  v: number;
  t: string;
  p: number;
  j: number;
  h: number;
  rk: number;
  m: number;
  sj?: number;
}

interface TanzilSurah {
  bismillah?: string;
  verses: TanzilVerse[];
}

// ── Ana fonksiyon ──────────────────────────────────────

async function main() {
  console.log("Kuran metni import ediliyor...\n");

  // 1. meta.json oku
  const metaPath = resolve(WEB_PUBLIC, "quran/meta.json");
  const meta: { chapters: MetaChapter[] } = JSON.parse(readFileSync(metaPath, "utf-8"));

  // 2. Surahs tablosunu doldur
  console.log("  Sureler ekleniyor...");
  const surahRows = meta.chapters.map((ch) => ({
    id: ch.id,
    nameArabic: ch.name_arabic,
    nameSimple: ch.name_simple,
    nameTranslation: ch.name_translation,
    revelation: ch.revelation_place,
    ayahCount: ch.verses_count,
    pageStart: ch.pages[0],
    pageEnd: ch.pages[1],
    revelationOrder: ch.revelation_order,
    bismillahPre: ch.bismillah_pre,
  }));

  // Batch insert (114 satır)
  await db.delete(surahs);
  await db.insert(surahs).values(surahRows);
  console.log(`  ✓ ${surahRows.length} sure eklendi`);

  // 3. Her sure için Uthmani + Simple text oku ve ayahs tablosuna ekle
  console.log("  Ayetler ekleniyor...");
  await db.delete(ayahs);

  let totalAyahs = 0;

  for (const ch of meta.chapters) {
    const uthmaniPath = resolve(WEB_PUBLIC, `quran/uthmani/${ch.id}.json`);
    const simplePath = resolve(WEB_PUBLIC, `quran/simple/${ch.id}.json`);

    const uthmaniData: TanzilSurah = JSON.parse(readFileSync(uthmaniPath, "utf-8"));
    const simpleData: TanzilSurah = JSON.parse(readFileSync(simplePath, "utf-8"));

    // Simple verse'leri map'e al (aynı sırada olmalı ama emin olalım)
    const simpleMap = new Map<number, string>();
    for (const sv of simpleData.verses) {
      simpleMap.set(sv.v, sv.t);
    }

    const ayahRows = uthmaniData.verses.map((verse) => ({
      surahId: ch.id,
      ayahNumber: verse.v,
      textUthmani: verse.t,
      textSimple: simpleMap.get(verse.v) ?? null,
      pageNumber: verse.p,
      juzNumber: verse.j,
      hizbNumber: verse.h,
      rukuNumber: verse.rk,
      sajdah: verse.sj != null && verse.sj > 0,
    }));

    // Batch insert per surah
    if (ayahRows.length > 0) {
      await db.insert(ayahs).values(ayahRows);
    }

    totalAyahs += ayahRows.length;

    if (ch.id % 20 === 0) {
      console.log(`    ... ${ch.id}/114 sure işlendi`);
    }
  }

  console.log(`  ✓ ${totalAyahs} ayet eklendi`);
  console.log("\nKuran metni başarıyla import edildi!");

  client.close();
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
