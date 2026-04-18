/**
 * Discover page -- verse of the day, curated collections, topic themes.
 * Minimal UI editorial design.
 */

import { Link } from "@tanstack/react-router";
import { useSurahs, useDailyVerse } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "./icons";

const COLLECTIONS = [
  { title: "Sabah & akşam", sub: "Günü açan ve kapatan sureler", items: [1, 36, 55, 67, 112, 113, 114] },
  { title: "Kısa sureler", sub: "Üç ile on ayet arası", items: [103, 108, 112, 110, 105, 94, 93] },
  { title: "Kıssalar", sub: "Peygamber anlatıları", items: [12, 19, 28, 18, 71, 21] },
  { title: "Rahmet", sub: "Merhamet ve bağışlama", items: [55, 36, 67, 93, 94, 1] },
];

const THEMES = [
  { t: "Tevhid", n: "İnanç" },
  { t: "Sabır", n: "Ahlak" },
  { t: "Şükür", n: "Ahlak" },
  { t: "Yaratılış", n: "Evren" },
  { t: "Adalet", n: "Toplum" },
  { t: "İlim", n: "Toplum" },
  { t: "Ahiret", n: "İnanç" },
  { t: "Dua", n: "İbadet" },
  { t: "Rızık", n: "Hayat" },
];

export function DiscoverPage() {
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const { data: dailyVerse } = useDailyVerse(locale);

  return (
    <div className="mu-discover">
      {/* Hero */}
      <section style={{ padding: "24px 0 40px", maxWidth: 900 }}>
        <p className="mu-eyebrow">
          <span className="mu-eb-line" />
          {t.hub?.title ?? "Keşfet"}
        </p>
        <h1 className="mu-display" style={{ fontSize: "clamp(40px, 5.5vw, 68px)" }}>
          Bir niyet seç,<span className="mu-display-accent"> sure sana gelsin.</span>
        </h1>
        <p className="mu-lede">
          Konuya, uzunluğa veya güne göre okuma önerileri. Her gün yeni bir öneri.
        </p>
      </section>

      {/* Today's verse */}
      <section>
        <div className="mu-today-card">
          <div style={{ position: "relative" }}>
            <p className="mu-eyebrow">Bugünün ayeti</p>
            {dailyVerse ? (
              <>
                <p className="mu-today-ar" dir="rtl">
                  {dailyVerse.textUthmani || dailyVerse.textSimple}
                </p>
                <p className="mu-today-tr">
                  {dailyVerse.translation?.text ?? dailyVerse.translation}
                </p>
                <p className="mu-today-ref" style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 12, color: "var(--mu-muted)", margin: "0 0 24px" }}>
                  {dailyVerse.surahName} - ayet {dailyVerse.verseNumber}
                </p>
                <Link
                  to="/surah/$surahSlug"
                  params={{ surahSlug: surahSlug(dailyVerse.surahId) }}
                  search={{ ayah: dailyVerse.verseNumber }}
                  className="mu-btn ghost"
                >
                  Sureyi aç {MuIcons.arrowRight}
                </Link>
              </>
            ) : (
              <>
                <p className="mu-today-ar" dir="rtl">
                  وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ
                </p>
                <p className="mu-today-tr">
                  Kim Allah'a tevekkül ederse, O ona yeter.
                </p>
                <p style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 12, color: "var(--mu-muted)", margin: "0 0 24px" }}>
                  Et-Talak - ayet 3
                </p>
                <Link
                  to="/surah/$surahSlug"
                  params={{ surahSlug: surahSlug(65) }}
                  className="mu-btn ghost"
                >
                  Sureyi aç {MuIcons.arrowRight}
                </Link>
              </>
            )}
          </div>
          <div style={{ color: "var(--mu-accent)", position: "relative", opacity: 0.9 }} aria-hidden="true">
            <svg viewBox="0 0 200 200" width="180" height="180" fill="none" stroke="currentColor" strokeWidth="0.6">
              <circle cx="100" cy="100" r="90" opacity="0.25" />
              <circle cx="100" cy="100" r="70" opacity="0.35" />
              <circle cx="100" cy="100" r="50" opacity="0.5" />
              <path d="M100 15 L115 50 L155 55 L125 85 L135 125 L100 105 L65 125 L75 85 L45 55 L85 50 Z" opacity="0.5" />
              <circle cx="100" cy="100" r="6" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section>
        <h2 className="mu-h2">Derlemeler</h2>
        <div className="mu-coll-grid">
          {COLLECTIONS.map((c) => (
            <article key={c.title} className="mu-coll">
              <header className="mu-coll-head">
                <h3>{c.title}</h3>
                <p className="mu-muted" style={{ fontSize: 13, margin: 0 }}>{c.sub}</p>
              </header>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {c.items.map((n) => {
                  const s = surahs.find((x) => x.id === n);
                  if (!s) return null;
                  return (
                    <li key={n} style={{ borderBottom: "1px solid color-mix(in oklab, var(--mu-line), transparent 40%)" }}>
                      <Link
                        to="/surah/$surahSlug"
                        params={{ surahSlug: surahSlug(n) }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px 1fr auto",
                          gap: 12,
                          alignItems: "baseline",
                          padding: "10px 4px",
                          width: "100%",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "padding 0.15s",
                        }}
                      >
                        <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 11, color: "var(--mu-muted)" }}>
                          {String(n).padStart(3, "0")}
                        </span>
                        <span style={{ fontFamily: "var(--mu-ff-display)", fontSize: 17, color: "var(--mu-ink)" }}>
                          {getSurahName(n, locale) || s.nameSimple}
                        </span>
                        <span style={{ fontFamily: "var(--mu-ff-ar)", fontSize: 20, color: "var(--mu-ink-3)", direction: "rtl" }} dir="rtl">
                          {s.nameArabic}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Themes */}
      <section>
        <h2 className="mu-h2">Konular</h2>
        <div className="mu-theme-grid">
          {THEMES.map((theme) => (
            <button key={theme.t} className="mu-theme-tile">
              <span className="mu-theme-n">{theme.n}</span>
              <span className="mu-theme-t">{theme.t}</span>
              <span style={{ gridColumn: 2, gridRow: "1 / -1", alignSelf: "end", color: "var(--mu-muted)", transition: "color 0.15s, transform 0.15s" }}>
                {MuIcons.arrowRight}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
