/**
 * Sure slug'ları — SEO-uyumlu URL'ler için.
 * nameSimple'dan türetilmiş, lowercase, tire ile ayrılmış.
 */

const SLUGS: readonly string[] = [
  "al-fatiha","al-baqarah","ali-imran","an-nisa","al-maidah","al-anam",
  "al-araf","al-anfal","at-tawbah","yunus","hud","yusuf",
  "ar-rad","ibrahim","al-hijr","an-nahl","al-isra","al-kahf",
  "maryam","taha","al-anbiya","al-hajj","al-muminun","an-nur",
  "al-furqan","ash-shuara","an-naml","al-qasas","al-ankabut","ar-rum",
  "luqman","as-sajdah","al-ahzab","saba","fatir","ya-sin",
  "as-saffat","sad","az-zumar","ghafir","fussilat","ash-shura",
  "az-zukhruf","ad-dukhan","al-jathiyah","al-ahqaf","muhammad","al-fath",
  "al-hujurat","qaf","adh-dhariyat","at-tur","an-najm","al-qamar",
  "ar-rahman","al-waqiah","al-hadid","al-mujadila","al-hashr","al-mumtahanah",
  "as-saf","al-jumuah","al-munafiqun","at-taghabun","at-talaq","at-tahrim",
  "al-mulk","al-qalam","al-haqqah","al-maarij","nuh","al-jinn",
  "al-muzzammil","al-muddaththir","al-qiyamah","al-insan","al-mursalat","an-naba",
  "an-naziat","abasa","at-takwir","al-infitar","al-mutaffifin","al-inshiqaq",
  "al-buruj","at-tariq","al-ala","al-ghashiyah","al-fajr","al-balad",
  "ash-shams","al-layl","ad-duha","ash-sharh","at-tin","al-alaq",
  "al-qadr","al-bayyinah","az-zalzalah","al-adiyat","al-qariah","at-takathur",
  "al-asr","al-humazah","al-fil","quraysh","al-maun","al-kawthar",
  "al-kafirun","an-nasr","al-masad","al-ikhlas","al-falaq","an-nas",
];

/** Surah ID (1-114) → slug */
export function surahSlug(id: number): string {
  return SLUGS[id - 1] ?? String(id);
}

/** Slug → Surah ID (1-114), or undefined if not found */
export function surahIdFromSlug(slug: string): number | undefined {
  const idx = SLUGS.indexOf(slug.toLowerCase());
  return idx >= 0 ? idx + 1 : undefined;
}

/** Check if a string is a valid surah slug */
export function isValidSurahSlug(slug: string): boolean {
  return SLUGS.includes(slug.toLowerCase());
}
