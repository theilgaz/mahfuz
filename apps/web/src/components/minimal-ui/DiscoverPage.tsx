/**
 * Discover page — hybrid layout:
 *   1. Featured cards — Öğren / Oyna
 *   2. Action rows — Mushaf / Topluluk
 *   3. Mood-based suggestions
 */

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSurahs } from "~/hooks/useQuranQuery";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { toArabicIndic } from "~/lib/svg-helpers";
import { MuIcons } from "./icons";

type VerseRef = { s: number; a: number };

const MOODS: { title: string; sub: string; items: VerseRef[] }[] = [
  {
    title: "Huzur",
    sub: "Kalbi sakinleştiren ayetler",
    items: [
      { s: 13, a: 28 },
      { s: 89, a: 27 },
      { s: 65, a: 3 },
      { s: 2, a: 286 },
      { s: 94, a: 5 },
      { s: 6, a: 82 },
      { s: 39, a: 23 },
      { s: 1, a: 1 },
    ],
  },
  {
    title: "Üzüntü & teselli",
    sub: "Zorluk anında sığınılacak",
    items: [
      { s: 93, a: 3 },
      { s: 94, a: 1 },
      { s: 39, a: 53 },
      { s: 12, a: 87 },
      { s: 65, a: 7 },
      { s: 21, a: 87 },
      { s: 2, a: 156 },
      { s: 9, a: 40 },
    ],
  },
  {
    title: "Korku & endişe",
    sub: "Sığınma ve koruma",
    items: [
      { s: 113, a: 1 },
      { s: 114, a: 1 },
      { s: 3, a: 173 },
      { s: 2, a: 255 },
      { s: 41, a: 30 },
      { s: 27, a: 62 },
      { s: 9, a: 40 },
    ],
  },
  {
    title: "Tefekkür",
    sub: "Düşünmeye davet eden ayetler",
    items: [
      { s: 3, a: 190 },
      { s: 2, a: 164 },
      { s: 30, a: 22 },
      { s: 67, a: 3 },
      { s: 88, a: 17 },
      { s: 51, a: 21 },
      { s: 41, a: 53 },
      { s: 50, a: 6 },
    ],
  },
  {
    title: "Motivasyon",
    sub: "Harekete geçiren ayetler",
    items: [
      { s: 13, a: 11 },
      { s: 53, a: 39 },
      { s: 94, a: 7 },
      { s: 39, a: 9 },
      { s: 9, a: 105 },
      { s: 3, a: 139 },
      { s: 4, a: 95 },
    ],
  },
  {
    title: "Cesaret",
    sub: "Korkuyu yenmek için",
    items: [
      { s: 3, a: 139 },
      { s: 9, a: 38 },
      { s: 2, a: 249 },
      { s: 47, a: 7 },
      { s: 33, a: 23 },
      { s: 8, a: 65 },
    ],
  },
  {
    title: "Odaklanma & ihlas",
    sub: "Niyeti diri tutmak için",
    items: [
      { s: 51, a: 56 },
      { s: 6, a: 162 },
      { s: 2, a: 152 },
      { s: 33, a: 21 },
      { s: 23, a: 1 },
      { s: 98, a: 5 },
      { s: 39, a: 11 },
    ],
  },
  {
    title: "Sabır & azim",
    sub: "Yola devam edebilmek için",
    items: [
      { s: 3, a: 200 },
      { s: 2, a: 155 },
      { s: 8, a: 46 },
      { s: 39, a: 10 },
      { s: 16, a: 96 },
      { s: 41, a: 35 },
      { s: 31, a: 17 },
      { s: 13, a: 24 },
    ],
  },
  {
    title: "Hassasiyet & merhamet",
    sub: "Kalbi yumuşatan ayetler",
    items: [
      { s: 49, a: 13 },
      { s: 5, a: 32 },
      { s: 2, a: 177 },
      { s: 4, a: 1 },
      { s: 17, a: 23 },
      { s: 33, a: 70 },
    ],
  },
  {
    title: "Yardımseverlik & infak",
    sub: "Vermenin bereketi",
    items: [
      { s: 2, a: 261 },
      { s: 3, a: 92 },
      { s: 76, a: 8 },
      { s: 64, a: 17 },
      { s: 2, a: 267 },
      { s: 9, a: 60 },
    ],
  },
  {
    title: "Şükür",
    sub: "Nimete sahip çıkmak",
    items: [
      { s: 14, a: 7 },
      { s: 2, a: 152 },
      { s: 16, a: 18 },
      { s: 27, a: 40 },
      { s: 31, a: 12 },
      { s: 39, a: 7 },
    ],
  },
  {
    title: "Tevekkül",
    sub: "Allah'a güvenle bırakmak",
    items: [
      { s: 65, a: 3 },
      { s: 3, a: 159 },
      { s: 11, a: 88 },
      { s: 8, a: 2 },
      { s: 9, a: 51 },
      { s: 14, a: 12 },
    ],
  },
  {
    title: "Tevbe & af",
    sub: "Yeniden başlamak için",
    items: [
      { s: 39, a: 53 },
      { s: 66, a: 8 },
      { s: 11, a: 3 },
      { s: 24, a: 31 },
      { s: 4, a: 110 },
      { s: 25, a: 70 },
    ],
  },
  {
    title: "Adalet",
    sub: "Hak ve hukuk için",
    items: [
      { s: 4, a: 135 },
      { s: 5, a: 8 },
      { s: 16, a: 90 },
      { s: 4, a: 58 },
      { s: 49, a: 9 },
    ],
  },
  {
    title: "Aile & sevgi",
    sub: "Yakınlık ve şefkat",
    items: [
      { s: 30, a: 21 },
      { s: 17, a: 23 },
      { s: 25, a: 74 },
      { s: 31, a: 14 },
      { s: 46, a: 15 },
    ],
  },
  {
    title: "Ölüm bilinci",
    sub: "Geçiciliği hatırlamak",
    items: [
      { s: 3, a: 185 },
      { s: 39, a: 30 },
      { s: 102, a: 1 },
      { s: 99, a: 7 },
      { s: 4, a: 78 },
      { s: 75, a: 1 },
    ],
  },
  {
    title: "Gece ibadeti",
    sub: "Sehir vakti ve teheccüd",
    items: [
      { s: 73, a: 1 },
      { s: 17, a: 79 },
      { s: 39, a: 9 },
      { s: 51, a: 17 },
      { s: 25, a: 64 },
    ],
  },
];

