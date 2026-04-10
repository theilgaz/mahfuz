/**
 * Ayar paneli — sağdan açılır sheet.
 * İki sekme: Okuma (sık kullanılan) + Genel (nadir değişen).
 */

import { useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useSettingsStore, COLOR_PALETTES, type Theme, type TextStyle, type ReadingMode, type ColorPaletteId, type SeherOverride } from "~/stores/settings.store";
import { isDaytime, nextTransition } from "~/lib/solar";
import { useQuery } from "@tanstack/react-query";
import { recitersQueryOptions, translationSourcesQueryOptions } from "~/hooks/useQuranQuery";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { getAllLocaleConfigs, type Locale } from "~/locales/registry";
import { SearchableSelect } from "~/components/SearchableSelect";
import { GroupedMultiSelect } from "~/components/GroupedMultiSelect";

// ── Constants ────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  tr: "Türkçe", en: "English", ar: "العربية", fr: "Français",
  es: "Español", de: "Deutsch", nl: "Nederlands", bn: "বাংলা",
  fa: "فارسی", id: "Bahasa", it: "Italiano", pt: "Português",
  ru: "Русский", sq: "Shqip", th: "ไทย", ur: "اردو",
  zh: "中文", ms: "Melayu", sw: "Kiswahili", vi: "Tiếng Việt",
};

interface ThemeDef {
  id: Theme;
  labelKey: "papyrus" | "sea" | "night" | "seher";
  bg: string;
  text: string;
  accent: string;
  split?: { bg2: string; text2: string };
}

const THEMES: ThemeDef[] = [
  { id: "papyrus", labelKey: "papyrus", bg: "#f5efe0", text: "#2c2416", accent: "#8b6914" },
  { id: "sea",     labelKey: "sea",     bg: "#eef3f2", text: "#1a2c28", accent: "#0d7377" },
  { id: "night",   labelKey: "night",   bg: "#0f0e0c", text: "#f0ece4", accent: "#7aad4a" },
  { id: "seher",   labelKey: "seher",   bg: "#f5ede8", text: "#2a1a20", accent: "#c47a5a",
    split: { bg2: "#1a1018", text2: "#f0e6e8" } },
];

// ── Okuma modu ikonları ───────────────────────────────────

function MushafIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="4" y1="7" x2="8" y2="7" />
      <line x1="4" y1="10" x2="8" y2="10" />
      <line x1="4" y1="13" x2="8" y2="13" />
      <line x1="12" y1="7" x2="16" y2="7" />
      <line x1="12" y1="10" x2="16" y2="10" />
      <line x1="12" y1="13" x2="16" y2="13" />
    </svg>
  );
}

function VerseIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round">
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="11" y2="15" />
    </svg>
  );
}

function WbwIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="7" rx="1.5" />
      <rect x="11" y="3" width="7" height="7" rx="1.5" />
      <rect x="2" y="12" width="7" height="5" rx="1.5" />
      <rect x="11" y="12" width="7" height="5" rx="1.5" />
    </svg>
  );
}

// ── Main Panel ───────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  context?: { surahId?: number; pageNumber?: number };
}

