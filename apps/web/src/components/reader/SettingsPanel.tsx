/**
 * Ayar paneli — sağdan açılır sheet.
 */

import { useMemo, useEffect, useRef } from "react";
import { useSettingsStore, type Theme, type TextStyle, type WbwDisplay } from "~/stores/settings.store";
import { useQuery } from "@tanstack/react-query";
import { recitersQueryOptions, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { getAllLocaleConfigs, type Locale } from "~/locales/registry";
import { SearchableSelect } from "~/components/SearchableSelect";
import { GroupedMultiSelect } from "~/components/GroupedMultiSelect";

/** Dil kodu → görüntülenecek isim */
const LANG_LABELS: Record<string, string> = {
  tr: "Türkçe", en: "English", ar: "العربية", fr: "Français",
  es: "Español", de: "Deutsch", nl: "Nederlands", bn: "বাংলা",
  fa: "فارسی", id: "Bahasa", it: "Italiano", pt: "Português",
  ru: "Русский", sq: "Shqip", th: "ไทย", ur: "اردو",
  zh: "中文", ms: "Melayu", sw: "Kiswahili", vi: "Tiếng Việt",
};

const THEMES: {
  id: Theme;
  labelKey: "papyrus" | "sea" | "night" | "seher";
  bg: string;
  surface: string;
  text: string;
  accent: string;
}[] = [
  { id: "papyrus", labelKey: "papyrus", bg: "#f5efe0", surface: "#ece4d0", text: "#2c2416", accent: "#8b6914" },
  { id: "sea",     labelKey: "sea",     bg: "#eef3f2", surface: "#e0eae6", text: "#1a2c28", accent: "#0d7377" },
  { id: "night",   labelKey: "night",   bg: "#0f0e0c", surface: "#1a1814", text: "#f0ece4", accent: "#7aad4a" },
  { id: "seher",   labelKey: "seher",   bg: "#1a1018", surface: "#241c22", text: "#f0e6e8", accent: "#c47a5a" },
];

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  context?: { surahId?: number; pageNumber?: number };
}

