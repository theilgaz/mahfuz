/**
 * Sure/Cüz seçici — hem sure görünümünde hem Mushaf sayfa görünümünde kullanılır.
 *
 * mode="surah": tıklanan sureye /surah/$slug rotasıyla gider (varsayılan)
 * mode="page":  tıklanan surenin başlangıç sayfasına /page/$pageStart ile gider
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { TOTAL_CHAPTERS, JUZ_FIRST_SURAH, JUZ_FIRST_PAGE, getJuzForSurah, getJuzForPage } from "@mahfuz/shared";
import { useSurahs } from "~/hooks/useQuranQuery";
import { surahSlug } from "~/lib/surah-slugs";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";
import { useFocusTrap } from "~/hooks/useFocusTrap";

/** Curated surah collections */
const CURATED_COLLECTIONS = {
  prayer: [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
  popular: [36, 48, 55, 56, 67, 18],
  amma: Array.from({ length: 37 }, (_, i) => 78 + i), // 78-114
  tabaraka: Array.from({ length: 11 }, (_, i) => 67 + i), // 67-77
} as const;

type CollectionKey = keyof typeof CURATED_COLLECTIONS;

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
  const [tab, setTab] = useState<"surah" | "juz" | "curated">("surah");
  const [expandedCollection, setExpandedCollection] = useState<CollectionKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { data: surahs } = useSurahs();
  const closeDropdown = useCallback(() => setOpen(false), []);
  useFocusTrap(dropdownRef, open, closeDropdown);

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

  // Sure adı — her zaman transliterasyon (nameSimple) kullan
  const currentSurah = surahs.find((s) => s.id === currentSurahId);
  const surahName = currentSurah?.nameSimple || "";

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
        aria-haspopup="listbox"
        aria-expanded={open}
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
        <div ref={dropdownRef} role="listbox" aria-label={t.surahList.searchPlaceholder} className={`absolute left-1/2 -translate-x-1/2 w-72 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 flex flex-col overflow-hidden ${dropUp ? "bottom-full mb-2 max-h-[40vh]" : "top-full mt-2 max-h-[60vh]"}`}>
          {/* Tab bar: Sure / Cüz */}
          <div role="tablist" className="flex border-b border-[var(--color-border)]">
            <button
              role="tab"
              aria-selected={tab === "surah"}
              onClick={() => setTab("surah")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "surah"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t.common.surah}
            </button>
            <button
              role="tab"
              aria-selected={tab === "juz"}
              onClick={() => setTab("juz")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "juz"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t.common.juz}
            </button>
            <button
              role="tab"
              aria-selected={tab === "curated"}
              onClick={() => setTab("curated")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "curated"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t.surahList.curated}
            </button>
          </div>

          {tab === "surah" && (
            <>
              {/* Arama */}
              <div className="p-2 border-b border-[var(--color-border)]">
                <label htmlFor="surah-search" className="sr-only">{t.surahList.searchPlaceholder}</label>
                <input
                  id="surah-search"
                  ref={inputRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.reader.searchSurah}
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
                      role="option"
                      aria-selected={isActive}
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
                          {surah.ayahCount} {t.surahList.verses}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-[var(--color-text-secondary)] py-6">
                    {t.common.noResults}
                  </p>
                )}
              </div>
            </>
          )}

          {tab === "juz" && (
            /* Cuz listesi */
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
                    {/* Sol %50 -- sure navigasyonu */}
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
                    {/* Sag %50 -- sayfa navigasyonu */}
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

          {tab === "curated" && (
            /* Secmeler -- curated surah collections */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Surah list for selected collection */}
              <div className="overflow-y-auto flex-1">
                {expandedCollection ? (
                  CURATED_COLLECTIONS[expandedCollection].map((id) => {
                    const surah = surahs.find((s) => s.id === id);
                    if (!surah) return null;
                    const isActive = id === currentSurahId;
                    const target =
                      mode === "page"
                        ? { to: "/page/$pageNumber" as const, params: { pageNumber: String(surah.pageStart) }, search: { ayah: undefined } }
                        : { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(id) }, search: { ayah: undefined } };
                    return (
                      <Link
                        key={id}
                        {...target}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                          isActive
                            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "hover:bg-[var(--color-surface)]"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[10px] text-[var(--color-text-secondary)] shrink-0">
                          {id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate">{getSurahName(id, locale) || surah.nameSimple}</span>
                            <span className="text-xs shrink-0" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                              {surah.nameArabic}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-[var(--color-text-secondary)] py-8">
                    {t.surahList.curated}
                  </p>
                )}
              </div>

              {/* Collection chips -- pinned at bottom */}
              <div className="grid grid-cols-2 gap-1.5 px-2.5 py-2 border-t border-[var(--color-border)] shrink-0">
                {(
                  [
                    { key: "prayer" as CollectionKey, label: t.surahList.curatedPrayer },
                    { key: "popular" as CollectionKey, label: t.surahList.curatedPopular },
                    { key: "amma" as CollectionKey, label: t.surahList.curatedAmma },
                    { key: "tabaraka" as CollectionKey, label: t.surahList.curatedTabaraka },
                  ] as const
                ).map(({ key, label }) => {
                  const isSelected = expandedCollection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setExpandedCollection(isSelected ? null : key)}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                        isSelected
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                      }`}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 6L5 8.5L9.5 3.5" />
                        </svg>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