export function SettingsPanel({ open, onClose, context }: SettingsPanelProps) {
  const [tab, setTab] = useState<"reading" | "general">("reading");
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const panelRef = useRef<HTMLDivElement>(null);
  const stableOnClose = useCallback(() => onClose(), [onClose]);
  useFocusTrap(panelRef, open, stableOnClose);

  const store = useSettingsStore();
  const { data: reciterList } = useQuery(recitersQueryOptions());
  const { data: translationList } = useQuery(translationSourcesQueryOptions());

  // Auto-switch translation on locale change
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    if (!translationList?.length) return;
    const hasMatch = store.translationSlugs.some((slug) => translationList.find((s) => s.slug === slug)?.language === locale);
    if (hasMatch) return;
    const match = translationList.find((s) => s.language === locale);
    if (match) store.setTranslation(match.slug);
  }, [locale, translationList, store.translationSlugs, store.setTranslation]);

  if (!open) return null;

  const handleModeChange = (mode: ReadingMode) => {
    store.setReadingMode(mode);
    const isOnPage = currentPath.startsWith("/page/");
    const isOnSurah = currentPath.startsWith("/surah/");
    if (mode !== "mushaf" && isOnPage && context?.surahId) {
      onClose();
      navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(context.surahId) }, search: { ayah: undefined } });
    } else if (mode === "mushaf" && isOnSurah) {
      onClose();
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(context?.pageNumber || 1) }, search: { ayah: undefined } });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={t.settings.title} className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-xl overflow-y-auto">
        <div className="flex flex-col min-h-full p-4">
          {/* Header + tabs */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium">{t.settings.title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors" aria-label={t.settings.close}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 5L13 13M13 5L5 13" />
              </svg>
            </button>
          </div>

          {/* Tab bar */}
          <div role="tablist" className="flex rounded-lg overflow-hidden border border-[var(--color-border)] mb-4">
            <button
              role="tab"
              aria-selected={tab === "reading"}
              aria-controls="settings-tab-reading"
              onClick={() => setTab("reading")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "reading" ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
              }`}
            >
              {t.settings.tabs.reading}
            </button>
            <button
              role="tab"
              aria-selected={tab === "general"}
              aria-controls="settings-tab-general"
              onClick={() => setTab("general")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "general" ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
              }`}
            >
              {t.settings.tabs.general}
            </button>
          </div>

          {/* Tab content */}
          {tab === "reading" ? (
            <ReadingTab
              store={store}
              reciterList={reciterList}
              translationList={translationList}
              locale={locale}
              t={t}
              onModeChange={handleModeChange}
            />
          ) : (
            <GeneralTab
              store={store}
              locale={locale}
              setLocale={setLocale}
              t={t}
            />
          )}

          {/* لَا غَالِبَ إِلَّا ٱللّٰهُ */}
          <div className="flex-1" />
          <p
            className="text-center text-[var(--color-text-secondary)] select-none mb-[5px]"
            style={{ fontFamily: "var(--font-arabic)", fontSize: "1.1rem", opacity: 0.70, lineHeight: 1.8 }}
            dir="rtl"
          >
            لَا غَالِبَ إِلَّا ٱللّٰهُ
          </p>
        </div>
      </div>
    </>
  );
}

// ── Tab 1: Okuma ─────────────────────────────────────────

