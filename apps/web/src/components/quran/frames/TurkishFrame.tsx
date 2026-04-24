/**
 * Türk Mushafı çerçevesi - Diyanet stili.
 * Sade geometrik çizgiler, ince kırmızı hat, minimal ama zarif.
 */

interface TurkishFrameProps {
  surahName?: string;
  juzInfo?: string;
  pageNumber?: number;
}

export function TurkishFrame({ surahName, juzInfo, pageNumber }: TurkishFrameProps) {
  return (
    <svg
      viewBox="0 0 1000 1470"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arka plan */}
      <rect width="1000" height="1470" fill="var(--mushaf-bg, #fffef8)" rx="3" />

      {/* Dış çerçeve - ince kırmızı */}
      <rect
        x="20" y="20" width="960" height="1430" rx="2"
        stroke="var(--frame-primary, #8b2020)"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* İç çerçeve - altın */}
      <rect
        x="30" y="30" width="940" height="1410" rx="1"
        stroke="var(--frame-secondary, #b8860b)"
        strokeWidth="0.6"
        opacity="0.2"
      />

      {/* Üçüncü ince çizgi */}
      <rect
        x="36" y="36" width="928" height="1398" rx="1"
        stroke="var(--frame-primary, #8b2020)"
        strokeWidth="0.3"
        opacity="0.15"
      />

      {/* Kose kareleri - geometrik */}
      {[
        { x: 22, y: 22 },
        { x: 968, y: 22 },
        { x: 22, y: 1438 },
        { x: 968, y: 1438 },
      ].map((pos, i) => (
        <g key={i}>
          <rect
            x={pos.x - 5} y={pos.y - 5}
            width="10" height="10"
            fill="var(--frame-primary, #8b2020)"
            opacity="0.12"
          />
          <rect
            x={pos.x - 3} y={pos.y - 3}
            width="6" height="6"
            fill="none"
            stroke="var(--frame-secondary, #b8860b)"
            strokeWidth="0.5"
            opacity="0.25"
          />
        </g>
      ))}

      {/* Üst bant - sade çizgi */}
      <line x1="38" y1="66" x2="962" y2="66"
        stroke="var(--frame-primary, #8b2020)"
        strokeWidth="0.8"
        opacity="0.25"
      />
      <line x1="38" y1="68" x2="962" y2="68"
        stroke="var(--frame-secondary, #b8860b)"
        strokeWidth="0.3"
        opacity="0.15"
      />

      {/* Üst bant içerik */}
      <rect
        x="50" y="24" width="900" height="38" rx="2"
        fill="var(--frame-primary, #8b2020)"
        opacity="0.03"
      />

      {surahName && (
        <text
          x="920" y="50"
          textAnchor="end"
          style={{
            fill: "var(--frame-primary, #8b2020)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: "17px",
            opacity: 0.6,
          }}
          direction="rtl"
        >
          {surahName}
        </text>
      )}

      {juzInfo && (
        <text
          x="80" y="50"
          textAnchor="start"
          style={{
            fill: "var(--frame-primary, #8b2020)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: "15px",
            opacity: 0.5,
          }}
          direction="rtl"
        >
          {juzInfo}
        </text>
      )}

      {/* Alt bant */}
      <line x1="38" y1="1404" x2="962" y2="1404"
        stroke="var(--frame-primary, #8b2020)"
        strokeWidth="0.8"
        opacity="0.25"
      />
      <line x1="38" y1="1406" x2="962" y2="1406"
        stroke="var(--frame-secondary, #b8860b)"
        strokeWidth="0.3"
        opacity="0.15"
      />

      {pageNumber != null && (
        <text
          x="500" y="1430"
          textAnchor="middle"
          style={{
            fill: "var(--frame-primary, #8b2020)",
            fontFamily: "var(--font-ui, system-ui)",
            fontSize: "15px",
            fontWeight: 500,
            opacity: 0.5,
          }}
        >
          {pageNumber}
        </text>
      )}
    </svg>
  );
}
