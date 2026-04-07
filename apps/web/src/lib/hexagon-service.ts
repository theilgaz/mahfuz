/**
 * Hexagon Harf oyunu servisi.
 * Bulmacalar Kuran kelime haznesinden seçilmiş 7 harfli setlerdir.
 * Oyuncu merkez harfi zorunlu kullanarak kelime oluşturur.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { words } from "~/db/quran-schema";
import { eq, sql, and } from "drizzle-orm";

// ── Statik bulmacalar (DB boş olsa bile çalışır) ─────────

export interface HexWord {
  arabic: string;  // gösterim formu (diakritsiz)
  meaning: string; // Türkçe anlamı
  points: number;
}

export interface HexagonPuzzle {
  id: number;
  centerLetter: string;
  outerLetters: string[];   // 6 harf
  validWords: HexWord[];
  pangram?: string;         // tüm 7 harfi kullanan kelime
  difficulty: "easy" | "medium" | "hard";
}

// Diakritsiz Arapça → normalize
export function normalizeAr(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // tashkeel
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // أ إ آ → ا
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0640/g, ""); // tatweel
}

/** Kelimenin tüm harfleri verilen sette mevcut mu? (merkez dahil) */
export function isWordValid(normalized: string, allLetters: Set<string>): boolean {
  return normalized.split("").every((ch) => allLetters.has(ch));
}

/** Merkez harf kelimede var mı? */
export function hasCenterLetter(normalized: string, center: string): boolean {
  return normalized.includes(center);
}

/** Puan hesapla: 3 harf=1, 4=2, 5=3, 6+=uzunluk, pangram +3 bonus */
export function calcPoints(word: string, allLetters: Set<string>): number {
  const len = word.length;
  let base = len <= 3 ? 1 : len === 4 ? 2 : len === 5 ? 3 : len;
  const usedLetters = new Set(word.split(""));
  const isPangram = [...allLetters].every((l) => usedLetters.has(l));
  return isPangram ? base + 3 : base;
}

// ── Statik bulmaca kümesi ────────────────────────────────
// Gerçek Kuran kelimelerinden elle seçilmiş

