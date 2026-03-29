/**
 * Dekoratif ayet sonu işareti — Selçuklu yıldızı (8 köşeli) içinde ayet numarası.
 * İki kare 45° döndürülerek üst üste bindirilir, iç daire + numara.
 * Minimal tek katman tasarım.
 */

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
  const r = mid * 0.68; // square half-side
  const d = r * Math.SQRT2; // rotated square vertex distance

  const digits = String(ayahNumber).length;
  const fontSize = digits >= 3 ? size * 0.27 : size * 0.33;

  // Square 1: axis-aligned
  const sq1 = `M${mid - r},${mid - r} L${mid + r},${mid - r} L${mid + r},${mid + r} L${mid - r},${mid + r}Z`;
  // Square 2: rotated 45°
  const sq2 = `M${mid},${mid - d} L${mid + d},${mid} L${mid},${mid + d} L${mid - d},${mid}Z`;

  return (
    <button
      onClick={onClick}
      className={`${
        variant === "inline"
          ? "inline-flex mx-0.5 align-middle"
          : "flex"
      } items-center justify-center cursor-pointer group/marker transition-transform hover:scale-110 active:scale-95 shrink-0`}
      style={{ width: size, height: size }}
      aria-label={`Ayet ${ayahNumber} eylemleri`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Two overlapping squares = 8-pointed star */}
        <path
          d={`${sq1} ${sq2}`}
          stroke="var(--color-text-secondary)"
          strokeWidth="0.9"
          strokeLinejoin="miter"
          fill="none"
          opacity="0.5"
          className="group-hover/marker:opacity-80 transition-opacity"
        />

        {/* Verse number */}
        <text
          x={mid}
          y={mid}
          dy="0.36em"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: `${fontSize}px`,
            fontWeight: 600,
          }}
          className="group-hover/marker:fill-[var(--color-text-primary)] transition-colors select-none"
        >
          {ayahNumber}
        </text>
      </svg>
    </button>
  );
}
