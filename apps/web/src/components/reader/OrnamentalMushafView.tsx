/**
 * Ornamental Mushaf View — continuous-flow surah display.
 * Swiss-grid surah header + flower-badge ayah markers.
 * Matches the Mushaf.html reference design.
 */

import { memo } from "react";

interface AyahData {
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  textUthmani: string;
}

interface OrnamentalMushafViewProps {
  surahId: number;
  nameArabic: string;
  nameSimple: string;
  nameMeaning: string | null;
  ayahCount: number;
  revelation: string;
  bismillahPre: boolean;
  ayahs: AyahData[];
  onAyahRef?: (ayahNumber: number, el: HTMLSpanElement | null) => void;
}

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export const OrnamentalMushafView = memo(function OrnamentalMushafView({
  surahId,
  nameArabic,
  nameSimple,
  nameMeaning,
  ayahCount,
  revelation,
  bismillahPre,
  ayahs,
  onAyahRef,
}: OrnamentalMushafViewProps) {
  const showBismillah = bismillahPre && surahId !== 9;
  const juz = ayahs[0]?.juzNumber;

  return (
    <article className="mu-omv">
      <SurahHeader
        nameArabic={nameArabic}
        nameSimple={nameSimple}
        nameMeaning={nameMeaning}
        surahNumber={surahId}
        ayahCount={ayahCount}
        juz={juz}
        revelation={revelation === "makkah" ? "Mekki" : "Medeni"}
      />

      <div className="mu-omv-body" dir="rtl" lang="ar">
        {showBismillah && (
          <div className="mu-omv-bismillah">{BISMILLAH}</div>
        )}

        <div className="mu-omv-text">
          {ayahs.map((ayah) => (
            <span
              key={ayah.ayahNumber}
              ref={onAyahRef ? (el) => onAyahRef(ayah.ayahNumber, el) : undefined}
              data-ayah={ayah.ayahNumber}
            >
              <span className="mu-omv-ayah" data-ayah-number={ayah.ayahNumber}>
                {ayah.textUthmani}
              </span>
              <span className="mu-omv-flower-wrap">
                {" "}
                <AyahFlower number={ayah.ayahNumber} />
                {" "}
              </span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

/* ─── Swiss-grid surah header ─── */

function SurahHeader({
  nameArabic,
  nameSimple,
  nameMeaning,
  surahNumber,
  ayahCount,
  juz,
  revelation,
}: {
  nameArabic: string;
  nameSimple: string;
  nameMeaning: string | null;
  surahNumber: number;
  ayahCount: number;
  juz?: number;
  revelation: string;
}) {
  return (
    <header className="mu-omv-sh">
      <div className="mu-omv-sh-meta">
        <div>{String(surahNumber).padStart(3, "0")}</div>
        {juz != null && <div>Cuz {juz}</div>}
      </div>

      <div className="mu-omv-sh-center">
        <div className="mu-omv-sh-ar" dir="rtl">{nameArabic}</div>
        {nameMeaning && (
          <div className="mu-omv-sh-meaning">{nameMeaning}</div>
        )}
      </div>

      <div className="mu-omv-sh-meta" style={{ textAlign: "right" }}>
        <div>{ayahCount} ayet</div>
        <div>{revelation}</div>
      </div>
    </header>
  );
}

/* ─── Flower-badge ayah marker ─── */

function AyahFlower({ number }: { number: number }) {
  const ARABIC = "٠١٢٣٤٥٦٧٨٩";
  const arabic = String(number).split("").map((d) => ARABIC[Number(d)] ?? d).join("");
  const lobes = 11;
  const pts: string[] = [];
  const total = lobes * 2;
  for (let i = 0; i < total * 6; i++) {
    const t = i / (total * 6);
    const a = t * Math.PI * 2 - Math.PI / 2;
    const wave = Math.cos(t * Math.PI * 2 * lobes);
    const r = 46 + wave * 6;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  const id = `af-${number}`;
  return (
    <svg
      className="mu-omv-flower"
      viewBox="-55 -55 110 110"
      aria-label={`Ayet ${number}`}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="var(--mu-omv-flower-1, #6fa67a)" />
          <stop offset="55%" stopColor="var(--mu-omv-flower-2, #3d7a50)" />
          <stop offset="100%" stopColor="var(--mu-omv-flower-3, #1f4a33)" />
        </radialGradient>
      </defs>
      <polygon
        points={pts.join(" ")}
        fill={`url(#${id})`}
        stroke="var(--mu-omv-flower-stroke, #143a24)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <text
        x="0" y="3"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "'Scheherazade New', serif",
          fontSize: 40,
          fill: "var(--mu-omv-flower-text, #cfe5d1)",
          opacity: 0.62,
        }}
      >
        {arabic}
      </text>
    </svg>
  );
}
