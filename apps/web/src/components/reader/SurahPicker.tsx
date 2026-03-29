/**
 * Sure/Cüz seçici — hem sure görünümünde hem Mushaf sayfa görünümünde kullanılır.
 *
 * mode="surah": tıklanan sureye /surah/$slug rotasıyla gider (varsayılan)
 * mode="page":  tıklanan surenin başlangıç sayfasına /page/$pageStart ile gider
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSurahs } from "~/hooks/useQuranQuery";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";

const TOTAL_CHAPTERS = 114;

// Cüz → ilk sure numarası
const JUZ_FIRST_SURAH: Record<number, number> = {
  1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
  11: 9, 12: 11, 13: 12, 14: 15, 15: 17, 16: 18, 17: 21, 18: 23,
  19: 25, 20: 27, 21: 29, 22: 33, 23: 36, 24: 39, 25: 41, 26: 46,
  27: 51, 28: 58, 29: 67, 30: 78,
};

// Cüz → ilk sayfa numarası
const JUZ_FIRST_PAGE: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
  21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582,
};

// Sure → hangi cüzde başlıyor
function getJuzForSurah(surahId: number): number {
  let juz = 1;
  for (let j = 1; j <= 30; j++) {
    if (JUZ_FIRST_SURAH[j] <= surahId) juz = j;
  }
  return juz;
}

// Sayfa → hangi cüzde
function getJuzForPage(page: number): number {
  let juz = 1;
  for (let j = 1; j <= 30; j++) {
    if (JUZ_FIRST_PAGE[j] <= page) juz = j;
  }
  return juz;
}

interface SurahPickerProps {
  /** Aktif sure ID (1-114) */
  currentSurahId: number;
  /** "surah" → sure rotasına git, "page" → sayfa rotasına git */
  mode?: "surah" | "page";
  /** Sadece mode="page" için: mevcut sayfa numarası (gösterimde kullanılır) */
  currentPage?: number;
  /** Sadece mode="page" için: toplam sayfa sayısı */
  totalPages?: number;
  /** Dropdown açılış yönü */
  dropUp?: boolean;
}

export function SurahPicker({
  currentSurahId,
  mode = "surah",
  currentPage,
  totalPages = 604,
  dropUp = false,
}: SurahPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"surah" | "juz">("surah");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Açılınca inputa fokus + aktif sureye scroll
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => {
        inputRef.current?.focus();
        activeRef.current?.scrollIntoView({ block: "center" });
      }, 50);
    }
  }, [open]);

  const filtered = surahs.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.nameSimple.toLowerCase().includes(q) ||
      s.nameTranslation.toLowerCase().includes(q) ||
      String(s.id) === q
    );
  });

  // Sure adı
  const currentSurah = surahs.find((s) => s.id === currentSurahId);
  const surahName = (currentSurahId ? getSurahName(currentSurahId, locale) : "") || currentSurah?.nameSimple || "";

  // Trigger label
  const triggerLabel =
    mode === "page" && currentPage != null
      ? `${t.common.page} ${currentPage} · ${surahName}`
      : `${currentSurahId}. ${surahName}`;

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors min-w-0"
      >
        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
          {triggerLabel}
        </span>
        <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d={open ? "M3 7L6 4L9 7" : "M3 5L6 8L9 5"} />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute left-1/2 -translate-x-1/2 w-72 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 flex flex-col overflow-hidden ${dropUp ? "bottom-full mb-2 max-h-[40vh]" : "top-full mt-2 max-h-[60vh]"}`}>
          {/* Tab bar: Sure / Cüz */}
          <div className="flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setTab("surah")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "surah"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Sure
            </button>
            <button
              onClick={() => setTab("juz")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "juz"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Cüz
            </button>
          </div>

          {tab === "surah" ? (
            <>
              {/* Arama */}
              <div className="p-2 border-b border-[var(--color-border)]">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sure ara..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>

              {/* Sure listesi */}
              <div className="overflow-y-auto flex-1">
                {filtered.map((surah) => {
                  const isActive = surah.id === currentSurahId;
                  const target =
                    mode === "page"
                      ? { to: "/page/$pageNumber" as const, params: { pageNumber: String(surah.pageStart) }, search: { ayah: undefined } }
                      : { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(surah.id) }, search: { ayah: undefined } };

                  return (
                    <Link
                      key={surah.id}
                      ref={(el: HTMLAnchorElement | null) => {
                        if (isActive && el) (activeRef as React.MutableRefObject<HTMLAnchorElement | null>).current = el;
                      }}
                      {...target}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        isActive
                          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] shrink-0">
                        {surah.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{getSurahName(surah.id, locale) || surah.nameSimple}</span>
                          <span className="text-sm shrink-0" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                            {surah.nameArabic}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {surah.ayahCount} ayet
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-[var(--color-text-secondary)] py-6">
                    Sonuç bulunamadı
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Cüz listesi */
            <div className="overflow-y-auto flex-1">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const isActive =
                  mode === "page" && currentPage != null
                    ? getJuzForPage(currentPage) === juz
                    : getJuzForSurah(currentSurahId) === juz;
                const firstSurahId = JUZ_FIRST_SURAH[juz];
                const surah = surahs.find((s) => s.id === firstSurahId);
                const page = JUZ_FIRST_PAGE[juz];

                const surahTarget =
                  mode === "page"
                    ? { to: "/page/$pageNumber" as const, params: { pageNumber: String(surah?.pageStart ?? page) } }
                    : { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(firstSurahId) } };

                return (
                  <div
                    key={juz}
                    className={`flex items-center transition-colors ${
                      isActive ? "bg-[var(--color-accent)]/10" : "hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {/* Sol %50 — sure navigasyonu */}
                    <Link
                      {...surahTarget}
                      search={{ ayah: undefined }}
                      onClick={() => { setOpen(false); setTab("surah"); }}
                      className="flex items-center gap-2.5 w-1/2 px-3 py-2.5"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                        isActive
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                      }`}>
                        {juz}
                      </span>
                      <span className={`text-sm truncate ${isActive ? "font-medium text-[var(--color-accent)]" : ""}`}>
                        {getSurahName(firstSurahId, locale) || surah?.nameSimple || ""}
                      </span>
                    </Link>
                    {/* Sağ %50 — sayfa navigasyonu */}
                    <Link
                      to="/page/$pageNumber"
                      params={{ pageNumber: String(page) }}
                      search={{ ayah: undefined }}
                      onClick={() => { setOpen(false); setTab("surah"); }}
                      className="flex items-center justify-end w-1/2 px-3 py-2.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      {t.common.page} {page}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
