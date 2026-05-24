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
  }, [surahs, tab, q, locale]);

  const alphaGroups = useMemo(() => {
    if (tab !== "alfa") return [];
    const groups: Array<{ letter: string; surahs: Surah[] }> = [];
    for (const s of filtered) {
      const name = getSurahName(s.id, locale) || s.nameSimple;
      if (!name) continue;
      const letter = normalize(name[0]).toUpperCase();
      const last = groups[groups.length - 1];
      if (last && last.letter === letter) last.surahs.push(s);
      else groups.push({ letter, surahs: [s] });
    }
    return groups;
  }, [filtered, tab, locale]);

  const scrollToLetter = useCallback((letter: string | null) => {
    if (typeof window === "undefined") return;
    if (!letter) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(`alpha-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const tabs = [
    { id: "all", label: t.surahList?.filterAll ?? "Tumu" },
    { id: "mekki", label: t.surahList?.filterMakki ?? "Mekki" },
    { id: "medeni", label: t.surahList?.filterMadani ?? "Medeni" },
    { id: "alfa", label: t.surahList?.filterAlpha ?? "Alfabetik" },
    { id: "nuzul", label: t.surahList?.filterNuzul ?? "Nuzul" },
  ];

  return (
    <section>
      <div className="mu-fihrist-hero">
        <div className="mu-fihrist-search">
          <span className="mu-fihrist-search-icon" aria-hidden="true">{MuIcons.search}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.surahList?.searchPlaceholder ?? "Sure, anlam veya numara ara…"}
            aria-label={t.surahList?.searchPlaceholder ?? "Ara"}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="mu-fihrist-search-clear"
              aria-label={t.surahList?.clear ?? "Temizle"}
            >
              {MuIcons.close}
            </button>
          )}
        </div>

        <div className="mu-fihrist-seg" role="tablist" aria-label="Sure filtresi">
          {tabs.map((tt) => (
            <button
              key={tt.id}
              role="tab"
              aria-selected={tab === tt.id}
              className={`mu-fihrist-seg-btn${tab === tt.id ? " on" : ""}`}
              onClick={() => setTab(tt.id)}
            >
              {tt.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "alfa" && alphaGroups.length > 0 && (
        <div className="mu-alpha-bar">
          <button
            className="mu-alpha-btn"
            onClick={() => scrollToLetter(null)}
            aria-label={t.surahList?.filterAll ?? "Tumu"}
          >
            {t.surahList?.filterAll ?? "Tumu"}
          </button>
          {alphaGroups.map(({ letter, surahs: group }) => (
            <button
              key={letter}
              className="mu-alpha-btn"
              onClick={() => scrollToLetter(letter)}
              aria-label={`${letter} (${group.length})`}
            >
              {letter}
              <span className="mu-alpha-btn-count">{group.length}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "alfa" && alphaGroups.length > 0 ? (
        alphaGroups.map(({ letter, surahs: group }) => (
          <section key={letter} id={`alpha-${letter}`} className="mu-alpha-group">
            <h3 className="mu-alpha-heading">{letter}</h3>
            <ul className="mu-slist">
              {group.map((surah) => renderSurahRow(surah, tab, locale, t))}
            </ul>
          </section>
        ))
      ) : (
        <ul className="mu-slist">
          {filtered.map((surah) => renderSurahRow(surah, tab, locale, t))}
        </ul>
      )}
    </section>
  );
}

function renderSurahRow(
  surah: Surah,
  tab: string,
  locale: string,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const linkProps = {
    to: "/surah/$surahSlug" as const,
    params: { surahSlug: surahSlug(surah.id) },
    search: { ayah: undefined },
  };
  const displayNum = tab === "nuzul" ? surah.revelationOrder : surah.id;
  const isMekki = surah.revelation === "makkah";

  return (
    <li key={surah.id}>
      <Link {...linkProps} className="mu-srow">
        <div className="mu-badge">
          <span className="mu-badge-n">{String(displayNum).padStart(3, "0")}</span>
        </div>
        <div className="mu-srow-meta">
          <div className="mu-srow-name">
            <span className="mu-srow-latin">
              {getSurahName(surah.id, locale) || surah.nameSimple}
            </span>
            <span className="mu-dot">·</span>
            <span className="mu-srow-tr">
              {getSurahMeaning(surah.id, locale) || surah.nameTranslation}
            </span>
          </div>
          <div className="mu-srow-sub">
            <span>{isMekki ? "Mekki" : "Medeni"}</span>
            <span className="mu-dot">·</span>
            <span>
              {surah.ayahCount} {t.surahList?.verses ?? "ayet"}
            </span>
          </div>
        </div>
        <div className="mu-srow-ar" aria-hidden="true" dir="rtl">
          {surah.nameArabic}
        </div>
      </Link>
    </li>
  );
}
