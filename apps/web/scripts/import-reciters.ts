/**
 * Kâri bilgilerini LibSQL veritabanına aktarır.
 *
 * Kaynak: packages/shared/src/constants/reciters.ts → CURATED_RECITERS
 * Audio URL pattern: QDC (api.qurancdn.com) → chapter recitations endpoint
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { reciters } from "../src/db/quran-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// ── QDC ses URL pattern ────────────────────────────────
// Her kâri için: https://api.qurancdn.com/api/qdc/audio/reciters/{id}/audio_files?chapter={surahId}
// Verse audio: verses.quran.com/{reciterFolder}/{surahPadded}{ayahPadded}.mp3

// Featured kâriler — QDC ID'leri ile
const RECITERS_DATA = [
  {
    slug: "mishary-rashid-alafasy",
    name: "Mishari Rashid al-Afasy",
    country: "Kuveyt",
    style: "murattal",
    audioBaseUrl: "https://verses.quran.com/Alafasy/mp3",
    isDefault: true,
    qurancomId: 7,
  },
  {
    slug: "mahmoud-khalil-al-husary",
    name: "Mahmoud Khalil Al-Husary",
    country: "Mısır",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Husary/mp3",
    qurancomId: 6,
  },
  {
    slug: "mahmood-ali-al-banna",
    name: "Mahmood Ali Al-Banna",
    country: "Mısır",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/mahmoud_ali_al_banna/mp3",
    qurancomId: 129,
  },
  {
    slug: "mahmoud-khalil-al-husary-muallim",
    name: "Mahmoud Khalil Al-Husary (Muallim)",
    country: "Mısır",
    style: "muallim",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Husary_Muallim/mp3",
    qurancomId: 12,
  },
  {
    slug: "khalid-al-jalil",
    name: "Khalid Al-Jalil",
    country: "Suudi Arabistan",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/khalid_al_jalil/mp3",
    qurancomId: 170,
  },
  {
    slug: "fatih-seferagic",
    name: "Fatih Seferagic",
    country: "Bosna/ABD",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/fatih_seferagic/mp3",
    qurancomId: 134,
  },
  {
    slug: "abdulbasit-abdulsamad-mujawwad",
    name: "AbdulBaset AbdulSamad",
    country: "Mısır",
    style: "mujawwad",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/AbdulSamad/mp3",
    qurancomId: 1,
  },
  {
    slug: "abdulbasit-abdulsamad-murattal",
    name: "AbdulBaset AbdulSamad",
    country: "Mısır",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Abdul_Basit_Murattal_192kbps/mp3",
    qurancomId: 2,
  },
  {
    slug: "abdur-rahman-as-sudais",
    name: "Abdur-Rahman as-Sudais",
    country: "Suudi Arabistan",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Sudais/mp3",
    qurancomId: 3,
  },
  {
    slug: "maher-al-muaiqly",
    name: "Maher Al-Muaiqly",
    country: "Suudi Arabistan",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/MaherAlMuworthy/mp3",
    qurancomId: 52,
  },
  {
    slug: "saad-al-ghamdi",
    name: "Saad Al-Ghamdi",
    country: "Suudi Arabistan",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Ghamadi_40kbps/mp3",
    qurancomId: 13,
  },
  {
    slug: "saud-ash-shuraim",
    name: "Sa'ud ash-Shuraim",
    country: "Suudi Arabistan",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Shuraym/mp3",
    qurancomId: 10,
  },
  {
    slug: "minshawi-murattal",
    name: "Mohamed Siddiq al-Minshawi",
    country: "Mısır",
    style: "murattal",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Minshawi_Murattal_128kbps/mp3",
    qurancomId: 9,
  },
  {
    slug: "minshawi-mujawwad",
    name: "Mohamed Siddiq al-Minshawi",
    country: "Mısır",
    style: "mujawwad",
    isDefault: false,
    audioBaseUrl: "https://verses.quran.com/Minshawy_Mujawwad_192kbps/mp3",
    qurancomId: 8,
  },
] as const;

async function main() {
  console.log("Kâriler import ediliyor...\n");

  await db.delete(reciters);

  const rows = RECITERS_DATA.map((r) => ({
    slug: r.slug,
    name: r.name,
    country: r.country,
    style: r.style,
    audioBaseUrl: r.audioBaseUrl,
    audioFormat: "mp3" as const,
    isDefault: r.isDefault,
    isActive: true,
    source: "qurancom" as const,
    qurancomId: r.qurancomId,
  }));

  await db.insert(reciters).values(rows);

  console.log(`✓ ${rows.length} kâri eklendi`);
  console.log(`  Varsayılan: ${RECITERS_DATA.find((r) => r.isDefault)?.name}`);

  client.close();
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
