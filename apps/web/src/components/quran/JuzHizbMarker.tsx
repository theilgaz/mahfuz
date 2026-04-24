/**
 * Cuz / Hizb sinir isareti - mushaf kenarinda madalyon.
 */

import { scallopedPath, toArabicIndic } from "~/lib/svg-helpers";

interface JuzHizbMarkerProps {
  juzNumber: number;
  size?: number;
}

export function JuzHizbMarker({ juzNumber, size = 36 }: JuzHizbMarkerProps) {
  const mid = size / 2;
  const outerR = mid * 0.88;
  const innerR = mid * 0.70;
  const rosetteD = scallopedPath(mid, mid, outerR, innerR, 12);

  return (
    <div className="flex justify-center py-0.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Cuz ${juzNumber}`}
        role="img"
      >
        {/* Rozet govdesi */}
        <path
          d={rosetteD}
          fill="var(--frame-primary, #b8860b)"
          opacity="0.15"
        />
        <path
          d={rosetteD}
          fill="none"
          stroke="var(--frame-primary, #b8860b)"
          strokeWidth="0.6"
          opacity="0.3"
        />

        {/* Cuz etiketi */}
        <text
          x={mid}
          y={mid * 0.65}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: "var(--frame-primary, #b8860b)",
            fontFamily: "var(--font-ui)",
            fontSize: `${size * 0.18}px`,
            fontWeight: 600,
            opacity: 0.5,
          }}
          className="select-none"
        >
          JUZ
        </text>

        {/* Cüz numarası */}
        <text
          x={mid}
          y={mid * 1.3}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: "var(--frame-primary, #b8860b)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: `${size * 0.3}px`,
            fontWeight: 700,
            opacity: 0.7,
          }}
          className="select-none"
        >
          {toArabicIndic(juzNumber)}
        </text>
      </svg>
    </div>
  );
}
