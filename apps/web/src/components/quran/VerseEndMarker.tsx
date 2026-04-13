/**
 * Ayet sonu işareti — geleneksel mushaf madalyonu.
 * Tırtıllı (scalloped) kenar + altın gradient dolgu + Arap-Hint rakamı.
 */

import { scallopedPath, toArabicIndic } from "~/lib/svg-helpers";

interface VerseEndMarkerProps {
  ayahNumber: number;
  onClick?: (e: React.MouseEvent) => void;
  /** "inline" for flowing text, "block" for WBW grid */
  variant?: "inline" | "block";
  /** Size in px (default 28 for inline, 32 for block) */
  size?: number;
}

export function VerseEndMarker({
  ayahNumber,
  onClick,
  variant = "inline",
  size: sizeProp,
}: VerseEndMarkerProps) {
  const size = sizeProp ?? (variant === "block" ? 32 : 28);
  const mid = size / 2;

  const outerR = mid * 0.90;
  const innerR = mid * 0.72;
  const rosetteD = scallopedPath(mid, mid, outerR, innerR, 14);

  const digits = String(ayahNumber).length;
  const fontSize = digits >= 3 ? size * 0.26 : digits === 2 ? size * 0.30 : size * 0.34;

  const gradId = `vmg-${ayahNumber}`;

  return (
    <button
      onClick={onClick}
      className={`${
        variant === "inline"
          ? "inline-flex mx-0.5 align-middle"
          : "flex"
      } items-center justify-center cursor-pointer group/marker shrink-0`}
      style={{ width: size, height: size }}
      aria-label={`Ayet ${ayahNumber}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradId} cx="38%" cy="35%" r="65%" fx="38%" fy="35%">
            <stop offset="0%"   style={{ stopColor: "var(--marker-g1, #d4a24e)" }} />
            <stop offset="55%"  style={{ stopColor: "var(--marker-g2, #b8860b)" }} />
            <stop offset="100%" style={{ stopColor: "var(--marker-g3, #7a5800)" }} />
          </radialGradient>
        </defs>

        {/* Tırtıllı rozet gövdesi */}
        <path
          d={rosetteD}
          fill={`url(#${gradId})`}
          className="group-hover/marker:brightness-110 transition-[filter]"
        />

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
          {ayahNumber}
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
          {toArabicIndic(ayahNumber)}
        </text>
      </svg>
    </button>
  );
}
