/**
 * Diyanet imlâî metinden Scheherazade New'de düzgün render olmayan
 * özel işaretleri temizler/dönüştürür.
 */

// 1) ۪ (U+06EA, Small High Noon) → kesra (ِ U+0650) olarak değiştir
//    Diyanet metni bunu kesra benzeri işaret olarak kullanıyor (örn. وَالْاِنْج۪يلَ)
const DIYANET_KASRA_RE = /\u06EA/g;

// 2) Kaldırılacak işaretler:
//    - Hemze üstü (ٔ U+0654), hemze altı (ٕ U+0655)
//    - Secavend/durma işaretleri (U+06D6-U+06E1)
//    - Diyanet vakıf işaretleri: ۙ U+06D9, ۚ U+06DA, ۛ U+06DB, ۜ U+06DC
//    - Küçük yüksek mim (ۢ U+06E2)
//    NOT: Küçük elif (ٰ U+0670) korunuyor — إلٰه gibi kelimelerde gerekli
const IMLAEI_CLEANUP_RE = /[\u0654\u0655\u06D6-\u06E2]/g;

export function cleanImlaei(text: string): string {
  return text.replace(DIYANET_KASRA_RE, "\u0650").replace(IMLAEI_CLEANUP_RE, "");
}
