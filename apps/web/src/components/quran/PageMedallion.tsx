/**
 * Sayfa numarası madalyonu — mushaf sayfasının üstünde
 * dekoratif rozet içinde Arap-Hint rakamlarıyla sayfa numarası.
 */

import { scallopedPath, toArabicIndic } from "~/lib/svg-helpers";

interface PageMedallionProps {
  pageNumber: number;
  /** Boyut (px), varsayılan 44 */
  size?: number;
}

export function PageMedallion({ pageNumber, size = 44 }: PageMedallionProps) {
  const mid = size / 2;
  const outerR = mid * 0.92;
  const innerR = mid * 0.74;
  const rosetteD = scallopedPath(mid, mid, outerR, innerR, 16);

  const digits = String(pageNumber).length;
  const fontSize = digits >= 3 ? size * 0.28 : digits === 2 ? size * 0.32 : size * 0.36;

  const gradId = `pmg-${pageNumber}`;

  return (
    <div className="flex justify-center py-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Sayfa ${pageNumber}`}
        role="img"
      >
        <defs>
          <radialGradient id={gradId} cx="38%" cy="35%" r="65%" fx="38%" fy="35%">
            <stop offset="0%" style={{ stopColor: "var(--marker-g1, #d4a24e)" }} />
            <stop offset="55%" style={{ stopColor: "var(--marker-g2, #b8860b)" }} />
            <stop offset="100%" style={{ stopColor: "var(--marker-g3, #7a5800)" }} />
          </radialGradient>
        </defs>

        {/* Tırtıklı rozet gövdesi */}
        <path d={rosetteD} fill={`url(#${gradId})`} />

        {/* Latin numara — üstte */}
        <text
          x={mid}
          y={mid * 0.68}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: "var(--marker-text, #fdf3d8)",
            fontFamily: "var(--font-ui)",
            fontSize: `${fontSize * 0.7}px`,
            fontWeight: 700,
            opacity: 0.5,
          }}
          className="select-none"
        >
          {pageNumber}
        </text>

        {/* Arapça numara — altta */}
        <text
          x={mid}
          y={mid * 1.2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: "var(--marker-text, #fdf3d8)",
            fontFamily: "var(--font-arabic)",
            fontSize: `${fontSize * 0.9}px`,
            fontWeight: 700,
          }}
          className="select-none"
        >
          {toArabicIndic(pageNumber)}
        </text>
      </svg>
    </div>
  );
}