export function SettingsPanel({ open, onClose, context }: SettingsPanelProps) {
  const {
    labsEnabled, setLabsEnabled,
    showTranslation, toggleTranslation,
    showWbw, toggleWbw,
    wbwTranslation, setWbwTranslation,
    wbwTranslit, setWbwTranslit,
    showTajweed, toggleTajweed,
    readingMode, setReadingMode,
    translationSlugs, toggleTranslationSlug, moveTranslationSlug, setTranslation,
    arabicFontSize, setArabicFontSize,
    translationFontSize, setTranslationFontSize,
    reciterSlug, setReciter,
    textStyle, setTextStyle,
    theme, setTheme,
    resetToDefaults,
  } = useSettingsStore();

  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: reciterList } = useQuery({ ...recitersQueryOptions(), enabled: open });
  const { data: translationList } = useQuery({ ...translationSourcesQueryOptions(), enabled: open });

  const LANG_ORDER = ["tr", "en", "es", "fr", "ar", "de", "nl"];

  const langOrder = useMemo(() => [locale, ...LANG_ORDER.filter((l) => l !== locale)], [locale]);

  const translationOptions = useMemo(() => {
    if (!translationList || translationList.length === 0) return [];
    return translationList.map((src) => {
      const lang = LANG_LABELS[src.language] || src.language;
      return {
        value: src.slug,
        label: src.name,
        group: lang,
        searchText: [lang, src.author, src.name].join(" "),
      };
    });
  }, [translationList]);

  const groupOrder = useMemo(
    () => langOrder.map((l) => LANG_LABELS[l] || l),
    [langOrder],
  );

  const reciterOptions = useMemo(() => {
    if (!reciterList || reciterList.length === 0) return [];
    return reciterList.map((r) => ({
      value: r.slug,
      label: r.nameArabic ? `${r.name} — ${r.nameArabic}` : r.name,
      searchText: [r.name, r.nameArabic, r.slug].filter(Boolean).join(" "),
    }));
  }, [reciterList]);

  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    if (!translationList || translationList.length === 0) return;
    // Eğer seçili mealler zaten yeni locale'i içeriyorsa değiştirme
    const hasLocaleMatch = translationSlugs.some((slug) => {
      const src = translationList.find((s) => s.slug === slug);
      return src?.language === locale;
    });
    if (hasLocaleMatch) return;
    const match = translationList.find((s) => s.language === locale);
    if (match) setTranslation(match.slug);
  }, [locale, translationList, translationSlugs, setTranslation]);

  // Track if mode changed so we navigate on close
  const modeChangedRef = useRef<{ mode: "page" | "list" } | null>(null);

  if (!open) return null;

  const handleModeChange = (mode: "page" | "list") => {
    setReadingMode(mode);
    // Defer navigation to panel close so user can keep adjusting settings
    const isOnPage = currentPath.startsWith("/page/");
    const isOnSurah = currentPath.startsWith("/surah/");
    if ((mode === "list" && isOnPage) || (mode === "page" && isOnSurah)) {
      modeChangedRef.current = { mode };
    }
  };

  const handleClose = () => {
    const pending = modeChangedRef.current;
    modeChangedRef.current = null;
    onClose();
    if (pending) {
      if (pending.mode === "list" && context?.surahId) {
        navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(context.surahId) }, search: { ayah: undefined } });
      } else if (pending.mode === "page" && context?.pageNumber) {
        navigate({ to: "/page/$pageNumber", params: { pageNumber: String(context.pageNumber) }, search: { ayah: undefined } });
      }
    }
  };

  const arabicMin = 1.2, arabicMax = 5.0;
  const mealMin = 0.75, mealMax = 2.0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-xl overflow-y-auto">
        <div className="p-4">
          {/* Başlık */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">{t.settings.title}</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              aria-label={t.settings.close}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 5L13 13M13 5L5 13" />
              </svg>
            </button>
          </div>

          {/* ── Dil ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              {getAllLocaleConfigs().map(({ code, config }) => (
                <option key={code} value={code}>{config.displayName}</option>
              ))}
            </select>
          </div>

          {/* ── Tema — mini preview kartları ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <div className="grid grid-cols-4 gap-1.5">
              {THEMES.map((item) => {
                const active = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className="group relative flex flex-col items-center gap-1 focus:outline-none"
                    aria-label={t.settings.themes[item.labelKey]}
                  >
                    {/* Mini preview card */}
                    <div
                      className="w-full aspect-[3/4] rounded-lg overflow-hidden transition-all"
                      style={{
                        background: item.bg,
                        boxShadow: active
                          ? `0 0 0 2px ${item.accent}`
                          : "0 0 0 1px rgba(128,128,128,0.15)",
                      }}
                    >
                      {/* Simulated content lines */}
                      <div className="flex flex-col items-center justify-center h-full gap-1 px-1.5">
                        <span
                          className="text-[11px] leading-none"
                          style={{ color: item.text, fontFamily: "var(--font-arabic)" }}
                        >
                          بسم
                        </span>
                        <div className="flex flex-col gap-[3px] w-full items-center">
                          <span className="block rounded-full h-[2px] w-[70%]" style={{ background: item.text, opacity: 0.2 }} />
                          <span className="block rounded-full h-[2px] w-[50%]" style={{ background: item.text, opacity: 0.12 }} />
                        </div>
                        {/* Accent strip */}
                        <span className="block rounded-full h-[3px] w-[40%] mt-0.5" style={{ background: item.accent }} />
                      </div>
                    </div>
                    {/* Label */}
                    <span
                      className="text-[10px] font-medium transition-colors"
                      style={{ color: active ? item.accent : "var(--color-text-secondary)" }}
                    >
                      {t.settings.themes[item.labelKey]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Okuma Modu ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">
              {t.settings.readingMode}
            </label>
            <SegmentedControl
              options={[
                { value: "page", label: t.settings.mushafPage },
                { value: "list", label: t.settings.verseList },
              ]}
              value={readingMode}
              onChange={(v) => handleModeChange(v as "page" | "list")}
            />
          </div>

          {/* ── Meal + WBW ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                {t.settings.translation}
              </label>
              <Toggle checked={showTranslation} onChange={toggleTranslation} />
            </div>
            {showTranslation && (
              <>
                <GroupedMultiSelect
                  options={translationOptions}
                  values={translationSlugs}
                  onChange={toggleTranslationSlug}
                  placeholder={t.settings.select}
                  searchPlaceholder={t.settings.searchTranslation}
                  noResultsText={t.common.noResults}
                  groupOrder={groupOrder}
                />
                {/* Seçili meallerin sıralama listesi */}
                {translationSlugs.length > 1 && (
                  <div className="mt-2 space-y-0.5">
                    {translationSlugs.map((slug, i) => {
                      const opt = translationOptions.find((o) => o.value === slug);
                      return (
                        <div
                          key={slug}
                          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg)] px-2 py-1"
                        >
                          <span className="text-[0.65rem] font-bold text-[var(--color-accent)] w-4 text-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-xs truncate">
                            {opt ? `${opt.group} / ${opt.label}` : slug}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveTranslationSlug(slug, "up")}
                            disabled={i === 0}
                            className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors"
                            aria-label="Yukarı taşı"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 7.5L6 4.5L9 7.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTranslationSlug(slug, "down")}
                            disabled={i === translationSlugs.length - 1}
                            className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors"
                            aria-label="Aşağı taşı"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 4.5L6 7.5L9 4.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTranslationSlug(slug)}
                            className="p-0.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                            aria-label="Kaldır"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 3L9 9M9 3L3 9" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <label className="text-[11px] text-[var(--color-text-secondary)]">
                    {t.settings.wordByWord}
                  </label>
                  <Toggle checked={showWbw} onChange={toggleWbw} />
                </div>
                {showWbw && (
                  <div className="mt-2 space-y-1.5 pl-1">
                    <WbwDisplayControl label={t.settings.wbwTranslation} value={wbwTranslation} onChange={setWbwTranslation} t={t} />
                    <WbwDisplayControl label={t.settings.wbwTransliteration} value={wbwTranslit} onChange={setWbwTranslit} t={t} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Metin Stili + Tecvid ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                {t.settings.textStyle}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text-secondary)]">{t.settings.tajweed}</span>
                <Toggle checked={showTajweed} onChange={toggleTajweed} disabled={textStyle === "basic"} />
              </div>
            </div>
            <SegmentedControl
              options={[
                { value: "uthmani", label: "Uthmani" },
                { value: "basic", label: "Basic" },
              ]}
              value={textStyle}
              onChange={(v) => setTextStyle(v as TextStyle)}
            />
          </div>

          {/* ── Yazı Boyutu ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                {t.settings.fontSize}
              </label>
              <button
                onClick={() => { setArabicFontSize(1.8); setTranslationFontSize(0.95); }}
                className="text-[11px] text-[var(--color-accent)] hover:underline"
              >
                {t.settings.fontDefault}
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text-secondary)] w-12 shrink-0">{t.settings.arabic}</span>
                <input type="range" min={arabicMin} max={arabicMax} step={0.1} value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(parseFloat(e.target.value))} className="settings-range flex-1" />
                <span className="text-[11px] tabular-nums text-[var(--color-text-secondary)] w-7 text-right">{arabicFontSize.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text-secondary)] w-12 shrink-0">{t.settings.translation}</span>
                <input type="range" min={mealMin} max={mealMax} step={0.05} value={translationFontSize}
                  onChange={(e) => setTranslationFontSize(parseFloat(e.target.value))} className="settings-range flex-1" />
                <span className="text-[11px] tabular-nums text-[var(--color-text-secondary)] w-7 text-right">{translationFontSize.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Kari ── */}
          {reciterOptions.length > 0 && (
            <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                {t.settings.reciter}
              </label>
              <SearchableSelect
                options={reciterOptions}
                value={reciterSlug}
                onChange={setReciter}
                placeholder={t.settings.select}
                searchPlaceholder={t.settings.searchReciter}
                noResultsText={t.common.noResults}
              />
            </div>
          )}

          {/* ── Keşif Modu (Labs) ── */}
          <div className="mb-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
                  <path d="M9 3H15V8L19 14V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V14L9 8V3Z" />
                  <path d="M9 3H15" />
                  <path d="M12 11V15" />
                  <path d="M10 13H14" />
                </svg>
                <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                  {t.settings.labs}
                </label>
              </div>
              <Toggle checked={labsEnabled} onChange={() => setLabsEnabled(!labsEnabled)} />
            </div>
            <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 opacity-70">
              {t.settings.labsDesc}
            </p>
          </div>

          {/* ── Sıfırla ── */}
          <button
            onClick={resetToDefaults}
            className="w-full py-2 rounded-lg border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            {t.settings.resetAll}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Segmented Control ────────────────────────────────────

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${
            value === opt.value
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        disabled
          ? "bg-[var(--color-border)] opacity-40 cursor-not-allowed"
          : checked
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

// ── WBW 3-state kontrol ──────────────────────────────────

const WBW_OPTIONS: WbwDisplay[] = ["off", "hover", "on"];

function WbwDisplayControl({ label, value, onChange, t }: {
  label: string;
  value: WbwDisplay;
  onChange: (v: WbwDisplay) => void;
  t: any;
}) {
  const labels: Record<WbwDisplay, string> = {
    off: t.settings.wbwOff,
    hover: t.settings.wbwHover,
    on: t.settings.wbwOn,
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-[var(--color-text-secondary)] shrink-0">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        {WBW_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              value === opt
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}
