/**
 * Ayet sonu işareti — geleneksel mushaf madalyonu.
 * Tırtıllı (scalloped) kenar + altın gradient dolgu + Arap-Hint rakamı.
 */

interface VerseEndMarkerProps {
  ayahNumber: number;
  onClick?: (e: React.MouseEvent) => void;
  /** "inline" for flowing text, "block" for WBW grid */
  variant?: "inline" | "block";
  /** Size in px (default 28 for inline, 32 for block) */
  size?: number;
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[+d]);
}

/** Tırtıllı (scalloped) rozet SVG path'i üretir. */
function scallopedPath(cx: number, cy: number, outerR: number, innerR: number, N: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < N * 2; i++) {
    const angle = (Math.PI * i) / N - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  // Smooth scalloped path: midpoint-quadratic bezier zinciri
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
      } items-center justify-center cursor-pointer group/marker transition-transform hover:scale-110 active:scale-95 shrink-0`}
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
            <stop offset="0%"   stopColor="var(--marker-g1, #d4a24e)" />
            <stop offset="55%"  stopColor="var(--marker-g2, #b8860b)" />
            <stop offset="100%" stopColor="var(--marker-g3, #7a5800)" />
          </radialGradient>
        </defs>

        {/* Tırtıllı rozet gövdesi */}
        <path
          d={rosetteD}
          fill={`url(#${gradId})`}
          className="group-hover/marker:brightness-110 transition-[filter]"
        />

        {/* Ayet numarası — açık krem/beyaz */}
        <text
          x={mid}
          y={mid}
          dy="0.38em"
          textAnchor="middle"
          fill="var(--marker-text, #fdf3d8)"
          style={{
            fontFamily: "var(--font-arabic)",
            fontSize: `${fontSize}px`,
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
