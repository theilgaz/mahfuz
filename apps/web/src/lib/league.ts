/**
 * Lig sistemi — saf yardımcılar.
 * Tüm zamanlar global toplam (SUM) skoruna göre 4 lig hesaplanır.
 * Sezon adları Gregorian + Hicri ay (islamic-umalqura takvimi) ile üretilir.
 */

export type League = "bronz" | "gumus" | "altin" | "hafiz";

export const LEAGUE_ORDER: League[] = ["bronz", "gumus", "altin", "hafiz"];

export const LEAGUE_THRESHOLDS: Record<League, number> = {
  bronz: 0,
  gumus: 500,
  altin: 3000,
  hafiz: 10000,
};

export const LEAGUE_LABELS: Record<League, string> = {
  bronz: "Bronz",
  gumus: "Gümüş",
  altin: "Altın",
  hafiz: "Hafız",
};

export const LEAGUE_COLORS: Record<League, string> = {
  bronz: "#b87333",
  gumus: "#a8a8a8",
  altin: "#d4a437",
  hafiz: "#10a87a",
};

export function computeLeague(totalScore: number): League {
  if (totalScore >= LEAGUE_THRESHOLDS.hafiz) return "hafiz";
  if (totalScore >= LEAGUE_THRESHOLDS.altin) return "altin";
  if (totalScore >= LEAGUE_THRESHOLDS.gumus) return "gumus";
  return "bronz";
}

export function nextLeague(current: League): League | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx < 0 || idx >= LEAGUE_ORDER.length - 1) return null;
  return LEAGUE_ORDER[idx + 1];
}

/** Bir üst lig (Hafız zaten en üst → null). */
export function promoteLeague(current: League): League | null {
  return nextLeague(current);
}

/** Bir alt lig (Bronz zaten en alt → null). */
export function demoteLeague(current: League): League | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return LEAGUE_ORDER[idx - 1];
}

/** Bir lig'e güvenle string cast (geçersizse fallback'e döner). */
export function asLeague(value: string | null | undefined, fallback: League = "bronz"): League {
  return LEAGUE_ORDER.includes(value as League) ? (value as League) : fallback;
}

/**
 * Sezon hareket politikası — kaç kişi terfi/tenzil edilecek?
 * Aktif (sezonda oynamış) oyuncu sayısına göre değişir.
 */
export interface MovementPolicy {
  promote: number;
  demote: number;
}

export function movementCount(activeCount: number): MovementPolicy {
  if (activeCount < 3) return { promote: 0, demote: 0 };
  if (activeCount < 6) return { promote: 1, demote: 1 };
  return { promote: 3, demote: 3 };
}

export interface LeagueProgress {
  league: League;
  next: League | null;
  current: number;
  floor: number;
  ceiling: number | null;
  toNext: number | null;
  ratio: number;
}

export function leagueProgress(totalScore: number): LeagueProgress {
  const league = computeLeague(totalScore);
  const next = nextLeague(league);
  const floor = LEAGUE_THRESHOLDS[league];
  const ceiling = next ? LEAGUE_THRESHOLDS[next] : null;
  const span = ceiling != null ? ceiling - floor : null;
  const inLeague = totalScore - floor;
  const ratio = span != null ? Math.min(1, inLeague / span) : 1;
  const toNext = ceiling != null ? Math.max(0, ceiling - totalScore) : null;
  return { league, next, current: totalScore, floor, ceiling, toNext, ratio };
}

// ── Sezonlar ─────────────────────────────────────────────────

export type SeasonKey = string; // "2026-04" formatında

export function seasonKeyFor(date: Date = new Date()): SeasonKey {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function seasonRange(key: SeasonKey): { startedAt: number; endedAt: number } {
  const [y, m] = key.split("-").map(Number);
  const startedAt = Date.UTC(y, m - 1, 1, 0, 0, 0, 0);
  const endedAt = Date.UTC(y, m, 1, 0, 0, 0, 0); // exclusive — next month start
  return { startedAt, endedAt };
}

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/**
 * Sezon adı: "Nisan 2026 - Şevval 1447" formatında.
 * Hicri ay, Gregorian ayın 15'indeki Hicri ayı baskın kabul eder (sıfır bağımlılık).
 */
export function formatSeasonName(key: SeasonKey): string {
  const [y, m] = key.split("-").map(Number);
  const greg = `${TR_MONTHS[m - 1]} ${y}`;
  const mid = new Date(Date.UTC(y, m - 1, 15));
  let hijri = "";
  try {
    const fmt = new Intl.DateTimeFormat("tr-u-ca-islamic-umalqura", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    hijri = fmt.format(mid).replace(/\u00a0/g, " ").trim();
  } catch {
    hijri = "";
  }
  return hijri ? `${greg} - ${hijri}` : greg;
}
