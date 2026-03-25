/**
 * kuranvemeali.com'dan Diyanet imlâî metin çeker → public/imlaei/{surahId}.json
 *
 * HTML yapısı:
 *   <div class="col-xs-11 text-right" style="font-family: Shaikh Hamdullah Mushaf; ...">
 *       ARABIC TEXT
 *   </div>
 *
 * Kullanım: npx tsx scripts/fetch-diyanet.ts
 */

const SURAH_SLUGS: Record<number, string> = {
  1: "fatiha", 2: "bakara", 3: "aliimran", 4: "nisa", 5: "maide",
  6: "enam", 7: "araf", 8: "enfal", 9: "tevbe", 10: "yunus",
  11: "hud", 12: "yusuf", 13: "rad", 14: "ibrahim", 15: "hicr",
  16: "nahl", 17: "isra", 18: "kehf", 19: "meryem", 20: "taha",
  21: "enbiya", 22: "hac", 23: "muminun", 24: "nur", 25: "furkan",
  26: "suara", 27: "neml", 28: "kasas", 29: "ankebut", 30: "rum",
  31: "lokman", 32: "secde", 33: "ahzab", 34: "sebe", 35: "fatir",
  36: "yasin", 37: "saffat", 38: "sad", 39: "zumer", 40: "mumin",
  41: "fussilet", 42: "sura", 43: "zuhruf", 44: "duhan", 45: "casiye",
  46: "ahkaf", 47: "muhammed", 48: "fetih", 49: "hucurat", 50: "kaf",
  51: "zariyat", 52: "tur", 53: "necm", 54: "kamer", 55: "rahman",
  56: "vakia", 57: "hadid", 58: "mucadele", 59: "hasr", 60: "mumtehine",
  61: "saf", 62: "cuma", 63: "munafikun", 64: "tegabun", 65: "talak",
  66: "tahrim", 67: "mulk", 68: "kalem", 69: "hakka", 70: "mearic",
  71: "nuh", 72: "cin", 73: "muzzemmil", 74: "muddessir", 75: "kiyamet",
  76: "insan", 77: "murselat", 78: "nebe", 79: "naziat", 80: "abese",
  81: "tekvir", 82: "infitar", 83: "mutaffifin", 84: "insikak", 85: "buruc",
  86: "tarik", 87: "ala", 88: "gasiye", 89: "fecr", 90: "beled",
  91: "sems", 92: "leyl", 93: "duha", 94: "insirah", 95: "tin",
  96: "alak", 97: "kadir", 98: "beyyine", 99: "zilzal", 100: "adiyat",
  101: "karia", 102: "tekasur", 103: "asr", 104: "humeze", 105: "fil",
  106: "kureys", 107: "maun", 108: "kevser", 109: "kafirun", 110: "nasr",
  111: "tebbet", 112: "ihlas", 113: "felak", 114: "nas",
};

const DELAY_MS = 400;

async function fetchSurah(surahId: number): Promise<Record<string, string>> {
  const slug = SURAH_SLUGS[surahId];
  if (!slug) throw new Error(`No slug for surah ${surahId}`);

  const url = `https://www.kuranvemeali.com/${slug}-suresi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const result: Record<string, string> = {};

  // Shaikh Hamdullah div'lerinin içindeki Arapça metinleri çek
  const lines = html.split("\n");
  let inArabicDiv = false;
  const allTexts: string[] = [];

  for (const line of lines) {
    if (line.includes("Shaikh Hamdullah Mushaf")) {
      inArabicDiv = true;
      continue;
    }
    if (inArabicDiv) {
      const text = line.replace(/<[^>]*>/g, "").trim();
      if (text && /[\u0600-\u06FF]/.test(text)) {
        allTexts.push(text);
      }
      inArabicDiv = false;
    }
  }

  // Fatiha: besmele 1. ayettir, hepsi dahil
  // Tevbe (9): besmele yok, ilk satır 1. ayet
  // Diğer sureler: ilk satır besmele → atla, 2. satırdan itibaren ayet
  const skipFirst = surahId !== 1 && surahId !== 9;
  const verses = skipFirst ? allTexts.slice(1) : allTexts;

  for (let i = 0; i < verses.length; i++) {
    result[`${surahId}:${i + 1}`] = verses[i];
  }

  return result;
}

async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const outDir = path.resolve("public/imlaei");
  fs.mkdirSync(outDir, { recursive: true });

  console.log("Diyanet metin çekiliyor (kuranvemeali.com)...\n");

  let totalVerses = 0;
  const failed: number[] = [];

  for (let surahId = 1; surahId <= 114; surahId++) {
    try {
      const data = await fetchSurah(surahId);
      const count = Object.keys(data).length;

      if (count === 0) {
        console.error(`  ✗ Sure ${surahId} (${SURAH_SLUGS[surahId]}) — ayet bulunamadı`);
        failed.push(surahId);
      } else {
        const outPath = path.join(outDir, `${surahId}.json`);
        fs.writeFileSync(outPath, JSON.stringify(data));
        console.log(`  ✓ Sure ${surahId} (${SURAH_SLUGS[surahId]}) — ${count} ayet`);
        totalVerses += count;
      }
    } catch (err) {
      console.error(`  ✗ Sure ${surahId} — ${err}`);
      failed.push(surahId);
    }

    if (surahId < 114) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nToplam: ${totalVerses} ayet yazıldı.`);
  if (failed.length > 0) {
    console.log(`Başarısız: ${failed.join(", ")}`);
  }
}

main();