export const STATIC_PUZZLES: HexagonPuzzle[] = [
  {
    id: 1,
    centerLetter: "ر",
    outerLetters: ["م", "ح", "ن", "ا", "ب", "ك"],
    difficulty: "easy",
    pangram: "رحمن",
    validWords: [
      { arabic: "رحم",   meaning: "merhamet etti",    points: 1 },
      { arabic: "رحمن",  meaning: "Rahman (merhametli)", points: 5 },
      { arabic: "ربنا",  meaning: "Rabbimiz",          points: 2 },
      { arabic: "كرم",   meaning: "cömertlik",          points: 1 },
      { arabic: "امر",   meaning: "emretti",            points: 1 },
      { arabic: "نحر",   meaning: "kesti (kurban)",     points: 1 },
      { arabic: "بكر",   meaning: "erken kalktı",       points: 1 },
      { arabic: "ربح",   meaning: "kazandı",            points: 1 },
      { arabic: "حمر",   meaning: "kızıl/eşek",        points: 1 },
      { arabic: "نكر",   meaning: "inkâr etti",         points: 1 },
      { arabic: "اكبر",  meaning: "en büyük (Ekber)",   points: 2 },
    ],
  },
  {
    id: 2,
    centerLetter: "ل",
    outerLetters: ["ا", "ه", "م", "ي", "ك", "ع"],
    difficulty: "easy",
    pangram: "اعمال",
    validWords: [
      { arabic: "اله",   meaning: "ilah (tanrı)",       points: 1 },
      { arabic: "ملك",   meaning: "melik (kral)",       points: 1 },
      { arabic: "عمل",   meaning: "amel (iş)",          points: 1 },
      { arabic: "علم",   meaning: "ilim (bilgi)",        points: 1 },
      { arabic: "كيل",   meaning: "ölçü",               points: 1 },
      { arabic: "ليل",   meaning: "gece",               points: 1 },
      { arabic: "هلك",   meaning: "helak oldu",         points: 1 },
      { arabic: "ملا",   meaning: "doldurdu",           points: 1 },
      { arabic: "عليم",  meaning: "Alim (bilen)",       points: 2 },
      { arabic: "حليم",  meaning: "Halim (yumuşak)",    points: 2 },
    ],
  },
  {
    id: 3,
    centerLetter: "م",
    outerLetters: ["س", "ل", "ا", "ن", "و", "ي"],
    difficulty: "medium",
    pangram: "مسلمون",
    validWords: [
      { arabic: "مسلم",  meaning: "Müslüman",           points: 2 },
      { arabic: "مسلمون", meaning: "Müslümanlar",        points: 8 },
      { arabic: "سلام",  meaning: "selam/barış",        points: 2 },
      { arabic: "ملا",   meaning: "mele (önderler)",    points: 1 },
      { arabic: "نال",   meaning: "ulaştı",             points: 1 },
      { arabic: "اسم",   meaning: "isim",               points: 1 },
      { arabic: "ساءل",  meaning: "sordu",              points: 2 },
      { arabic: "مال",   meaning: "mal/servet",         points: 1 },
      { arabic: "ليمون", meaning: "limon (isim değil)", points: 0 },
      { arabic: "سلم",   meaning: "teslim oldu",        points: 1 },
    ],
  },
  {
    id: 4,
    centerLetter: "ق",
    outerLetters: ["و", "ل", "ا", "ح", "ن", "ب"],
    difficulty: "medium",
    pangram: "حقوق",
    validWords: [
      { arabic: "قول",   meaning: "söz/dedi",           points: 1 },
      { arabic: "قلوب",  meaning: "kalpler",            points: 3 },
      { arabic: "قلب",   meaning: "kalp",               points: 1 },
      { arabic: "حق",    meaning: "hak/gerçek",         points: 1 },
      { arabic: "حقوق",  meaning: "haklar",             points: 5 },
      { arabic: "قال",   meaning: "dedi",               points: 1 },
      { arabic: "قالوا", meaning: "dediler",            points: 3 },
      { arabic: "حبل",   meaning: "ip/bağ",             points: 1 },
      { arabic: "انق",   meaning: "inince",             points: 1 },
    ],
  },
  {
    id: 5,
    centerLetter: "ن",
    outerLetters: ["و", "ر", "ا", "م", "ي", "ه"],
    difficulty: "easy",
    pangram: "نوراهم",
    validWords: [
      { arabic: "نور",   meaning: "ışık/nur",           points: 1 },
      { arabic: "نار",   meaning: "ateş",               points: 1 },
      { arabic: "ناس",   meaning: "insanlar",           points: 1 },
      { arabic: "نهار",  meaning: "gündüz",             points: 2 },
      { arabic: "نهر",   meaning: "ırmak/azarlama",     points: 1 },
      { arabic: "يمين",  meaning: "yemin/sağ taraf",   points: 2 },
      { arabic: "هوان",  meaning: "aşağılanma",         points: 2 },
      { arabic: "وهن",   meaning: "zayıflık",           points: 1 },
      { arabic: "ماهر",  meaning: "mahir (usta)",       points: 2 },
    ],
  },
  {
    id: 6,
    centerLetter: "ع",
    outerLetters: ["ل", "ي", "م", "ا", "ك", "ب"],
    difficulty: "medium",
    pangram: "عليكم",
    validWords: [
      { arabic: "عليم",  meaning: "Alim (bilen)",       points: 2 },
      { arabic: "عليكم", meaning: "sizin üzerinize",    points: 6 },
      { arabic: "علم",   meaning: "ilim/bilgi",         points: 1 },
      { arabic: "عمل",   meaning: "amel/iş",            points: 1 },
      { arabic: "عباد",  meaning: "kullar",             points: 2 },
      { arabic: "كبير",  meaning: "büyük",              points: 2 },
      { arabic: "ملك",   meaning: "melik/kral",         points: 1 },
      { arabic: "عاقب",  meaning: "cezalandırdı",       points: 2 },
      { arabic: "بعل",   meaning: "koca/Baal",          points: 1 },
    ],
  },
  {
    id: 7,
    centerLetter: "ت",
    outerLetters: ["و", "ب", "ا", "ر", "ك", "ي"],
    difficulty: "hard",
    pangram: "تبارك",
    validWords: [
      { arabic: "تبارك", meaning: "Tebareke (yücedir)", points: 6 },
      { arabic: "توبة",  meaning: "tövbe",              points: 2 },
      { arabic: "تاب",   meaning: "tövbe etti",         points: 1 },
      { arabic: "تابوا", meaning: "tövbe ettiler",      points: 3 },
      { arabic: "ركب",   meaning: "bindi",              points: 1 },
      { arabic: "كتاب",  meaning: "kitap",              points: 2 },
      { arabic: "برك",   meaning: "çöktü/bereket",      points: 1 },
      { arabic: "وتر",   meaning: "tek (sayı)",         points: 1 },
    ],
  },
  {
    id: 8,
    centerLetter: "ص",
    outerLetters: ["ب", "ر", "ا", "ل", "ح", "و"],
    difficulty: "hard",
    pangram: "صلاحب",
    validWords: [
      { arabic: "صبر",   meaning: "sabır",              points: 1 },
      { arabic: "صلاح",  meaning: "ıslah/barış",        points: 2 },
      { arabic: "صالح",  meaning: "Salih (iyilik)",     points: 2 },
      { arabic: "صاحب",  meaning: "sahip/arkadaş",      points: 2 },
      { arabic: "صور",   meaning: "sûr/şekil",         points: 1 },
      { arabic: "صبح",   meaning: "sabah",              points: 1 },
      { arabic: "صلوا",  meaning: "namaz kıldılar",     points: 2 },
      { arabic: "حرص",   meaning: "hırs/arzulama",      points: 1 },
      { arabic: "صرح",   meaning: "saray/açıkça",       points: 1 },
    ],
  },
];

