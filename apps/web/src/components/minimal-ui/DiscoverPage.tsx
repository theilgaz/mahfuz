/**
 * Discover page — hybrid layout:
 *   1. Featured cards — Öğren / Oyna
 *   2. Action rows — Mushaf / Topluluk
 *   3. Mood-based suggestions
 */

import { Link } from "@tanstack/react-router";
import { useSurahs } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "./icons";

const MOODS = [
  { title: "Huzur", sub: "Kalbi sakinleştiren sureler", items: [55, 67, 36, 1, 112] },
  { title: "Üzüntü & teselli", sub: "Zorluk anında sığınılacak", items: [93, 94, 65, 12, 39] },
  { title: "Korku & endişe", sub: "Sığınma ve koruma", items: [113, 114, 1, 2, 23] },
  { title: "Tefekkür", sub: "Düşünmeye davet eden", items: [67, 56, 36, 30, 88] },
];

const ACTIONS = [
  { key: "Community", to: "/khatm", icon: MuIcons.usersThree },
] as const;

const FEATURED = [
  { key: "Learn", to: "/alifba", icon: MuIcons.alif },
  { key: "Play", to: "/games", icon: MuIcons.gameController },
] as const;

export function DiscoverPage() {
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const hub = t.hub as unknown as Record<string, string>;

  return (
    <div className="mu-discover">
      {/* 1. Featured: Elifba + Oyunlar */}
      <section className="mu-disc-section">
        <div className="mu-feat-grid">
          {FEATURED.map((f) => {
            const titleKey = `feat${f.key}`;
            const descKey = `${titleKey}Desc`;
            return (
              <Link key={f.key} to={f.to} className="mu-feat-card">
                <span className="mu-feat-icon" aria-hidden="true">{f.icon}</span>
                <div className="mu-feat-body">
                  <div className="mu-feat-title">{hub[titleKey] ?? f.key}</div>
                  <div className="mu-feat-desc">{hub[descKey] ?? ""}</div>
                </div>
                <span className="mu-feat-arrow" aria-hidden="true">{"\u2192"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Actions */}
      <section className="mu-disc-section">
        <p className="mu-eyebrow" style={{ marginBottom: 20 }}>
          {hub.journeyTitle ?? "Yolculuğun"}
        </p>
        <div className="mu-feat-list">
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: "1" }}
            className="mu-feat-card mu-feat-card-compact"
          >
            <span className="mu-feat-icon" aria-hidden="true">{MuIcons.book}</span>
            <div className="mu-feat-title">{hub.featMushaf ?? "Mushaf"}</div>
            <span className="mu-feat-arrow" aria-hidden="true">{"\u2192"}</span>
          </Link>
          {ACTIONS.map((a) => {
            const titleKey = `feat${a.key}` as string;
            return (
              <Link key={a.key} to={a.to} className="mu-feat-card mu-feat-card-compact">
                <span className="mu-feat-icon" aria-hidden="true">{a.icon}</span>
                <div className="mu-feat-title">{hub[titleKey] ?? a.key}</div>
                <span className="mu-feat-arrow" aria-hidden="true">{"\u2192"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Mood */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">Ruh haline göre</h2>
        <div className="mu-coll-grid">
          {MOODS.map((m) => (
            <article key={m.title} className="mu-coll-card">
              <h3>{m.title}</h3>
              <p className="mu-coll-sub">{m.sub}</p>
              <ul>
                {m.items.map((n) => {
                  const s = surahs.find((x) => x.id === n);
                  if (!s) return null;
                  return (
                    <li key={n}>
                      <Link
                        to="/surah/$surahSlug"
                        params={{ surahSlug: surahSlug(n) }}
                        search={{ ayah: undefined }}
                        className="mu-coll-item"
                      >
                        <span className="mu-ci-num">{String(n).padStart(3, "0")}</span>
                        <span className="mu-ci-name">{getSurahName(n, locale) || s.nameSimple}</span>
                        <span className="mu-ci-ar" dir="rtl">{s.nameArabic}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

