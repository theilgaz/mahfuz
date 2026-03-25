/**
 * Ayar paneli — sağdan açılır sheet.
 * Sadece gerekli ayarlar: meal, tecvid, okuma modu.
 */

import { useMemo, useEffect, useRef } from "react";
import { useSettingsStore, type Theme, type TextStyle } from "~/stores/settings.store";
import { useQuery } from "@tanstack/react-query";
import { recitersQueryOptions, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { getAllLocaleConfigs, type Locale } from "~/locales/registry";
import { SearchableSelect } from "~/components/SearchableSelect";

/** Dil kodu → görüntülenecek isim */
const LANG_LABELS: Record<string, string> = {
  tr: "Türkçe", en: "English", ar: "العربية", fr: "Français",
  es: "Español", de: "Deutsch", nl: "Nederlands", bn: "বাংলা",
  fa: "فارسی", id: "Bahasa", it: "Italiano", pt: "Português",
  ru: "Русский", sq: "Shqip", th: "ไทย", ur: "اردو",
  zh: "中文", ms: "Melayu", sw: "Kiswahili", vi: "Tiếng Việt",
};

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Mevcut okuma bağlamı — mod değişince doğru route'a yönlendirmek için */
  context?: { surahId?: number; pageNumber?: number };
}

export function SettingsPanel({ open, onClose, context }: SettingsPanelProps) {
  const {
    showTranslation,
    toggleTranslation,
    showTajweed,
    toggleTajweed,
    readingMode,
    setReadingMode,
    translationSlug,
    setTranslation,
    arabicFontSize,
    setArabicFontSize,
    translationFontSize,
    setTranslationFontSize,
    reciterSlug,
    setReciter,
    textStyle,
    setTextStyle,
    theme,
    setTheme,
    resetToDefaults,
  } = useSettingsStore();

  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: reciterList } = useQuery({
    ...recitersQueryOptions(),
    enabled: open,
  });
  const { data: translationList } = useQuery({
    ...translationSourcesQueryOptions(),
    enabled: open,
  });

  // Dil sıralaması — aktif locale en üstte, sonra sabit sıra
  const LANG_ORDER = ["tr", "en", "es", "fr", "ar", "de", "nl"];

  // Build SearchableSelect options from translationList, sorted by language order
  const translationOptions = useMemo(() => {
    if (!translationList || translationList.length === 0) return [];

    // Aktif dil en üste, sonra LANG_ORDER sırası, sonra geri kalanlar
    const order = [locale, ...LANG_ORDER.filter((l) => l !== locale)];
    const langRank = (lang: string) => {
      const idx = order.indexOf(lang);
      return idx >= 0 ? idx : order.length;
    };

    const sorted = [...translationList].sort((a, b) => langRank(a.language) - langRank(b.language));

    return sorted.map((src) => {
      const lang = LANG_LABELS[src.language] || src.language;
      return {
        value: src.slug,
        label: `${lang} / ${src.name}`,
        searchText: [lang, src.author, src.name].join(" "),
      };
    });
  }, [translationList, locale]);

  // Build SearchableSelect options from reciterList
  const reciterOptions = useMemo(() => {
    if (!reciterList || reciterList.length === 0) return [];
    return reciterList.map((r) => ({
      value: r.slug,
      label: r.nameArabic ? `${r.name} — ${r.nameArabic}` : r.name,
      searchText: [r.name, r.nameArabic, r.slug].filter(Boolean).join(" "),
    }));
  }, [reciterList]);

  // Auto-select first translation of current locale's language
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    if (!translationList || translationList.length === 0) return;

    // Already using a translation in the target language?
    const current = translationList.find((s) => s.slug === translationSlug);
    if (current?.language === locale) return;

    // Pick first available for this language
    const match = translationList.find((s) => s.language === locale);
    if (match) setTranslation(match.slug);
  }, [locale, translationList, translationSlug, setTranslation]);

  if (!open) return null;

  const handleModeChange = (mode: "page" | "list") => {
    setReadingMode(mode);

    // Aktif okuma route'undaysak, mod değişince yönlendir
    const isOnPage = currentPath.startsWith("/page/");
    const isOnSurah = currentPath.startsWith("/surah/");

    if (mode === "list" && isOnPage && context?.surahId) {
      onClose();
      navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(context.surahId) }, search: { ayah: undefined } });
    } else if (mode === "page" && isOnSurah && context?.pageNumber) {
      onClose();
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(context.pageNumber) }, search: { ayah: undefined } });
    }
  };

  const arabicMin = 1.2, arabicMax = 5.0;
  const mealMin = 0.75, mealMax = 2.0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-xl overflow-y-auto">
        <div className="p-4">
          {/* Başlık */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">{t.settings.title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              aria-label={t.settings.close}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 5L13 13M13 5L5 13" />
              </svg>
            </button>
          </div>

          {/* Dil + Tema — yan yana */}
          <div className="flex gap-3 mb-4">
            {/* Dil */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                {t.settings.language}
              </label>
              <div className="flex flex-wrap gap-1">
                {getAllLocaleConfigs().map(({ code, config }) => (
                  <button
                    key={code}
                    onClick={() => setLocale(code)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      locale === code
                        ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {config.displayName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tema — yatay renkli daireler */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
              {t.settings.theme}
            </label>
            <div className="flex gap-1.5">
              {([
                { id: "papyrus", labelKey: "papyrus" as const, bg: "#f5efe0", fg: "#2c2416", accent: "#8b6914" },
                { id: "sea", labelKey: "sea" as const, bg: "#eef3f2", fg: "#1a2c28", accent: "#0d7377" },
                { id: "night", labelKey: "night" as const, bg: "#0f0e0c", fg: "#f0ece4", accent: "#7aad4a" },
              ]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id as Theme)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border-2 transition-colors ${
                    theme === item.id
                      ? "border-[var(--color-accent)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                  }`}
                  style={{ background: item.bg, color: item.fg }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.accent }} />
                  {t.settings.themes[item.labelKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Okuma Modu */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
              {t.settings.readingMode}
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleModeChange("page")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs border transition-colors ${
                  readingMode === "page"
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {t.settings.mushafPage}
              </button>
              <button
                onClick={() => handleModeChange("list")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs border transition-colors ${
                  readingMode === "list"
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {t.settings.verseList}
              </button>
            </div>
          </div>

          {/* Meal */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {t.settings.translation}
              </label>
              <Toggle checked={showTranslation} onChange={toggleTranslation} />
            </div>
            {showTranslation && (
              <SearchableSelect
                options={translationOptions}
                value={translationSlug}
                onChange={setTranslation}
                placeholder={t.settings.select}
                searchPlaceholder={t.settings.searchTranslation}
                noResultsText={t.common.noResults}
              />
            )}
          </div>

          {/* Metin Stili + Tecvid — tek satır */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {t.settings.textStyle}
              </label>
              <div className="flex-1" />
              <span className="text-[11px] text-[var(--color-text-secondary)]">{t.settings.tajweed}</span>
              <Toggle checked={showTajweed} onChange={toggleTajweed} disabled={textStyle === "basic"} />
            </div>
            <div className="flex gap-1.5">
              {([
                { id: "uthmani", label: "Uthmani", sample: "بِسۡمِ ٱللَّهِ" },
                { id: "basic", label: "Basic", sample: "بسم الله" },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTextStyle(opt.id)}
                  className={`flex-1 py-2 px-2 rounded-lg border transition-colors text-center ${
                    textStyle === opt.id
                      ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <span className="block text-base leading-tight" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                    {opt.sample}
                  </span>
                  <span className="text-[10px] opacity-70">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Yazı Boyutu */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {t.settings.fontSize}
              </label>
              <button
                onClick={() => {
                  setArabicFontSize(1.8);
                  setTranslationFontSize(0.95);
                }}
                className="text-[11px] text-[var(--color-accent)] hover:underline"
              >
                {t.settings.fontDefault}
              </button>
            </div>

            {/* Arapça boyutu */}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0">{t.settings.arabic}</span>
                <input
                  type="range"
                  min={arabicMin}
                  max={arabicMax}
                  step={0.1}
                  value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(parseFloat(e.target.value))}
                  className="settings-range flex-1"
                />
                <span className="text-[11px] tabular-nums text-[var(--color-text-secondary)] w-7 text-right">{arabicFontSize.toFixed(1)}</span>
              </div>
            </div>

            {/* Meal boyutu */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0">{t.settings.translation}</span>
                <input
                  type="range"
                  min={mealMin}
                  max={mealMax}
                  step={0.05}
                  value={translationFontSize}
                  onChange={(e) => setTranslationFontSize(parseFloat(e.target.value))}
                  className="settings-range flex-1"
                />
                <span className="text-[11px] tabular-nums text-[var(--color-text-secondary)] w-7 text-right">{translationFontSize.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Kari seçimi */}
          {reciterOptions.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
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

          {/* Tümünü sıfırla */}
          <div className="pt-3 border-t border-[var(--color-border)]">
            <button
              onClick={resetToDefaults}
              className="w-full py-2 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              {t.settings.resetAll}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toggle bileşeni ──────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        disabled
          ? "bg-[var(--color-border)] opacity-40 cursor-not-allowed"
          : checked
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