// ── Server Function ───────────────────────────────────────

export const getHexagonPuzzle = createServerFn({ method: "GET" })
  .inputValidator((puzzleId: number) => puzzleId)
  .handler(async ({ data: puzzleId }) => {
    // Statik bulmacadan döndür (DB boşken de çalışır)
    const puzzle = STATIC_PUZZLES.find((p) => p.id === puzzleId) ?? STATIC_PUZZLES[0];
    return puzzle;
  });

export const validateHexWord = createServerFn({ method: "GET" })
  .inputValidator((input: { word: string; puzzleId: number }) => input)
  .handler(async ({ data: { word, puzzleId } }) => {
    const puzzle = STATIC_PUZZLES.find((p) => p.id === puzzleId);
    if (!puzzle) return { valid: false, points: 0 };

    const normalized = normalizeAr(word);
    const allLetters = new Set([puzzle.centerLetter, ...puzzle.outerLetters]);

    if (!hasCenterLetter(normalized, puzzle.centerLetter)) {
      return { valid: false, reason: "Merkez harf kullanılmadı", points: 0 };
    }
    if (!isWordValid(normalized, allLetters)) {
      return { valid: false, reason: "Geçersiz harf", points: 0 };
    }
    if (normalized.length < 3) {
      return { valid: false, reason: "En az 3 harf gerekli", points: 0 };
    }

    // Önceden tanımlı kelimede mi?
    const found = puzzle.validWords.find((w) => normalizeAr(w.arabic) === normalized);
    if (found) {
      return { valid: true, points: found.points, meaning: found.meaning };
    }

    // DB'de var mı kontrol et
    try {
      const [row] = await db
        .select({ textUthmani: words.textUthmani })
        .from(words)
        .where(and(
          eq(words.charType, "word"),
          sql`replace(replace(replace(replace(replace(lower(${words.textUthmani}), char(0x064b),''), char(0x064c),''), char(0x064d),''), char(0x064e),''), char(0x064f),'') = ${normalized}`,
        ))
        .limit(1);

      if (row) {
        const pts = calcPoints(normalized, allLetters);
        return { valid: true, points: pts, meaning: null };
      }
    } catch {
      // DB sorgusu başarısız olursa ses çıkarma
    }

    return { valid: false, reason: "Kuran'da bu kelime bulunamadı", points: 0 };
  });
