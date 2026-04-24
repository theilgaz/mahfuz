/**
 * Beyrut / Şam Mushafı çerçevesi.
 * Referans: Gerçek Beyrut-Şam mushafındaki kalın yeşil sarmaşık bordür,
 * belirgin yeşil dolgulu üst/alt bantlar, yaprak/dal motifleri.
 */

interface BeirutFrameProps {
  surahName?: string;
  juzInfo?: string;
  pageNumber?: number;
}

export function BeirutFrame({ surahName, juzInfo, pageNumber }: BeirutFrameProps) {
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
        {/* ── Sarmasik yaprak motifi (yatay tekrar) ── */}
        <pattern id="bei-vine-h" x="0" y="0" width="50" height="28" patternUnits="userSpaceOnUse">
          {/* Ana dal */}
          <path
            d="M0,14 C8,6 16,6 25,14 C34,22 42,22 50,14"
            stroke="var(--frame-primary, #1a6b3a)"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
          {/* Ust yapraklar */}
          <ellipse cx="12" cy="8" rx="5" ry="3" transform="rotate(-30 12 8)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.5" />
          <ellipse cx="37" cy="8" rx="5" ry="3" transform="rotate(30 37 8)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.5" />
          {/* Alt yapraklar */}
          <ellipse cx="25" cy="20" rx="4" ry="2.5" transform="rotate(15 25 20)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.4" />
          {/* Kucuk cicek/meyve */}
          <circle cx="25" cy="14" r="2" fill="var(--frame-accent, #c8a24e)" opacity="0.6" />
          <circle cx="0" cy="14" r="1.5" fill="var(--frame-accent, #c8a24e)" opacity="0.4" />
          <circle cx="50" cy="14" r="1.5" fill="var(--frame-accent, #c8a24e)" opacity="0.4" />
        </pattern>

        {/* ── Sarmasik yaprak motifi (dikey tekrar) ── */}
        <pattern id="bei-vine-v" x="0" y="0" width="28" height="50" patternUnits="userSpaceOnUse">
          {/* Ana dal */}
          <path
            d="M14,0 C6,8 6,16 14,25 C22,34 22,42 14,50"
            stroke="var(--frame-primary, #1a6b3a)"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
          {/* Sol yapraklar */}
          <ellipse cx="8" cy="12" rx="3" ry="5" transform="rotate(-30 8 12)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.5" />
          <ellipse cx="8" cy="37" rx="3" ry="5" transform="rotate(30 8 37)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.5" />
          {/* Sag yapraklar */}
          <ellipse cx="20" cy="25" rx="2.5" ry="4" transform="rotate(15 20 25)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.4" />
          {/* Kucuk cicek */}
          <circle cx="14" cy="25" r="2" fill="var(--frame-accent, #c8a24e)" opacity="0.6" />
        </pattern>

        {/* ── Kose susu ── */}
        <g id="bei-corner-ornament">
          {/* Buyuk yaprak kumesi */}
          <ellipse cx="0" cy="0" rx="18" ry="8" transform="rotate(-45)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.6" />
          <ellipse cx="0" cy="0" rx="14" ry="6" transform="rotate(-45)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.3" />
          <ellipse cx="5" cy="5" rx="12" ry="5" transform="rotate(-75 5 5)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.45" />
          <ellipse cx="-3" cy="8" rx="10" ry="4" transform="rotate(-20 -3 8)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.4" />
          <ellipse cx="8" cy="-3" rx="10" ry="4" transform="rotate(-70 8 -3)"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.4" />
          {/* Altin nokta */}
          <circle cx="3" cy="3" r="3" fill="var(--frame-accent, #c8a24e)" opacity="0.7" />
        </g>
      </defs>

      {/* === Arka plan: sıcak krem === */}
      <rect width="1000" height="1470" fill="var(--mushaf-bg, #f5f0e0)" rx="3" />

      {/* === Dış çerçeve - kalın yeşil === */}
      <rect
        x="10" y="10" width="980" height="1450" rx="4"
        stroke="var(--frame-primary, #1a6b3a)"
        strokeWidth="3"
        opacity="0.7"
      />

      {/* === İkinci çerçeve === */}
      <rect
        x="16" y="16" width="968" height="1438" rx="3"
        stroke="var(--frame-primary, #1a6b3a)"
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* === Sarmaşık bordür bandı - ÜST === */}
      <rect x="22" y="56" width="956" height="28" fill="url(#bei-vine-h)" />
      {/* Üst bordür üstünde ince altın çizgi */}
      <line x1="22" y1="55" x2="978" y2="55"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />
      <line x1="22" y1="85" x2="978" y2="85"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />

      {/* === Sarmaşık bordür bandı - ALT === */}
      <rect x="22" y="1386" width="956" height="28" fill="url(#bei-vine-h)" />
      <line x1="22" y1="1385" x2="978" y2="1385"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />
      <line x1="22" y1="1415" x2="978" y2="1415"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />

      {/* === Sarmaşık bordür bandı - SOL === */}
      <rect x="14" y="86" width="28" height="1298" fill="url(#bei-vine-v)" />
      <line x1="13" y1="86" x2="13" y2="1384"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />
      <line x1="43" y1="86" x2="43" y2="1384"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />

      {/* === Sarmaşık bordür bandı - SAĞ === */}
      <rect x="958" y="86" width="28" height="1298" fill="url(#bei-vine-v)" />
      <line x1="957" y1="86" x2="957" y2="1384"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />
      <line x1="987" y1="86" x2="987" y2="1384"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.8" opacity="0.5" />

      {/* === Köşe süslemeleri === */}
      <use href="#bei-corner-ornament" x="28" y="68" />
      <use href="#bei-corner-ornament" x="972" y="68" transform="scale(-1,1) translate(-1000,0)" />
      <use href="#bei-corner-ornament" x="28" y="1402" transform="scale(1,-1) translate(0,-1470)" />
      <use href="#bei-corner-ornament" x="972" y="1402" transform="scale(-1,-1) translate(-1000,-1470)" />

      {/* === Ust bant: Dolgulu yesil === */}
      <rect
        x="46" y="18" width="908" height="34" rx="4"
        fill="var(--frame-primary, #1a6b3a)"
        opacity="0.12"
      />
      {/* Bant ic cercevesi */}
      <rect
        x="46" y="18" width="908" height="34" rx="4"
        stroke="var(--frame-primary, #1a6b3a)"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      {/* Bant iç çizgisi */}
      <rect
        x="50" y="22" width="900" height="26" rx="3"
        stroke="var(--frame-accent, #c8a24e)"
        strokeWidth="0.5"
        opacity="0.35"
        fill="none"
      />

      {/* Merkez rozet */}
      <circle cx="500" cy="35" r="12"
        fill="var(--frame-primary, #1a6b3a)" opacity="0.2" />
      <circle cx="500" cy="35" r="12"
        stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.6" opacity="0.5" fill="none" />
      <circle cx="500" cy="35" r="8"
        fill="var(--frame-accent, #c8a24e)" opacity="0.25" />

      {/* Sure adi (sag) */}
      {surahName && (
        <text
          x="920" y="39"
          textAnchor="end"
          style={{
            fill: "var(--frame-primary, #1a6b3a)",
            fontFamily: "'Amiri Quran', 'Amiri', serif",
            fontSize: "17px",
            fontWeight: 700,
            opacity: 0.85,
          }}
          direction="rtl"
        >
          {surahName}
        </text>
      )}

      {/* Cüz bilgisi (sol) */}
      {juzInfo && (
        <text
          x="80" y="39"
          textAnchor="start"
          style={{
            fill: "var(--frame-primary, #1a6b3a)",
            fontFamily: "'Amiri Quran', 'Amiri', serif",
            fontSize: "15px",
            fontWeight: 600,
            opacity: 0.7,
          }}
          direction="rtl"
        >
          {juzInfo}
        </text>
      )}

      {/* === Alt bant: Dolgulu yesil === */}
      <rect
        x="46" y="1420" width="908" height="30" rx="4"
        fill="var(--frame-primary, #1a6b3a)"
        opacity="0.10"
      />
      <rect
        x="46" y="1420" width="908" height="30" rx="4"
        stroke="var(--frame-primary, #1a6b3a)"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />

      {pageNumber != null && (
        <text
          x="500" y="1439"
          textAnchor="middle"
          style={{
            fill: "var(--frame-primary, #1a6b3a)",
            fontFamily: "var(--font-ui, system-ui)",
            fontSize: "15px",
            fontWeight: 600,
            opacity: 0.7,
          }}
        >
          {pageNumber}
        </text>
      )}

      {/* === Ic metin alani sinirlayici === */}
      <rect
        x="44" y="86" width="912" height="1298" rx="1"
        fill="none"
        stroke="var(--frame-primary, #1a6b3a)"
        strokeWidth="0.4"
        opacity="0.15"
      />
    </svg>
  );
}
