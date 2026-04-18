/**
 * Home page hero section and reading card for the minimal UI.
 */

import { Link } from "@tanstack/react-router";
import { useReadingStore } from "~/stores/reading.store";
import { useSurahs } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { Ornament } from "./Ornament";
import { MuIcons } from "./icons";

export function HomeHero() {
  const { t, locale } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const { data: surahs } = useSurahs();

  const lastSurah = lastPosition
    ? surahs.find((s) => s.id === lastPosition.surahId)
    : null;

  const continueLink = lastPosition && lastSurah
    ? { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(lastSurah.id) }, search: { ayah: lastPosition.ayahNumber } }
    : null;

  return (
    <>
      <section className="mu-hero">
        <div>
          <p className="mu-eyebrow">
            <span className="mu-eb-line" />
            {t.home?.slogan ?? "15:9"}
          </p>
          <h1 className="mu-display">
            <span>{t.home?.heroTitle ?? "Korunduğu gibi"}</span>
            <span className="mu-display-accent"> {t.home?.heroAccent ?? "karşında."}</span>
          </h1>
          <p className="mu-lede">
            {t.home?.heroDesc ?? "Kur'an yolculuğuna başla."}
          </p>
          <div className="mu-hero-cta">
            {continueLink ? (
              <Link {...continueLink} className="mu-btn primary">
                {t.home?.continueReading ?? "Okumaya devam et"}
                <span className="mu-btn-sub">
                  {getSurahName(lastSurah!.id, locale)} - {t.reader?.ayah ?? "ayet"} {lastPosition!.ayahNumber}
                </span>
                {MuIcons.arrowRight}
              </Link>
            ) : (
              <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(1) }} className="mu-btn primary">
                {t.home?.startReading ?? "Fatiha'dan başla"}
                {MuIcons.arrowRight}
              </Link>
            )}
          </div>
        </div>

        <div>
          <ReadingCard />
        </div>
      </section>

      <div className="mu-rule">
        <Ornament />
      </div>
    </>
  );
}

function ReadingCard() {
  const { t, locale } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const { data: surahs } = useSurahs();

  const surah = lastPosition
    ? surahs.find((s) => s.id === lastPosition.surahId)
    : surahs.find((s) => s.id === 67); // default: Mulk

  if (!surah) return null;

  const pct = lastPosition
    ? Math.round((lastPosition.ayahNumber / surah.ayahCount) * 100)
    : 0;

  const linkProps = { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(surah.id) } };

  return (
    <div className="mu-readcard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--mu-accent)" }}>
        <p className="mu-rc-eyebrow">
          {lastPosition ? (t.home?.lastRead ?? "Son okunan") : (t.home?.suggested ?? "Önerilen")}
        </p>
        <Ornament size={14} />
      </div>
      <p className="mu-rc-arabic" dir="rtl">
        سُورَةُ {surah.nameArabic}
      </p>
      <h3 className="mu-rc-title">
        {getSurahName(surah.id, locale) || surah.nameSimple}{" "}
        <span className="mu-muted">- {getSurahMeaning(surah.id, locale)}</span>
      </h3>
      <p className="mu-rc-quote">
        {surah.ayahCount} ayet - {surah.revelation === "makkah" ? "Mekki" : "Medeni"} sure
      </p>
      <div style={{ marginBottom: 18 }}>
        <div className="mu-rc-pbar">
          <span style={{ width: `${Math.max(pct, 6)}%` }} />
        </div>
        <span className="mu-rc-psub">
          {lastPosition
            ? `${t.reader?.ayah ?? "Ayet"} ${lastPosition.ayahNumber} / ${surah.ayahCount}`
            : `${surah.ayahCount} ${t.surahList?.verses ?? "ayet"}`}
        </span>
      </div>
      <Link {...linkProps} className="mu-btn small primary">
        {lastPosition ? (t.home?.continueBtn ?? "Devam et") : (t.home?.startBtn ?? "Okumaya başla")}{" "}
        {MuIcons.arrowRight}
      </Link>
    </div>
  );
}
