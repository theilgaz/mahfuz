/**
 * Ayet sonu işareti — geleneksel mushaf madalyonu.
 * Dış halka + iç daire + 4 yön noktası (N/E/S/W) + Arap-Hint rakamı.
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

export function VerseEndMarker({
  ayahNumber,
  onClick,
  variant = "inline",
  size: sizeProp,
}: VerseEndMarkerProps) {
  const size = sizeProp ?? (variant === "block" ? 32 : 28);
  const mid = size / 2;

  const R = mid * 0.86;             // dış halka yarıçapı
  const r = mid * 0.58;             // iç daire yarıçapı
  const r_dec = (R + r) / 2;        // yön noktalarının oturduğu yarıçap
  const dec_r = (R - r) * 0.38;     // yön noktası yarıçapı

  const digits = String(ayahNumber).length;
  const fontSize = digits >= 3 ? size * 0.24 : digits === 2 ? size * 0.28 : size * 0.30;

  // 4 yön noktası: K / D / G / B
  const cardinals = [
    { cx: mid,        cy: mid - r_dec },  // Kuzey
    { cx: mid + r_dec, cy: mid },         // Doğu
    { cx: mid,        cy: mid + r_dec },  // Güney
    { cx: mid - r_dec, cy: mid },         // Batı
  ];

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
        {/* Dış halka */}
        <circle
          cx={mid}
          cy={mid}
          r={R}
          stroke="var(--color-text-secondary)"
          strokeWidth="0.75"
          fill="none"
          opacity="0.5"
          className="group-hover/marker:opacity-75 transition-opacity"
        />

        {/* 4 yön noktası */}
        {cardinals.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={dec_r}
            fill="var(--color-text-secondary)"
            opacity="0.45"
            className="group-hover/marker:opacity-70 transition-opacity"
          />
        ))}

        {/* İç daire — sayı zemini */}
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="var(--color-text-secondary)"
          fillOpacity="0.07"
        />

        {/* Ayet numarası — Arap-Hint rakamı */}
        <text
          x={mid}
          y={mid}
          dy="0.38em"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          style={{
            fontFamily: "var(--font-arabic)",
            fontSize: `${fontSize}px`,
            fontWeight: 500,
          }}
          className="group-hover/marker:fill-[var(--color-text-primary)] transition-colors select-none"
        >
          {toArabicIndic(ayahNumber)}
        </text>
      </svg>
    </button>
  );
}
