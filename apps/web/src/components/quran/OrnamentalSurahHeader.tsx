/**
 * Ornamental sure başlığı - mushaf çerçevesi içinde kullanılır.
 * Stil-duyarlı: Medine kartuş, Beirut oval, Türk dikdörtgen.
 */

import type { MushafStyleConfig } from "~/lib/mushaf-styles";
import { scallopedPath } from "~/lib/svg-helpers";

interface OrnamentalSurahHeaderProps {
  surahId: number;
  nameArabic: string;
  showBismillah: boolean;
  styleConfig: MushafStyleConfig;
}

export function OrnamentalSurahHeader({
  surahId,
  nameArabic,
  showBismillah,
  styleConfig,
}: OrnamentalSurahHeaderProps) {
  return (
    <div className="select-none my-1">
      {/* Sure adi kartus */}
      <SurahCartouche
        nameArabic={nameArabic}
        surahId={surahId}
        variant={styleConfig.surahHeaderVariant}
      />

      {/* Besmele (Tevbe harici, surahId=9) */}
      {showBismillah && surahId !== 9 && (
        <OrnamentalBismillah
          variant={styleConfig.bismillahVariant}
          fontFamily={styleConfig.fontFamily}
        />
      )}
    </div>
  );
}

// ── Sure adi kartus ────────────────────────────────────

