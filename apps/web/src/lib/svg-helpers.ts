/**
 * Ortak SVG yardımcı fonksiyonları.
 * VerseEndMarker, PageMedallion vb. bileşenler tarafından kullanılır.
 */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** Sayıyı Arap-Hint rakamlarına çevirir (1 → ١, 27 → ٢٧). */
export function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[+d]);
}

/** Arap-Hint rakamlarını sayıya çevirir (٢٧ → 27). */
export function fromArabicIndic(s: string): number {
  return parseInt(s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String(ARABIC_INDIC.indexOf(d))), 10);
}

/** Tırtıllı (scalloped) rozet SVG path'i üretir. */
export function scallopedPath(cx: number, cy: number, outerR: number, innerR: number, N: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < N * 2; i++) {
    const angle = (Math.PI * i) / N - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const last = pts[pts.length - 1];
  const first = pts[0];
  let d = `M ${(last[0] + first[0]) / 2} ${(last[1] + first[1]) / 2}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    d += ` Q ${p[0]} ${p[1]} ${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2}`;
  }
  return d + " Z";
}
