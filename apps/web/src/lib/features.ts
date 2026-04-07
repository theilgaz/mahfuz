/**
 * Feature flag sistemi — premium özellikler için.
 * Ücretsiz / Premium ayrımını tek yerden yönetir.
 */

export const PREMIUM_FEATURES = [
  "all_games",           // Tüm oyunlar (ücretsizde 3)
  "group_hatim",         // Hatim grubu oluştur + katıl
  "verse_analysis",      // Ayet tahlili tam (tefsir dahil)
  "tafsir",              // Tefsir erişimi
  "thematic_links",      // Tematik bağlantılar + benzer ayet
  "offline_audio",       // Tam audio indirme
  "recitation_grading",  // Kıraet tecvid puanlama
  "tajweed_lessons",     // Tecvid ders paketi tam
  "unlimited_hifz",      // Sınırsız sure hıfz (ücretsizde 3)
  "multi_device_sync",   // Çoklu cihaz sync
  "meal_comparison",     // Meal karşılaştırma (ücretsizde 1)
  "ai_assistant",        // AI asistan
  "daily_challenge",     // Günlük oyun challenge'ı
  "family_plan",         // Aile planı özellikleri
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

export const FREE_GAME_LIMIT = 3;
export const FREE_HIFZ_LIMIT = 3;
export const FREE_TRANSLATION_LIMIT = 1;

/**
 * Kullanıcının belirli bir premium özelliğe erişimi var mı?
 * Şimdilik tüm özellikler açık — ödeme sistemi entegre edilince gerçek kontrol başlar.
 */
export function isFeatureEnabled(_feature: PremiumFeature, isPremium = false): boolean {
  // TODO: Lemon Squeezy entegrasyonu tamamlanınca aktif edilecek
  // return isPremium;
  return true; // Geliştirme aşamasında her şey açık
}

/**
 * Hook kullanımı için: useFeatureFlag("all_games")
 * Zustand subscription store ile bağlantılı olacak.
 */
export function createFeatureChecker(isPremium: boolean) {
  return (feature: PremiumFeature): boolean => isFeatureEnabled(feature, isPremium);
}
