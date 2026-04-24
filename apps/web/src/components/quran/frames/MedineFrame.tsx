/**
 * Medine Mushafı çerçevesi - Kral Fahd Kompleksi stili.
 * Altın tonlarında ornamental border, köşe süslemeleri,
 * üst/alt bantlar. Tamamı vektör (SVG).
 */

interface MedineFrameProps {
  /** Üst bantta gösterilecek sure adı */
  surahName?: string;
  /** Üst bantta gösterilecek cüz bilgisi */
  juzInfo?: string;
  /** Alt bantta gösterilecek sayfa numarası */
  pageNumber?: number;
}

export function MedineFrame({ surahName, juzInfo, pageNumber }: MedineFrameProps) {
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
      <defs>
        {/* Kose susu motifi */}
        <g id="med-corner">
          <path
            d="M0,0 L40,0 C30,5 20,15 15,25 L15,40 C10,35 5,25 0,0Z"
            fill="var(--frame-primary, #b8860b)"
            opacity="0.6"
          />
          <path
            d="M0,0 L25,0 C18,4 12,12 10,18 L10,28 C6,22 3,14 0,0Z"
            fill="var(--frame-secondary, #c8a24e)"
            opacity="0.4"
          />
          {/* Kucuk yaprak */}
          <ellipse cx="12" cy="12" rx="4" ry="7" transform="rotate(-45 12 12)"
            fill="var(--frame-primary, #b8860b)" opacity="0.3" />
        </g>

        {/* Kenar susu tekrar birimi */}
        <pattern id="med-border-h" x="0" y="0" width="60" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0,6 Q15,0 30,6 Q45,12 60,6"
            stroke="var(--frame-primary, #b8860b)"
            strokeWidth="0.8"
            fill="none"
            opacity="0.35"
          />
          <circle cx="30" cy="6" r="1.5" fill="var(--frame-primary, #b8860b)" opacity="0.25" />
        </pattern>

        <pattern id="med-border-v" x="0" y="0" width="12" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M6,0 Q0,15 6,30 Q12,45 6,60"
            stroke="var(--frame-primary, #b8860b)"
            strokeWidth="0.8"
            fill="none"
            opacity="0.35"
          />
          <circle cx="6" cy="30" r="1.5" fill="var(--frame-primary, #b8860b)" opacity="0.25" />
        </pattern>

        {/* Ust bant kartus */}
        <clipPath id="med-header-clip">
          <rect x="100" y="18" width="800" height="48" rx="6" />
        </clipPath>

        {/* Rozet - bant merkezi */}
        <g id="med-rosette">
          <circle r="16" fill="var(--frame-primary, #b8860b)" opacity="0.15" />
          <circle r="12" fill="none" stroke="var(--frame-primary, #b8860b)" strokeWidth="0.6" opacity="0.3" />
          {/* 8 yaprakli rozet */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x = Math.cos(angle) * 8;
            const y = Math.sin(angle) * 8;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="3"
                ry="6"
                transform={`rotate(${i * 45} ${x} ${y})`}
                fill="var(--frame-primary, #b8860b)"
                opacity="0.12"
              />
            );
          })}
        </g>
      </defs>

      {/* === Arka plan === */}
      <rect width="1000" height="1470" fill="var(--mushaf-bg, #fdfcfa)" rx="4" />

      {/* === Dış çerçeve === */}
      <rect
        x="16" y="16" width="968" height="1438" rx="3"
        stroke="var(--frame-primary, #b8860b)"
        strokeWidth="2"
        opacity="0.4"
      />

      {/* === İç çerçeve === */}
      <rect
        x="28" y="28" width="944" height="1414" rx="2"
        stroke="var(--frame-primary, #b8860b)"
        strokeWidth="0.8"
        opacity="0.25"
      />

      {/* === Dekoratif kenar bantlari === */}
      {/* Ust yatay bant */}
      <rect x="40" y="68" width="920" height="12" fill="url(#med-border-h)" />
      {/* Alt yatay bant */}
      <rect x="40" y="1392" width="920" height="12" fill="url(#med-border-h)" />
      {/* Sol dikey bant */}
      <rect x="30" y="80" width="12" height="1310" fill="url(#med-border-v)" />
      {/* Sag dikey bant */}
      <rect x="958" y="80" width="12" height="1310" fill="url(#med-border-v)" />

      {/* === Köşe süslemeleri === */}
      {/* Sol-ust */}
      <use href="#med-corner" x="18" y="18" />
      {/* Sag-ust (yansitilmis) */}
      <use href="#med-corner" x="982" y="18" transform="scale(-1,1) translate(-1000,0)" />
      {/* Sol-alt (yansitilmis) */}
      <use href="#med-corner" x="18" y="1452" transform="scale(1,-1) translate(0,-1470)" />
      {/* Sag-alt (yansitilmis) */}
      <use href="#med-corner" x="982" y="1452" transform="scale(-1,-1) translate(-1000,-1470)" />

      {/* === Üst bant: Sure adı (sağ) + Cüz bilgisi (sol) === */}
      <rect
        x="50" y="22" width="900" height="42" rx="4"
        fill="var(--frame-primary, #b8860b)"
        opacity="0.06"
      />
      <line x1="50" y1="64" x2="950" y2="64"
        stroke="var(--frame-primary, #b8860b)"
        strokeWidth="0.5"
        opacity="0.3"
      />

      {/* Merkez rozet */}
      <use href="#med-rosette" x="500" y="43" />

      {/* Sure adi (sag) */}
      {surahName && (
        <text
          x="920"
          y="48"
          textAnchor="end"
          style={{
            fill: "var(--frame-primary, #b8860b)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: "18px",
            opacity: 0.7,
          }}
          direction="rtl"
        >
          {surahName}
        </text>
      )}

      {/* Cüz bilgisi (sol) */}
      {juzInfo && (
        <text
          x="80"
          y="48"
          textAnchor="start"
          style={{
            fill: "var(--frame-primary, #b8860b)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: "16px",
            opacity: 0.6,
          }}
          direction="rtl"
        >
          {juzInfo}
        </text>
      )}

      {/* === Alt bant: Sayfa numarası === */}
      <rect
        x="50" y="1408" width="900" height="38" rx="4"
        fill="var(--frame-primary, #b8860b)"
        opacity="0.04"
      />
      <line x1="50" y1="1408" x2="950" y2="1408"
        stroke="var(--frame-primary, #b8860b)"
        strokeWidth="0.5"
        opacity="0.3"
      />

      {pageNumber != null && (
        <text
          x="500"
          y="1433"
          textAnchor="middle"
          style={{
            fill: "var(--frame-primary, #b8860b)",
            fontFamily: "var(--font-ui, system-ui)",
            fontSize: "16px",
            fontWeight: 500,
            opacity: 0.6,
          }}
        >
          {pageNumber}
        </text>
      )}

      {/* === Metin alani ic golgesi === */}
      <rect
        x="44" y="68" width="912" height="1336" rx="1"
        fill="none"
        stroke="var(--frame-ornament, rgba(184,134,11,0.12))"
        strokeWidth="0.5"
        opacity="0.5"
      />
    </svg>
  );
}
