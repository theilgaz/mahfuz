/**
 * Tecvidli HTML metnini React elementlerine dönüştürür.
 *
 * API formatı: <tajweed class=RULE_NAME>harfler</tajweed>
 * Çıktı:       <span className="tajweed-RULE_NAME">harfler</span>
 */

import type { ReactNode } from "react";

// <tajweed class=XYZ>...</tajweed> eşleştirici
const TAJWEED_RE = /<tajweed class=([a-z_]+)>([^<]*)<\/tajweed>/g;

/**
 * Tecvidli HTML string'ini React elementlerine parse eder.
 * showTajweed=false ise sadece düz metni döner (renksiz).
 */
export function parseTajweed(html: string, showTajweed: boolean): ReactNode[] {
  if (!showTajweed) {
    // Tag'ları soyup düz metin döndür
    return [html.replace(/<\/?tajweed[^>]*>/g, "")];
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TAJWEED_RE.lastIndex = 0;
  while ((match = TAJWEED_RE.exec(html)) !== null) {
    // Tag'dan önceki düz metin
    if (match.index > lastIndex) {
      parts.push(html.slice(lastIndex, match.index));
    }

    const rule = match[1];
    const text = match[2];
    parts.push(
      <span key={key++} className={`tajweed-${rule}`}>
        {text}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Kalan düz metin
  if (lastIndex < html.length) {
    parts.push(html.slice(lastIndex));
  }

  return parts;
}
