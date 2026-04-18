/**
 * Surah index with refined badges, tabs, and search -- minimal UI.
 */

import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName, getSurahMeaning } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "./icons";

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
  const readingMode = useSettingsStore((s) => s.readingMode);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const makkahCount = useMemo(() => surahs.filter((s) => s.revelation === "makkah").length, [surahs]);
  const madinahCount = useMemo(() => surahs.filter((s) => s.revelation === "madinah").length, [surahs]);

  const filtered = useMemo(() => {
    let xs = [...surahs];
    if (tab === "mekki") xs = xs.filter((s) => s.revelation === "makkah");
    else if (tab === "medeni") xs = xs.filter((s) => s.revelation === "madinah");
    else if (tab === "nuzul") xs.sort((a, b) => a.revelationOrder - b.revelationOrder);
    if (q.trim()) {
      const term = q.toLowerCase();
      xs = xs.filter((s) => {
        const name = getSurahName(s.id, locale) || s.nameSimple;
        const meaning = getSurahMeaning(s.id, locale) || s.nameTranslation;
        return (
          name.toLowerCase().includes(term) ||
          meaning.toLowerCase().includes(term) ||
          String(s.id).includes(term)
        );
      });
    }
    return xs;
  }, [surahs, tab, q, locale]);

  const tabs = [
    { id: "all", label: t.surahList?.filterAll ?? "Tumu", count: 114 },
    { id: "mekki", label: t.surahList?.filterMakki ?? "Mekki", count: makkahCount },
    { id: "medeni", label: t.surahList?.filterMadani ?? "Medeni", count: madinahCount },
    { id: "nuzul", label: t.surahList?.filterNuzul ?? "Nuzul sirasi", count: null },
  ];

  return (
    <section>
      <div className="mu-index-head">
        <div className="mu-index-title">
          <h2>{t.surahList?.title ?? "Sure fihristi"}</h2>
          <span className="mu-muted" style={{ fontSize: 13 }}>
            114 {t.surahList?.surahCount ?? "sure"} - {filtered.length} {t.surahList?.showing ?? "gosteriliyor"}
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
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count != null && <span className="mu-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <ul className="mu-slist">
        {filtered.map((surah) => {
          const linkProps =
            readingMode === "mushaf"
              ? {
                  to: "/page/$pageNumber" as const,
                  params: { pageNumber: String(surah.pageStart) },
                }
              : {
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