function ReadingTab({ store, reciterList, translationList, locale, t, onModeChange }: {
  store: ReturnType<typeof useSettingsStore>;
  reciterList: any;
  translationList: any;
  locale: string;
  t: any;
  onModeChange: (mode: ReadingMode) => void;
}) {
  const LANG_ORDER = ["tr", "en", "es", "fr", "ar", "de", "nl"];
  const langOrder = useMemo(() => [locale, ...LANG_ORDER.filter((l) => l !== locale)], [locale]);

  const translationOptions = useMemo(() => {
    if (!translationList?.length) return [];
    return translationList.map((src: any) => ({
      value: src.slug,
      label: src.name,
      group: LANG_LABELS[src.language] || src.language,
      searchText: [LANG_LABELS[src.language], src.author, src.name].join(" "),
    }));
  }, [translationList]);

  const groupOrder = useMemo(() => langOrder.map((l) => LANG_LABELS[l] || l), [langOrder]);

  const reciterOptions = useMemo(() => {
    if (!reciterList?.length) return [];
    return reciterList.map((r: any) => ({
      value: r.slug,
      label: r.nameArabic ? `${r.name} · ${r.nameArabic}` : r.name,
      searchText: [r.name, r.nameArabic, r.slug].filter(Boolean).join(" "),
    }));
  }, [reciterList]);

  const arabicMin = 1.2, arabicMax = 5.0;
  const mealMin = 0.75, mealMax = 2.0;

  return (
    <div id="settings-tab-reading" role="tabpanel" className="space-y-4">
      {/* ── Yazı Boyutu + canlı önizleme ── */}
      <div>
        <p
          className="text-center mb-1 text-[var(--color-text-primary)] leading-[2]"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: `${store.arabicFontSize}rem` }}
        >
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <p
          className="text-center mb-2 text-[var(--color-text-translation)] leading-relaxed"
          style={{ fontSize: `${store.translationFontSize}rem` }}
        >
          {t.settings.mealPreview}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button onClick={() => store.setArabicFontSize(store.arabicFontSize - 0.2)} className="w-7 h-7 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-xs font-bold shrink-0" aria-label={`${t.a11y?.arabicFontSize ?? "Arabic font size"} -`}>A-</button>
            <input type="range" min={arabicMin} max={arabicMax} step={0.1} value={store.arabicFontSize}
              onChange={(e) => store.setArabicFontSize(parseFloat(e.target.value))} className="settings-range flex-1"
              aria-label={t.a11y?.arabicFontSize ?? "Arabic font size"} aria-valuemin={arabicMin} aria-valuemax={arabicMax} aria-valuenow={store.arabicFontSize} />
            <button onClick={() => store.setArabicFontSize(store.arabicFontSize + 0.2)} className="w-7 h-7 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-xs font-bold shrink-0" aria-label={`${t.a11y?.arabicFontSize ?? "Arabic font size"} +`}>A+</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-text-secondary)] w-7 text-center shrink-0">{t.settings.translation}</span>
            <input type="range" min={mealMin} max={mealMax} step={0.05} value={store.translationFontSize}
              onChange={(e) => store.setTranslationFontSize(parseFloat(e.target.value))} className="settings-range flex-1"
              aria-label={t.a11y?.translationFontSize ?? "Translation font size"} aria-valuemin={mealMin} aria-valuemax={mealMax} aria-valuenow={store.translationFontSize} />
            <button
              onClick={() => { store.setArabicFontSize(1.8); store.setTranslationFontSize(0.95); }}
              className="text-[10px] text-[var(--color-accent)] shrink-0"
            >
              {t.settings.fontDefault}
            </button>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Kari ── */}
      {reciterOptions.length > 0 && (
        <>
          <div>
            <Label>{t.settings.reciter}</Label>
            <SearchableSelect
              options={reciterOptions}
              value={store.reciterSlug}
              onChange={store.setReciter}
              placeholder={t.settings.select}
              searchPlaceholder={t.settings.searchReciter}
              noResultsText={t.common.noResults}
            />
          </div>
          <Divider />
        </>
      )}

      {/* ── Meal ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>{t.settings.translation}</Label>
          <Toggle checked={store.showTranslation} onChange={store.toggleTranslation} />
        </div>
        {store.showTranslation && (
          <>
            <GroupedMultiSelect
              options={translationOptions}
              values={store.translationSlugs}
              onChange={store.toggleTranslationSlug}
              placeholder={t.settings.select}
              searchPlaceholder={t.settings.searchTranslation}
              noResultsText={t.common.noResults}
              groupOrder={groupOrder}
            />
            {store.translationSlugs.length > 1 && (
              <TranslationReorder store={store} translationOptions={translationOptions} />
            )}
          </>
        )}
      </div>

      <Divider />

      {/* ── Okuma Modu — 3 seçenek ── */}
      <div>
        <Label>{t.settings.readingMode}</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {([
            { value: "mushaf" as ReadingMode, label: t.settings.modeMushaf, icon: MushafIcon },
            { value: "verse" as ReadingMode, label: t.settings.modeVerse, icon: VerseIcon },
            { value: "wbw" as ReadingMode, label: t.settings.modeWbw, icon: WbwIcon },
          ] as const).map(({ value, label, icon: Icon }) => {
            const active = store.readingMode === value;
            return (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-[10px] font-medium leading-tight transition-colors ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40"
                }`}
              >
                <Icon size={18} active={active} />
                <span className="text-center">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Mod bazlı seçenekler */}
        <div className="mt-3 space-y-2">
          {/* Mushaf + Ayet Ayet: Meal toggle */}
          {store.readingMode !== "wbw" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)]">{t.settings.translation}</span>
              <Toggle checked={store.showTranslation} onChange={store.toggleTranslation} />
            </div>
          )}
          {/* Kırık Meal: Transliterasyon toggle */}
          {store.readingMode === "wbw" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)]">{t.settings.wbwTransliteration}</span>
              <Toggle checked={store.showTranslit} onChange={store.toggleTranslit} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Genel ─────────────────────────────────────────

function GeneralTab({ store, locale, setLocale, t }: {
  store: ReturnType<typeof useSettingsStore>;
  locale: string;
  setLocale: (l: Locale) => void;
  t: any;
}) {
  return (
    <div id="settings-tab-general" role="tabpanel" className="space-y-4">
      {/* ── Tema ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {THEMES.map((item) => {
          const active = store.theme === item.id;
          return (
            <button
              key={item.id}
              onClick={() => store.setTheme(item.id)}
              className="flex flex-col items-center gap-1 focus:outline-none"
              aria-label={t.settings.themes[item.labelKey]}
            >
              <div
                className="w-full aspect-[3/4] rounded-lg overflow-hidden transition-all relative"
                style={{
                  background: item.split
                    ? `linear-gradient(135deg, ${item.bg} 50%, ${item.split.bg2} 50%)`
                    : item.bg,
                  boxShadow: active ? `0 0 0 2px ${item.accent}` : "0 0 0 1px rgba(128,128,128,0.15)",
                }}
              >
                <div className="flex flex-col items-center justify-center h-full gap-1 px-1.5">
                  <span className="text-[11px] leading-none" style={{ color: item.split ? item.text : item.text, fontFamily: "var(--font-arabic)" }}>
                    بسم
                  </span>
                  <span className="block rounded-full h-[3px] w-[40%]" style={{ background: item.accent }} />
                  {item.split && (
                    <span className="text-[9px] leading-none" style={{ color: item.split.text2, fontFamily: "var(--font-arabic)" }}>
                      الله
                    </span>
                  )}
                  {!item.split && (
                    <div className="flex flex-col gap-[3px] w-full items-center">
                      <span className="block rounded-full h-[2px] w-[70%]" style={{ background: item.text, opacity: 0.15 }} />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium" style={{ color: active ? item.accent : "var(--color-text-secondary)" }}>
                {t.settings.themes[item.labelKey]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Seher geçiş modu (yalnızca Seher teması seçiliyse) ── */}
      {store.theme === "seher" && (
        <SeherControls store={store} t={t} />
      )}

      <Divider />

      {/* ── Dil ── */}
      <div>
        <Label>{t.settings.language}</Label>
        <select
          aria-label={t.settings.language}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
        >
          {getAllLocaleConfigs().map(({ code, config }) => (
            <option key={code} value={code}>{config.displayName}</option>
          ))}
        </select>
      </div>

      <Divider />

      {/* ── Metin Stili + Tecvid ── */}
      <div>
        <Label>{t.settings.textStyle}</Label>
        <SegmentedControl
          options={[
            { value: "uthmani", label: "Uthmani" },
            { value: "basic", label: "Basic" },
          ]}
          value={store.textStyle}
          onChange={(v) => store.setTextStyle(v as TextStyle)}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[var(--color-text-secondary)]">{t.settings.tajweed}</span>
          <Toggle checked={store.showTajweed} onChange={store.toggleTajweed} disabled={store.textStyle === "basic" || store.colorizeWords} />
        </div>
      </div>

      <Divider />

      {/* ── Kelime Renklendirme ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>{t.settings.colorize}</Label>
          <Toggle checked={store.colorizeWords} onChange={() => store.setColorizeWords(!store.colorizeWords)} />
        </div>
        {store.colorizeWords && (
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(COLOR_PALETTES) as [ColorPaletteId, typeof COLOR_PALETTES[ColorPaletteId]][]).map(([id, palette]) => (
              <button
                key={id}
                onClick={() => store.setColorPaletteId(id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors"
                style={{
                  borderColor: store.colorPaletteId === id ? "var(--color-accent)" : "var(--color-border)",
                  background: store.colorPaletteId === id ? "var(--color-accent)" : "transparent",
                }}
              >
                <div className="flex gap-[2px]">
                  {palette.colors.slice(0, 5).map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-[10px] font-medium" style={{ color: store.colorPaletteId === id ? "white" : "var(--color-text-secondary)" }}>
                  {palette.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* ── Keşif Modu ── */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
              <path d="M9 3H15V8L19 14V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V14L9 8V3Z" />
              <path d="M9 3H15" />
              <path d="M12 11V15" />
              <path d="M10 13H14" />
            </svg>
            <Label>{t.settings.labs}</Label>
          </div>
          <Toggle checked={store.labsEnabled} onChange={() => store.setLabsEnabled(!store.labsEnabled)} />
        </div>
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 opacity-70">{t.settings.labsDesc}</p>
      </div>

      <Divider />

      {/* ── Sıfırla ── */}
      <button
        onClick={store.resetToDefaults}
        className="w-full py-2 rounded-lg border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
      >
        {t.settings.resetAll}
      </button>
    </div>
  );
}

// ── Translation Reorder ──────────────────────────────────

function TranslationReorder({ store, translationOptions }: { store: any; translationOptions: any[] }) {
  return (
    <div className="mt-2 space-y-0.5">
      {store.translationSlugs.map((slug: string, i: number) => {
        const opt = translationOptions.find((o: any) => o.value === slug);
        return (
          <div key={slug} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg)] px-2 py-1">
            <span className="text-[0.65rem] font-bold text-[var(--color-accent)] w-4 text-center shrink-0">{i + 1}</span>
            <span className="flex-1 text-xs truncate">{opt ? `${opt.group} / ${opt.label}` : slug}</span>
            <button type="button" onClick={() => store.moveTranslationSlug(slug, "up")} disabled={i === 0}
              className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors" aria-label="Yukarı">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7.5L6 4.5L9 7.5" /></svg>
            </button>
            <button type="button" onClick={() => store.moveTranslationSlug(slug, "down")} disabled={i === store.translationSlugs.length - 1}
              className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors" aria-label="Aşağı">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
            </button>
            <button type="button" onClick={() => store.toggleTranslationSlug(slug)}
              className="p-0.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors" aria-label="Kaldır">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3L9 9M9 3L3 9" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────

function Divider() {
  return <div className="border-b border-[var(--color-border)]" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">{children}</p>;
}

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

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        disabled ? "bg-[var(--color-border)] opacity-40 cursor-not-allowed"
          : checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

// ── Seher Geçiş Kontrolleri ──────────────────────────────

function SeherControls({ store, t }: {
  store: ReturnType<typeof useSettingsStore>;
  t: any;
}) {
  const { seherOverride, seherLocation, setSeherOverride } = store;

  const nextTime = seherLocation
    ? nextTransition(seherLocation.lat, seherLocation.lon)
    : null;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const currentlyDay = seherLocation
    ? isDaytime(seherLocation.lat, seherLocation.lon)
    : null;

  const MODES: { id: SeherOverride; icon: ReactNode; label: string }[] = [
    { id: "auto", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
      </svg>
    ), label: t.settings.seherAuto },
    { id: "light", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" strokeWidth={1.5}/><path strokeLinecap="round" strokeWidth={1.5} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ), label: t.settings.seherLight },
    { id: "dark", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    ), label: t.settings.seherDark },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2.5">
      <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {t.settings.seherMode}
      </span>

      {/* 3-button toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
        {MODES.map(({ id, icon, label }) => {
          const active = seherOverride === id;
          return (
            <button
              key={id}
              onClick={() => setSeherOverride(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              }`}
            >
              <span className="leading-none flex items-center justify-center">{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Durum satırı */}
      {seherOverride === "auto" && (
        <div className="text-[11px] text-[var(--color-text-secondary)] space-y-1">
          {seherLocation ? (
            <>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>
                  {t.settings.seherLocationUsing}:{" "}
                  {seherLocation.lat.toFixed(1)}°{seherLocation.lat >= 0 ? "K" : "G"},{" "}
                  {seherLocation.lon.toFixed(1)}°{seherLocation.lon >= 0 ? "D" : "B"}
                </span>
              </div>
              {nextTime && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {currentlyDay
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                    }
                  </svg>
                  <span>
                    {currentlyDay
                      ? t.settings.seherNextDark
                      : t.settings.seherNextLight}{" "}
                    · {formatTime(nextTime)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-1.5">
              <svg className="w-3 h-3 opacity-70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="leading-snug">{t.settings.seherLocationNeeded}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

