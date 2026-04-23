/**
 * Ayar paneli — sağdan açılır sheet.
 * İki sekme: Okuma (sık kullanılan) + Genel (nadir değişen).
 */

import { useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import { useSettingsStore, COLOR_PALETTES, ACCENT_COLORS, type Theme, type TextStyle, type ReadingMode, type ColorPaletteId, type AccentColorId } from "~/stores/settings.store";
import { useQuery } from "@tanstack/react-query";
import { recitersQueryOptions, translationSourcesQueryOptions, useSurahs } from "~/hooks/useQuranQuery";
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

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function SepiaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeDasharray="2 3" />
    </svg>
  );
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

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
  const { data: surahs } = useSurahs();

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
    if (isOnPage) {
      const pageNum = parseInt(currentPath.replace("/page/", ""), 10) || 1;
      const sid = surahs.reduce<number>((best, s) => {
        if (s.pageStart <= pageNum && s.pageStart > (surahs.find(x => x.id === best)?.pageStart ?? 0)) return s.id;
        return best;
      }, 1);
      onClose();
      navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(sid) }, search: { ayah: undefined } });
    }
  };

  return (
    <>
      <div className="mu-settings-backdrop" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={t.settings.title} className="mu-settings-panel">
        <div className="mu-settings-inner">
          {/* Header */}
          <div className="mu-settings-header">
            <h2>{t.settings.title}</h2>
            <button onClick={onClose} className="mu-icon-btn" aria-label={t.settings.close}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 5L13 13M13 5L5 13" />
              </svg>
            </button>
          </div>

          {/* Tab bar */}
          <div role="tablist" className="mu-settings-tabs">
            <button
              role="tab"
              aria-selected={tab === "reading"}
              aria-controls="settings-tab-reading"
              onClick={() => setTab("reading")}
              className={`mu-settings-tab ${tab === "reading" ? "on" : ""}`}
            >
              {t.settings.tabs.reading}
            </button>
            <button
              role="tab"
              aria-selected={tab === "general"}
              aria-controls="settings-tab-general"
              onClick={() => setTab("general")}
              className={`mu-settings-tab ${tab === "general" ? "on" : ""}`}
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
              currentPath={currentPath}
              onMushafClick={() => {
                const pageNum = context?.pageNumber ?? 1;
                onClose();
                navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum) }, search: { ayah: undefined } });
              }}
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
            className="mu-settings-motto"
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