function SurahCartouche({
  nameArabic,
  surahId,
  variant,
}: {
  nameArabic: string;
  surahId: number;
  variant: "cartouche" | "oval" | "rectangle";
}) {
  const w = 400;
  const h = 44;
  const mid = w / 2;
  const midY = h / 2;

  if (variant === "cartouche") {
    // Medine stili: tirtikli kenarli kartus
    const rosetteD = scallopedPath(mid, midY, 18, 14, 10);
    return (
      <div className="flex justify-center py-1">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} fill="none" className="max-w-sm">
          {/* Kartus gövdesi */}
          <rect x="20" y="4" width={w - 40} height={h - 8} rx="6"
            fill="var(--frame-primary, #b8860b)" opacity="0.08"
          />
          <rect x="20" y="4" width={w - 40} height={h - 8} rx="6"
            stroke="var(--frame-primary, #b8860b)" strokeWidth="1" opacity="0.3" fill="none"
          />
          {/* İç çizgi */}
          <rect x="24" y="8" width={w - 48} height={h - 16} rx="4"
            stroke="var(--frame-primary, #b8860b)" strokeWidth="0.4" opacity="0.2" fill="none"
          />
          {/* Sol rozet */}
          <path d={scallopedPath(34, midY, 10, 7, 8)}
            fill="var(--frame-primary, #b8860b)" opacity="0.2"
          />
          {/* Sag rozet */}
          <path d={scallopedPath(w - 34, midY, 10, 7, 8)}
            fill="var(--frame-primary, #b8860b)" opacity="0.2"
          />
          {/* Sure numarası - sol */}
          <text x="34" y={midY + 1} textAnchor="middle" dominantBaseline="central"
            style={{
              fill: "var(--frame-primary, #b8860b)",
              fontFamily: "var(--font-ui)",
              fontSize: "8px",
              fontWeight: 700,
              opacity: 0.5,
            }}
          >
            {surahId}
          </text>
          {/* Sure adi */}
          <text x={mid} y={midY + 1} textAnchor="middle" dominantBaseline="central"
            direction="rtl"
            style={{
              fill: "var(--frame-primary, #b8860b)",
              fontFamily: "'Scheherazade New', serif",
              fontSize: "20px",
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            {nameArabic}
          </text>
        </svg>
      </div>
    );
  }

  if (variant === "oval") {
    // Beirut stili: dolgulu yeşil kartuş (gerçek mushaftaki gibi)
    const bh = 50;
    const bmid = w / 2;
    const bmidY = bh / 2;
    return (
      <div className="flex justify-center py-1.5">
        <svg viewBox={`0 0 ${w} ${bh}`} width="100%" height={bh} fill="none" className="max-w-md">
          {/* Dış çerçeve */}
          <rect x="10" y="2" width={w - 20} height={bh - 4} rx="8"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.15"
          />
          <rect x="10" y="2" width={w - 20} height={bh - 4} rx="8"
            stroke="var(--frame-primary, #1a6b3a)" strokeWidth="1.5" opacity="0.6" fill="none"
          />
          {/* İç çerçeve */}
          <rect x="15" y="6" width={w - 30} height={bh - 12} rx="6"
            stroke="var(--frame-accent, #c8a24e)" strokeWidth="0.6" opacity="0.45" fill="none"
          />
          {/* Sure adi - koyu yesil */}
          <text x={bmid} y={bmidY + 1} textAnchor="middle" dominantBaseline="central"
            direction="rtl"
            style={{
              fill: "var(--frame-primary, #1a6b3a)",
              fontFamily: "'Amiri Quran', 'Amiri', serif",
              fontSize: "22px",
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            سُورَةُ {nameArabic}
          </text>
          {/* Sol rozet - sure numarası */}
          <circle cx="32" cy={bmidY} r="10"
            fill="var(--frame-accent, #c8a24e)" opacity="0.3" />
          <text x="32" y={bmidY + 1} textAnchor="middle" dominantBaseline="central"
            style={{
              fill: "var(--frame-primary, #1a6b3a)",
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            {surahId}
          </text>
          {/* Sag rozet */}
          <circle cx={w - 32} cy={bmidY} r="10"
            fill="var(--frame-accent, #c8a24e)" opacity="0.3" />
          <circle cx={w - 32} cy={bmidY} r="6"
            fill="var(--frame-primary, #1a6b3a)" opacity="0.15" />
        </svg>
      </div>
    );
  }

  // rectangle (Turk stili): sade dikdortgen
  return (
    <div className="flex justify-center py-1">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} fill="none" className="max-w-sm">
        <rect x="30" y="6" width={w - 60} height={h - 12} rx="2"
          stroke="var(--frame-primary, #8b2020)" strokeWidth="0.8" opacity="0.25" fill="none"
        />
        <rect x="34" y="10" width={w - 68} height={h - 20} rx="1"
          stroke="var(--frame-secondary, #b8860b)" strokeWidth="0.3" opacity="0.15" fill="none"
        />
        {/* Üst-alt kısa çizgiler */}
        <line x1={mid - 40} y1="6" x2={mid + 40} y2="6"
          stroke="var(--frame-primary, #8b2020)" strokeWidth="1.5" opacity="0.3"
        />
        <line x1={mid - 40} y1={h - 6} x2={mid + 40} y2={h - 6}
          stroke="var(--frame-primary, #8b2020)" strokeWidth="1.5" opacity="0.3"
        />
        {/* Sure adi */}
        <text x={mid} y={midY + 1} textAnchor="middle" dominantBaseline="central"
          direction="rtl"
          style={{
            fill: "var(--frame-primary, #8b2020)",
            fontFamily: "'Scheherazade New', serif",
            fontSize: "19px",
            fontWeight: 700,
            opacity: 0.75,
          }}
        >
          {nameArabic}
        </text>
        {/* Sure numarası */}
        <text x="44" y={midY + 1} textAnchor="middle" dominantBaseline="central"
          style={{
            fill: "var(--frame-secondary, #b8860b)",
            fontFamily: "var(--font-ui)",
            fontSize: "9px",
            opacity: 0.4,
          }}
        >
          {surahId}
        </text>
      </svg>
    </div>
  );
}

// ── Ornamental Besmele ─────────────────────────────────

function OrnamentalBismillah({
  variant,
  fontFamily,
}: {
  variant: "ornate" | "text";
  fontFamily: string;
}) {
  if (variant === "text") {
    // Turk stili: sade metin
    return (
      <p
        className="text-center my-1"
        dir="rtl"
        style={{
          fontFamily,
          fontSize: "clamp(1rem, 3vw, 1.6rem)",
          color: "var(--color-text-primary)",
          opacity: 0.85,
        }}
      >
        بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
      </p>
    );
  }

  // Ornate: dekoratif çizgilerle çerçeveli besmele
  return (
    <div className="flex items-center gap-3 my-1.5 px-6">
      <div className="flex-1 flex flex-col gap-[2px]">
        <div className="h-[1px]" style={{ background: "var(--frame-primary)", opacity: 0.25 }} />
        <div className="h-[0.5px]" style={{ background: "var(--frame-accent, var(--frame-primary))", opacity: 0.15 }} />
      </div>
      <p
        className="text-center shrink-0"
        dir="rtl"
        style={{
          fontFamily,
          fontSize: "clamp(1rem, 3vw, 1.5rem)",
          color: "var(--frame-primary, var(--color-text-primary))",
          opacity: 0.85,
        }}
      >
        بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
      </p>
      <div className="flex-1 flex flex-col gap-[2px]">
        <div className="h-[1px]" style={{ background: "var(--frame-primary)", opacity: 0.25 }} />
        <div className="h-[0.5px]" style={{ background: "var(--frame-accent, var(--frame-primary))", opacity: 0.15 }} />
      </div>
    </div>
  );
}