const ACTIONS = [
  { key: "Community", to: "/khatm", icon: MuIcons.usersThree },
] as const;

const FEATURED = [
  { key: "Learn", to: "/alifba", icon: MuIcons.alif },
  { key: "Play", to: "/games", icon: MuIcons.gameController },
] as const;

// Hz. Omer (r.a.) ogrenilmesini tavsiye ettigi sureler
// (Misver b. Mahreme ve Harise b. Mudarrib rivayetleri)
const OMER_SURAHS = [2, 4, 5, 9, 22, 24, 33]; // Bakara, Nisa, Maide, Tevbe, Hac, Nur, Ahzab

// Havamim: hm ile baslayan 7 sure; Hz. Ali (r.a.) "Kuran'in gelinleri" demistir
const HAVAMIM_SURAHS = [40, 41, 42, 43, 44, 45, 46]; // Mu'min/Gafir, Fussilet, Sura, Zuhruf, Duhan, Casiye, Ahkaf

export function DiscoverPage() {
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const hub = t.hub as unknown as Record<string, string>;
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number] | null>(null);

  useEffect(() => {
    if (!selectedMood) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMood(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedMood]);

  return (
    <div className="mu-discover">
      {/* Quick tiles: Öğren / Oyna / Mushaf / Topluluk -- vertical 4-up */}
      <section className="mu-disc-section">
        <div className="mu-quick-grid">
          {FEATURED.map((f) => {
            const titleKey = `feat${f.key}`;
            return (
              <Link key={f.key} to={f.to} className="mu-quick-tile">
                <span className="mu-quick-icon" aria-hidden="true">{f.icon}</span>
                <span className="mu-quick-title">{hub[titleKey] ?? f.key}</span>
              </Link>
            );
          })}
          <Link
            to="/page/$pageNumber"
            params={{ pageNumber: "1" }}
            search={{ ayah: undefined }}
            className="mu-quick-tile"
          >
            <span className="mu-quick-icon" aria-hidden="true">{MuIcons.book}</span>
            <span className="mu-quick-title">{hub.featMushaf ?? "Mushaf"}</span>
          </Link>
          {ACTIONS.map((a) => {
            const titleKey = `feat${a.key}` as string;
            return (
              <Link key={a.key} to={a.to} className="mu-quick-tile">
                <span className="mu-quick-icon" aria-hidden="true">{a.icon}</span>
                <span className="mu-quick-title">{hub[titleKey] ?? a.key}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Mood */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">Ruh haline göre</h2>
        <div className="mu-mood-grid">
          {MOODS.map((m) => (
            <button key={m.title} type="button" className="mu-mood-box" onClick={() => setSelectedMood(m)}>
              <span className="mu-mood-title">{m.title}</span>
              <span className="mu-mood-sub">{m.sub}</span>
              <span className="mu-mood-count">{m.items.length} ayet</span>
            </button>
          ))}
        </div>
      </section>

      {/* Hz. Ömer'in tavsiye ettiği sureler */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">{"Hz. Ömer'in tavsiye ettiği sureler"}</h2>
        <p className="mu-muted" style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55 }}>
          {'Hz. Ömer (r.a.) bu surelerin öğrenilmesini tavsiye etmiştir: "Kuşkusuz farzlar o surelerdedir."'}
        </p>
        <div className="flex flex-wrap gap-2">
          {OMER_SURAHS.map((id) => {
            const surah = surahs.find((x) => x.id === id);
            if (!surah) return null;
            return (
              <Link
                key={id}
                to="/surah/$surahSlug"
                params={{ surahSlug: surahSlug(id) }}
                search={{ ayah: undefined }}
                className="mu-nav-chip"
              >
                {getSurahName(id, locale) || surah.nameSimple}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Havâmîm — Hz. Ali'nin Kuran'ın gelinleri dediği sureler */}
      <section className="mu-disc-section">
        <h2 className="mu-disc-section-title">{"Kuran'ın gelinleri (Havâmîm)"}</h2>
        <p className="mu-muted" style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55 }}>
          {"Hz. Ali (r.a.), حم ile başlayan bu yedi sureye Kuran'ın gelinleri demiştir."}
        </p>
        <div className="flex flex-wrap gap-2">
          {HAVAMIM_SURAHS.map((id) => {
            const surah = surahs.find((x) => x.id === id);
            if (!surah) return null;
            return (
              <Link
                key={id}
                to="/surah/$surahSlug"
                params={{ surahSlug: surahSlug(id) }}
                search={{ ayah: undefined }}
                className="mu-nav-chip"
              >
                {getSurahName(id, locale) || surah.nameSimple}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedMood && (
        <div
          className="mu-sover"
          role="dialog"
          aria-modal="true"
          aria-label={selectedMood.title}
          onClick={() => setSelectedMood(null)}
        >
          <div className="mu-sover-box mu-mood-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mu-mood-modal-head">
              <div>
                <h3>{selectedMood.title}</h3>
                <p className="mu-muted">{selectedMood.sub}</p>
              </div>
              <button className="mu-sover-close" onClick={() => setSelectedMood(null)} aria-label="Kapat">
                esc
              </button>
            </div>
            <ul className="mu-mood-modal-list">
              {selectedMood.items.map(({ s, a }) => {
                const surah = surahs.find((x) => x.id === s);
                if (!surah) return null;
                return (
                  <li key={`${s}-${a}`}>
                    <Link
                      to="/surah/$surahSlug"
                      params={{ surahSlug: surahSlug(s) }}
                      search={{ ayah: a }}
                      className="mu-coll-item"
                    >
                      <span className="mu-ci-num">{s}:{a}</span>
                      <span className="mu-ci-name">{getSurahName(s, locale) || surah.nameSimple}</span>
                      <span className="mu-ci-ar" dir="rtl">{toArabicIndic(a)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