function ReadingTab({ store, reciterList, translationList, locale, t, onModeChange, currentPath, onMushafClick }: {
  store: ReturnType<typeof useSettingsStore>;
  reciterList: any;
  translationList: any;
  locale: string;
  t: any;
  onModeChange: (mode: ReadingMode) => void;
  currentPath: string;
  onMushafClick: () => void;
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

  const FONT_PRESETS = [
    { id: "small", size: 1.5, label: "S" },
    { id: "medium", size: 1.8, label: "M" },
    { id: "large", size: 3.0, label: "L" },
  ];

  const arabicMin = 1.2, arabicMax = 5.0;
  const mealMin = 0.75, mealMax = 2.0;

  return (
    <div id="settings-tab-reading" role="tabpanel" className="mu-settings-content">
      {/* ── Yazı Boyutu + canli onizleme ── */}
      <div>
        <p
          className="mu-settings-preview-ar"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: `${store.arabicFontSize}rem` }}
        >
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <p
          className="mu-settings-preview-tr"
          style={{ fontSize: `${store.translationFontSize}rem` }}
        >
          {t.settings.mealPreview}
        </p>

        {/* Hazir boyut presetleri */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
          {FONT_PRESETS.map((p) => {
            const active = Math.abs(store.arabicFontSize - p.size) < 0.05;
            return (
              <button
                key={p.id}
                onClick={() => store.setArabicFontSize(p.size)}
                className={`mu-settings-mode-btn ${active ? "on" : ""}`}
              >
                <span dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: `${0.7 + (p.size - 1.5) * 0.55}rem`, lineHeight: 1 }}>ع</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => store.setArabicFontSize(store.arabicFontSize - 0.2)} className="mu-settings-size-btn" aria-label={`${t.a11y?.arabicFontSize ?? "Arabic font size"} -`}>A-</button>
            <input type="range" min={arabicMin} max={arabicMax} step={0.1} value={store.arabicFontSize}
              onChange={(e) => store.setArabicFontSize(parseFloat(e.target.value))} className="mu-settings-range"
              aria-label={t.a11y?.arabicFontSize ?? "Arabic font size"} aria-valuemin={arabicMin} aria-valuemax={arabicMax} aria-valuenow={store.arabicFontSize} />
            <button onClick={() => store.setArabicFontSize(store.arabicFontSize + 0.2)} className="mu-settings-size-btn" aria-label={`${t.a11y?.arabicFontSize ?? "Arabic font size"} +`}>A+</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--mu-muted)", width: 28, textAlign: "center", flexShrink: 0 }}>Aa</span>
            <input type="range" min={mealMin} max={mealMax} step={0.05} value={store.translationFontSize}
              onChange={(e) => store.setTranslationFontSize(parseFloat(e.target.value))} className="mu-settings-range"
              aria-label={t.a11y?.translationFontSize ?? "Translation font size"} aria-valuemin={mealMin} aria-valuemax={mealMax} aria-valuenow={store.translationFontSize} />
            <button
              onClick={() => { store.setArabicFontSize(1.8); store.setTranslationFontSize(0.95); }}
              style={{ fontSize: 10, color: "var(--mu-accent)", flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--mu-ff-ui)" }}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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

      {/* ── Okuma Modu ── */}
      <div>
        <Label>{t.settings.readingMode}</Label>
        <div className="mu-rmode-group">
          {([
            { value: "verse" as ReadingMode, label: t.settings.modeVerse, icon: VerseIcon, desc: t.settings.verseList },
            { value: "wbw" as ReadingMode, label: t.settings.modeWbw, icon: WbwIcon, desc: t.settings.wordByWord },
          ] as const).map(({ value, label, icon: Icon, desc }) => {
            const active = store.readingMode === value && !currentPath.startsWith("/page/");
            return (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={`mu-rmode-btn${active ? " on" : ""}`}
              >
                <span className="mu-rmode-icon">
                  <Icon size={20} active={active} />
                </span>
                <span className="mu-rmode-text">
                  <span className="mu-rmode-label">{label}</span>
                  <span className="mu-rmode-desc">{desc}</span>
                </span>
              </button>
            );
          })}
          <button
            onClick={onMushafClick}
            className={`mu-rmode-btn${currentPath.startsWith("/page/") ? " on" : ""}`}
          >
            <span className="mu-rmode-icon">
              <MushafIcon size={20} active={currentPath.startsWith("/page/")} />
            </span>
            <span className="mu-rmode-text">
              <span className="mu-rmode-label">Mushaf</span>
              <span className="mu-rmode-desc">Sayfa görünümü</span>
            </span>
          </button>
        </div>

        {/* Mod bazli secenekler */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {store.readingMode !== "wbw" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--mu-muted)" }}>{t.settings.translation}</span>
              <Toggle checked={store.showTranslation} onChange={store.toggleTranslation} />
            </div>
          )}
          {store.readingMode === "wbw" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--mu-muted)" }}>{t.settings.wbwTransliteration}</span>
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
    <div id="settings-tab-general" role="tabpanel" className="mu-settings-content">
      {/* ── Tema ── */}
      <div style={{ display: "flex", gap: 6 }}>
        {([
          { id: "light" as const, icon: <SunIcon /> },
          { id: "sepia" as const, icon: <SepiaIcon /> },
          { id: "dark" as const, icon: <MoonIcon /> },
        ]).map((item) => {
          const active = store.theme === item.id;
          return (
            <button
              key={item.id}
              onClick={() => store.setTheme(item.id)}
              aria-label={item.id}
              style={{
                display: "grid",
                placeItems: "center",
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1.5px solid",
                borderColor: active ? "var(--mu-accent)" : "var(--mu-line)",
                background: active ? "var(--mu-accent-soft)" : "transparent",
                color: active ? "var(--mu-accent-ink)" : "var(--mu-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* ── Vurgu Rengi ── */}
      <div style={{ marginTop: 12 }}>
        <Label>{t.settings.accentColor}</Label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {(Object.keys(ACCENT_COLORS) as AccentColorId[]).map((id) => {
            const active = store.accentColor === id;
            return (
              <button
                key={id}
                onClick={() => store.setAccentColor(id)}
                aria-label={t.settings.accents?.[id] ?? id}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: ACCENT_COLORS[id].swatch,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: active ? `0 0 0 2px var(--mu-bg), 0 0 0 4px ${ACCENT_COLORS[id].swatch}` : "none",
                  transition: "box-shadow 0.15s",
                }}
              />
            );
          })}
        </div>
      </div>

      <Divider />

      {/* ── Dil ── */}
      <div>
        <Label>{t.settings.language}</Label>
        <select
          aria-label={t.settings.language}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="mu-settings-select"
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--mu-muted)" }}>{t.settings.tajweed}</span>
          <Toggle checked={store.showTajweed} onChange={store.toggleTajweed} disabled={store.textStyle === "basic" || store.colorizeWords} />
        </div>
      </div>

      <Divider />

      {/* ── Kelime Renklendirme ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>{t.settings.colorize}</Label>
          <Toggle checked={store.colorizeWords} onChange={() => store.setColorizeWords(!store.colorizeWords)} />
        </div>
        {store.colorizeWords && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(Object.entries(COLOR_PALETTES) as [ColorPaletteId, typeof COLOR_PALETTES[ColorPaletteId]][]).map(([id, palette]) => {
              const active = store.colorPaletteId === id;
              return (
                <button
                  key={id}
                  onClick={() => store.setColorPaletteId(id)}
                  className={`mu-settings-palette-btn ${active ? "on" : ""}`}
                >
                  <span style={{ display: "flex", gap: 2 }}>
                    {palette.colors.slice(0, 5).map((c, i) => (
                      <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, color: active ? "var(--mu-bg)" : "var(--mu-muted)" }}>
                    {palette.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Divider />

      {/* ── Sifirla ── */}
      <button onClick={store.resetToDefaults} className="mu-settings-reset">
        {t.settings.resetAll}
      </button>
    </div>
  );
}

// ── Translation Reorder ──────────────────────────────────

function TranslationReorder({ store, translationOptions }: { store: any; translationOptions: any[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 space-y-0.5">
      {store.translationSlugs.map((slug: string, i: number) => {
        const opt = translationOptions.find((o: any) => o.value === slug);
        return (
          <div key={slug} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg)] px-2 py-1">
            <span className="text-[0.65rem] font-bold text-[var(--color-accent)] w-4 text-center shrink-0">{i + 1}</span>
            <span className="flex-1 text-xs truncate">{opt ? `${opt.group} / ${opt.label}` : slug}</span>
            <button type="button" onClick={() => store.moveTranslationSlug(slug, "up")} disabled={i === 0}
              className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors" aria-label={t.reader.moveUp}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7.5L6 4.5L9 7.5" /></svg>
            </button>
            <button type="button" onClick={() => store.moveTranslationSlug(slug, "down")} disabled={i === store.translationSlugs.length - 1}
              className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 transition-colors" aria-label={t.reader.moveDown}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
            </button>
            <button type="button" onClick={() => store.toggleTranslationSlug(slug)}
              className="p-0.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors" aria-label={t.reader.removeItem}>
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
  return <div className="mu-settings-divider" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mu-settings-label">{children}</p>;
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mu-settings-seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`mu-settings-seg-btn ${value === opt.value ? "on" : ""}`}
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
      className={`mu-settings-toggle ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
    >
      <span className="mu-settings-toggle-knob" />
    </button>
  );
}


