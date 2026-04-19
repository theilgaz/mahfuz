/**
 * Surah index with refined badges, tabs, and search -- minimal UI.
 */

import { useState, useMemo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "./icons";

/** Strip diacritics (â→a, î→i, û→u, etc.) for fuzzy search */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  revelation: string;
  revelationOrder: number;
  ayahCount: number;
  pageStart: number;
}

interface SurahIndexProps {
  surahs: Surah[];
}

export function SurahIndex({ surahs }: SurahIndexProps) {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [alphaFilter, setAlphaFilter] = useState<string | null>(null);

  const makkahCount = useMemo(() => surahs.filter((s) => s.revelation === "makkah").length, [surahs]);
  const madinahCount = useMemo(() => surahs.filter((s) => s.revelation === "madinah").length, [surahs]);

  const alphaLetters = useMemo(() => {
    if (tab !== "alfa") return [];
    const letters = new Set<string>();
    for (const s of surahs) {
      const name = getSurahName(s.id, locale) || s.nameSimple;
      if (name) letters.add(normalize(name[0]).toUpperCase());
    }
    return [...letters].sort((a, b) => a.localeCompare(b, locale));
  }, [surahs, tab, locale]);

  const filtered = useMemo(() => {
    let xs = [...surahs];
    if (tab === "mekki") xs = xs.filter((s) => s.revelation === "makkah");
    else if (tab === "medeni") xs = xs.filter((s) => s.revelation === "madinah");
    else if (tab === "nuzul") xs.sort((a, b) => a.revelationOrder - b.revelationOrder);
    else if (tab === "alfa") {
      xs.sort((a, b) => {
        const nameA = getSurahName(a.id, locale) || a.nameSimple;
        const nameB = getSurahName(b.id, locale) || b.nameSimple;
        return nameA.localeCompare(nameB, locale);
      });
      if (alphaFilter) {
        xs = xs.filter((s) => {
          const name = getSurahName(s.id, locale) || s.nameSimple;
          return name && normalize(name[0]).toUpperCase() === alphaFilter;
        });
      }
    }
    if (q.trim()) {
      const term = normalize(q);
      xs = xs.filter((s) => {
        const name = normalize(getSurahName(s.id, locale) || s.nameSimple);
        const meaning = normalize(getSurahMeaning(s.id, locale) || s.nameTranslation);
        const simple = normalize(s.nameSimple);
        return (
          name.includes(term) ||
          meaning.includes(term) ||
          simple.includes(term) ||
          String(s.id).includes(q.trim())
        );
      });
    }
    return xs;
  }, [surahs, tab, q, locale, alphaFilter]);

  const tabs = [
    { id: "all", label: t.surahList?.filterAll ?? "Tumu", count: 114, icon: null },
    { id: "mekki", label: t.surahList?.filterMakki ?? "Mekki", count: makkahCount, icon: "/images/kabe-tab.png" },
    { id: "medeni", label: t.surahList?.filterMadani ?? "Medeni", count: madinahCount, icon: "/images/nebevi-tab.png" },
    { id: "alfa", label: t.surahList?.filterAlpha ?? "Alfabetik", count: null, icon: null },
    { id: "nuzul", label: t.surahList?.filterNuzul ?? "Nuzul", count: null, icon: null },
  ];

  return (
    <section>
      <div className="mu-index-head">
        <div className="mu-index-title">
          <h2>{t.surahList?.title ?? "Sure fihristi"}</h2>
          <span className="mu-muted" style={{ fontSize: 13 }}>
            114 {t.surahList?.surahCount ?? "sure"} - {filtered.length} {t.surahList?.showing ?? "gösteriliyor"}
          </span>
        </div>
        <div className="mu-index-search">
          <span className="mu-is-icon">{MuIcons.search}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.surahList?.searchPlaceholder ?? "Sure adi, anlam veya numara"}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                border: 0,
                background: "transparent",
                width: 28,
                height: 28,
                borderRadius: "999px",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: "var(--mu-muted)",
              }}
            >
              {MuIcons.close}
            </button>
          )}
        </div>
      </div>

      <div className="mu-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`mu-tab ${tab === t.id ? "on" : ""}`}
            onClick={() => { setTab(t.id); if (t.id !== "alfa") setAlphaFilter(null); }}
          >
            {t.icon && <img src={t.icon} alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />}
            {t.label}
            {t.count != null && <span className="mu-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "alfa" && alphaLetters.length > 0 && (
        <div className="mu-alpha-bar">
          <button
            className={`mu-alpha-btn ${alphaFilter === null ? "on" : ""}`}
            onClick={() => setAlphaFilter(null)}
          >
            {t.surahList?.filterAll ?? "Tumu"}
          </button>
          {alphaLetters.map((letter) => (
            <button
              key={letter}
              className={`mu-alpha-btn ${alphaFilter === letter ? "on" : ""}`}
              onClick={() => setAlphaFilter(alphaFilter === letter ? null : letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      <ul className="mu-slist">
        {filtered.map((surah) => {
          const linkProps = {
                  to: "/surah/$surahSlug" as const,
                  params: { surahSlug: surahSlug(surah.id) },
                };
          const displayNum = tab === "nuzul" ? surah.revelationOrder : surah.id;
          const isMekki = surah.revelation === "makkah";

          return (
            <li key={surah.id}>
              <Link {...linkProps} className="mu-srow">
                <div className="mu-badge">
                  <span className="mu-badge-n">
                    {String(displayNum).padStart(3, "0")}
                  </span>
                </div>
                <div className="mu-srow-meta">
                  <div className="mu-srow-name">
                    <span className="mu-srow-latin">
                      {getSurahName(surah.id, locale) || surah.nameSimple}
                    </span>
                    <span className="mu-srow-tr">
                      - {getSurahMeaning(surah.id, locale) || surah.nameTranslation}
                    </span>
                  </div>
                  <div className="mu-srow-sub">
                    <span className={`mu-chip ${isMekki ? "mu-chip-mekki" : "mu-chip-medeni"}`}>
                      {isMekki ? "Mekki" : "Medeni"}
                    </span>
                    <span>
                      {surah.ayahCount} {t.surahList?.verses ?? "ayet"}
                    </span>
                    <span className="mu-dot">-</span>
                    <span>
                      {t.surahList?.nuzul ?? "Nuzul"} {surah.revelationOrder}
                    </span>
                  </div>
                </div>
                <div className="mu-srow-ar" aria-hidden="true" dir="rtl">
                  سُورَةُ {surah.nameArabic}
                </div>
                <span className="mu-srow-chev">{MuIcons.chev}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
