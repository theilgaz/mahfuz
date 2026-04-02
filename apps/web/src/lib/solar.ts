/**
 * Gün doğumu / batımı hesaplama — saf matematik, dış bağımlılık yok.
 * NOAA sunrise equation algoritması (Wikipedia). Doğruluk: ±1 dakika.
 */

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/**
 * Verilen konum ve tarih için gün doğumu/batımı UTC zamanlarını döndürür.
 * Kutup günü/gecesi durumunda (güneş hiç doğmaz/batmaz) null döner.
 */
export function getSunTimes(
  lat: number,
  lon: number,
  date: Date = new Date(),
): SunTimes | null {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const sin = (d: number) => Math.sin(d * rad);
  const cos = (d: number) => Math.cos(d * rad);
  const asin = (x: number) => Math.asin(x) * deg;

  // Julian date
  const jd = date.getTime() / 86_400_000 + 2_440_587.5;
  const n = Math.ceil(jd - 2_451_545.0 + 0.0008);

  // Approximate solar noon — Julian day fraction shifted by longitude
  const Jstar = n - lon / 360;

  // Solar mean anomaly (degrees)
  const M = ((357.5291 + 0.98560028 * Jstar) % 360 + 360) % 360;

  // Equation of center
  const C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);

  // Solar mean longitude (for transit correction)
  const Lsun = ((280.46 + 0.9856474 * Jstar) % 360 + 360) % 360;

  // Ecliptic longitude
  const λ = ((Lsun + C) % 360 + 360) % 360;

  // Solar transit (Julian date of solar noon)
  const Jtransit =
    2_451_545.0 + Jstar + 0.0053 * sin(M) - 0.0069 * sin(2 * λ);

  // Declination
  const δ = asin(sin(23.4392) * sin(λ));

  // Hour angle — elevation −0.833° accounts for atmospheric refraction + solar disc
  const cosω =
    (sin(-0.833) - sin(lat) * sin(δ)) / (cos(lat) * cos(δ));

  if (cosω < -1 || cosω > 1) return null; // kutup günü veya gecesi

  const ω = (Math.acos(cosω) * deg + 360) % 360;

  const Jrise = Jtransit - ω / 360;
  const Jset = Jtransit + ω / 360;

  const toDate = (jd: number) => new Date((jd - 2_440_587.5) * 86_400_000);

  return { sunrise: toDate(Jrise), sunset: toDate(Jset) };
}

/**
 * Bugün veya yarın için gün doğumu/batımı zamanlarını döndürür.
 * Kutup durumu için güvenli fallback sağlar.
 */
export function getSeherTimes(
  lat: number,
  lon: number,
): { sunrise: Date; sunset: Date } {
  const today = new Date();
  const times = getSunTimes(lat, lon, today);
  if (times) return times;

  // Kutup durumu — sabit 06:00 / 20:00 yerel saatte fallback
  const fallback = new Date(today);
  fallback.setHours(6, 0, 0, 0);
  const fallbackSunset = new Date(today);
  fallbackSunset.setHours(20, 0, 0, 0);
  return { sunrise: fallback, sunset: fallbackSunset };
}

/**
 * Şu an gündüz mü? (gün doğumu ≤ now < gün batımı)
 */
export function isDaytime(lat: number, lon: number): boolean {
  const { sunrise, sunset } = getSeherTimes(lat, lon);
  const now = Date.now();
  return now >= sunrise.getTime() && now < sunset.getTime();
}

/**
 * Sonraki geçiş zamanı: gündüzse → gün batımına, geceyse → yarın gün doğumuna.
 */
export function nextTransition(lat: number, lon: number): Date {
  const now = new Date();
  const { sunrise, sunset } = getSeherTimes(lat, lon);

  if (Date.now() < sunrise.getTime()) return sunrise;
  if (Date.now() < sunset.getTime()) return sunset;

  // Gün batımı geçti — yarının gün doğumu
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = getSunTimes(lat, lon, tomorrow);
  if (tomorrowTimes) return tomorrowTimes.sunrise;

  // Fallback: yarın 06:00
  const fallback = new Date(tomorrow);
  fallback.setHours(6, 0, 0, 0);
  return fallback;
}
