/**
 * Home hero — Apple-style monumental centered composition.
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
      <section className="mu-hero mu-hero--center">
        <p className="mu-eyebrow">
          <span className="mu-eb-line" />
          {t.home?.slogan ?? "15:9"}
          <span className="mu-eb-line" />
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
              {MuIcons.arrowRight}
            </Link>
          ) : (
            <Link to="/surah/$surahSlug" params={{ surahSlug: surahSlug(1) }} className="mu-btn primary">
              {t.home?.startReading ?? "Fatiha'dan başla"}
              {MuIcons.arrowRight}
            </Link>
          )}
        </div>
        {lastPosition && lastSurah && (
          <p className="mu-hero-meta">
            {getSurahName(lastSurah.id, locale)} · {t.reader?.ayah ?? "ayet"} {lastPosition.ayahNumber} / {lastSurah.ayahCount}
          </p>
        )}
      </section>

      <div className="mu-rule">
        <Ornament />
      </div>

      <FeaturedSurah />
    </>
  );
}

function FeaturedSurah() {
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
    <section className="mu-feature">
      <p className="mu-eyebrow">
        {lastPosition ? (t.home?.lastRead ?? "Son okunan") : (t.home?.suggested ?? "Önerilen")}
      </p>
      <p className="mu-feat-arabic" dir="rtl">
        سُورَةُ {surah.nameArabic}
      </p>
      <h2 className="mu-feat-title">
        {getSurahName(surah.id, locale) || surah.nameSimple}
        <span className="mu-muted"> — {getSurahMeaning(surah.id, locale)}</span>
      </h2>
      <p className="mu-feat-meta">
        {surah.ayahCount} {t.surahList?.verses ?? "ayet"} · {surah.revelation === "makkah" ? "Mekki" : "Medeni"}
      </p>
      {lastPosition && (
        <div className="mu-feat-pbar" aria-label={`%${pct}`}>
          <span style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
      )}
      <Link {...linkProps} className="mu-link-arrow">
        {lastPosition ? (t.home?.continueBtn ?? "Devam et") : (t.home?.startBtn ?? "Okumaya başla")}
        {MuIcons.arrowRight}
      </Link>
    </section>
  );
}
