/**
 * Ornamental Mushaf View — continuous-flow surah display.
 * Minimal header + traditional scalloped verse-end medallions
 * (shared with Ayet view via VerseEndMarker).
 */

import { memo } from "react";
import { VerseEndMarker } from "~/components/quran/VerseEndMarker";

interface AyahData {
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  textUthmani: string;
}

interface OrnamentalMushafViewProps {
  surahId: number;
  nameArabic: string;
  nameMeaning: string | null;
  bismillahPre: boolean;
  ayahs: AyahData[];
  onAyahRef?: (ayahNumber: number, el: HTMLSpanElement | null) => void;
}

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export const OrnamentalMushafView = memo(function OrnamentalMushafView({
  surahId,
  nameArabic,
  nameMeaning,
  bismillahPre,
  ayahs,
  onAyahRef,
}: OrnamentalMushafViewProps) {
  const showBismillah = bismillahPre && surahId !== 9;

  return (
    <article className="mu-omv">
      <SurahHeader nameArabic={nameArabic} nameMeaning={nameMeaning} />

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
              <span className="mu-omv-marker-wrap">
                {" "}
                <VerseEndMarker ayahNumber={ayah.ayahNumber} variant="inline" size={38} />
                {" "}
              </span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

/* ─── Minimal surah header — name + meaning only ─── */

function SurahHeader({
  nameArabic,
  nameMeaning,
}: {
  nameArabic: string;
  nameMeaning: string | null;
}) {
  return (
    <header className="mu-omv-sh">
      <div className="mu-omv-sh-ar" dir="rtl">{nameArabic}</div>
      {nameMeaning && <div className="mu-omv-sh-meaning">{nameMeaning}</div>}
    </header>
  );
}

