import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  usePreferencesStore,
  ARABIC_FONTS,
  FONT_GROUPS,
  getArabicFont,
  COLOR_PALETTES,
  getActiveColors,
} from "~/stores/usePreferencesStore";
import type { Theme, ColorPaletteId, FontGroup } from "~/stores/usePreferencesStore";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { TranslationPicker } from "~/components/quran/TranslationPicker";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { ReciterModal } from "~/components/audio/ReciterModal";
import { CURATED_RECITERS } from "@mahfuz/shared/constants";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

// Uthmani text (with alef wasla ٱ, superscript alef ٰ etc.)
const BISMILLAH_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_SIMPLE = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

const SAMPLE_WORDS_UTHMANI = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];
const SAMPLE_WORDS_SIMPLE = ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"];

function getSampleData(textType: string) {
  const isUthmani = textType === "uthmani";
  return {
    bismillah: isUthmani ? BISMILLAH_UTHMANI : BISMILLAH_SIMPLE,
    sampleWords: isUthmani ? SAMPLE_WORDS_UTHMANI : SAMPLE_WORDS_SIMPLE,
  };
}

const SAMPLE_WORD_TRANSLATIONS = [
  "Allah\u2019\u0131n ad\u0131yla",
  "Allah",
  "Rahm\u00e2n",
  "Rah\u00eem",
];

const SAMPLE_WORD_TRANSLITERATIONS = [
  "bismi",
  "all\u00e2hi",
  "ar-rahm\u00e2ni",
  "ar-rah\u00eemi",
];

const THEME_OPTIONS: { value: Theme; color: string }[] = [
  { value: "light", color: "#ffffff" },
  { value: "sepia", color: "#f5ead6" },
  { value: "dark", color: "#1a1a1a" },
  { value: "dimmed", color: "#22272e" },
];

type ReadingModeTab = "normal" | "wordByWord" | "mushaf";
type AccordionSection = "font" | "wordColor" | "script" | "reciter" | "theme" | "readingMode" | "langNav";

// ─── Icons (18×18 stroke) ───────────────────────────────────────────
function IconFont() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l4.5-10h3L15 14" />
      <path d="M5.5 9.5h7" />
    </svg>
  );
}
function IconDroplet() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5C9 2.5 4 8 4 11a5 5 0 0010 0c0-3-5-8.5-5-8.5z" />
    </svg>
  );
}
function IconPen() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2.5l2 2-10 10H3.5v-2l10-10z" />
      <path d="M11.5 4.5l2 2" />
    </svg>
  );
}
function IconMicrophone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="2" width="5" height="9" rx="2.5" />
      <path d="M4 9a5 5 0 0010 0" />
      <path d="M9 14v2.5" />
    </svg>
  );
}
function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="1.5" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h5.5a1.5 1.5 0 011.5 1.5v10a1 1 0 00-1-1H2V3.5z" />
      <path d="M16 3.5h-5.5a1.5 1.5 0 00-1.5 1.5v10a1 1 0 011-1H16V3.5z" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M2 9h14" />
      <path d="M9 2a11.5 11.5 0 013 7 11.5 11.5 0 01-3 7 11.5 11.5 0 01-3-7 11.5 11.5 0 013-7z" />
    </svg>
  );
}

// ─── SettingsAccordion ──────────────────────────────────────────────
function SettingsAccordion({
  title,
  summary,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--theme-bg)]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-primary-700">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-[var(--theme-text)]">{title}</span>
          <span className="block truncate text-[12px] text-[var(--theme-text-tertiary)]">{summary}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[var(--theme-text-tertiary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <div className="accordion-grid" data-open={isOpen}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SaveStatusBar ──────────────────────────────────────────────────
function SaveStatusBar() {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/80 px-4 py-3 backdrop-blur-xl">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <path d="M3.5 8.5l3 3 6-6" />
      </svg>
      <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">{t.settings.saved}</span>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
function SettingsPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();

  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const setArabicFont = usePreferencesStore((s) => s.setArabicFont);
  const setColorizeWords = usePreferencesStore((s) => s.setColorizeWords);
  const setColorPalette = usePreferencesStore((s) => s.setColorPalette);
  const textType = usePreferencesStore((s) => s.textType);
  const setTextType = usePreferencesStore((s) => s.setTextType);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const setNormalArabicFontSize = usePreferencesStore((s) => s.setNormalArabicFontSize);
  const setNormalTranslationFontSize = usePreferencesStore((s) => s.setNormalTranslationFontSize);
  const setWbwArabicFontSize = usePreferencesStore((s) => s.setWbwArabicFontSize);
  const setMushafArabicFontSize = usePreferencesStore((s) => s.setMushafArabicFontSize);

  const showLearnTab = usePreferencesStore((s) => s.showLearnTab);
  const setShowLearnTab = usePreferencesStore((s) => s.setShowLearnTab);
  const showMemorizeTab = usePreferencesStore((s) => s.showMemorizeTab);
  const setShowMemorizeTab = usePreferencesStore((s) => s.setShowMemorizeTab);

  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const setWbwShowWordTranslation = usePreferencesStore((s) => s.setWbwShowWordTranslation);
  const setWbwShowWordTransliteration = usePreferencesStore((s) => s.setWbwShowWordTransliteration);
  const setWordTranslationSize = usePreferencesStore((s) => s.setWordTranslationSize);
  const setWordTransliterationSize = usePreferencesStore((s) => s.setWordTransliterationSize);

  const reciterId = useAudioStore((s) => s.reciterId);
  const [reciterModalOpen, setReciterModalOpen] = useState(false);
  const currentReciter = CURATED_RECITERS.find((r) => r.id === reciterId);

  const activeColors = getActiveColors({ colorPaletteId });
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set());
  const [readingModeTab, setReadingModeTab] = useState<ReadingModeTab>(viewMode);

  const READING_MODE_OPTIONS: { value: ReadingModeTab; label: string }[] = [
    { value: "normal", label: t.settings.viewModes.normal },
    { value: "wordByWord", label: t.settings.viewModes.wordByWord },
    { value: "mushaf", label: t.settings.viewModes.mushaf },
  ];

  const themeLabels: Record<Theme, string> = {
    light: t.theme.light,
    sepia: t.theme.sepia,
    dark: t.theme.dark,
    dimmed: t.theme.dimmed,
  };

  useEffect(() => {
    for (const font of ARABIC_FONTS) {
      if (font.source === "google" && font.googleUrl) {
        const exists = document.querySelector(
          `link[href="${font.googleUrl}"]`,
        );
        if (!exists) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = font.googleUrl;
          document.head.appendChild(link);
        }
      }
    }
  }, []);

  const currentFont = getArabicFont(arabicFontId);

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // ── Summaries ──
  const fontSummary = currentFont.name;
  const wordColorSummary = colorizeWords
    ? COLOR_PALETTES.find((p) => p.id === colorPaletteId)?.name ?? ""
    : t.settings.colorOff;
  const scriptSummary = textType === "uthmani" ? t.settings.textTypeUthmani : t.settings.textTypeSimple;
  const reciterSummary = currentReciter?.name ?? "—";
  const themeSummary = themeLabels[theme];
  const readingModeSummary = t.settings.viewModes[viewMode];
  const langSummary = locale === "tr" ? "Türkçe" : "English";

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[var(--theme-text)]">
        {t.settings.title}
      </h1>
      <p className="mb-6 text-sm text-[var(--theme-text-tertiary)]">
        {t.settings.subtitle}
      </p>

      <div className="space-y-3">
        {/* ═══ FONT ═══ */}
        <SettingsAccordion
          title={t.settings.sectionFont}
          summary={fontSummary}
          icon={<IconFont />}
          isOpen={openSections.has("font")}
          onToggle={() => toggleSection("font")}
        >
          <FontPickerSection
            arabicFontId={arabicFontId}
            onFontChange={setArabicFont}
            colorizeWords={colorizeWords}
            colors={activeColors}
            textType={textType}
          />
        </SettingsAccordion>

        {/* ═══ WORD COLOR ═══ */}
        <SettingsAccordion
          title={t.settings.sectionWordColor}
          summary={wordColorSummary}
          icon={<IconDroplet />}
          isOpen={openSections.has("wordColor")}
          onToggle={() => toggleSection("wordColor")}
        >
          <div className="flex items-center justify-between">
            <div>
              <SettingsLabel>{t.settings.colorizeWords}</SettingsLabel>
              <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
                {t.settings.colorizeWordsDesc}
              </p>
            </div>
            <ToggleSwitch checked={colorizeWords} onChange={setColorizeWords} />
          </div>
          {colorizeWords && (
            <div className="mt-4">
              <SettingsLabel>{t.settings.colorPalette}</SettingsLabel>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COLOR_PALETTES.map((palette) => {
                  const active = colorPaletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setColorPalette(palette.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition-all ${
                        active
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-[var(--theme-divider)]"
                      }`}
                    >
                      <div className="flex gap-1">
                        {palette.colors.slice(0, 5).map((color, i) => (
                          <span key={i} className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <span className={`text-[12px] font-medium ${active ? "text-primary-700" : "text-[var(--theme-text)]"}`}>
                        {palette.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SettingsAccordion>

        {/* ═══ SCRIPT STYLE ═══ */}
        <SettingsAccordion
          title={t.settings.sectionScript}
          summary={scriptSummary}
          icon={<IconPen />}
          isOpen={openSections.has("script")}
          onToggle={() => toggleSection("script")}
        >
          <h3 className="mb-3 text-[13px] font-semibold text-[var(--theme-text)]">{t.settings.textType}</h3>
          <SegmentedControl
            options={[
              { value: "uthmani" as const, label: t.settings.textTypeUthmani },
              { value: "simple" as const, label: t.settings.textTypeSimple },
            ]}
            value={textType}
            onChange={setTextType}
            stretch
          />
        </SettingsAccordion>

        {/* ═══ RECITER ═══ */}
        <SettingsAccordion
          title={t.settings.sectionReciter}
          summary={reciterSummary}
          icon={<IconMicrophone />}
          isOpen={openSections.has("reciter")}
          onToggle={() => toggleSection("reciter")}
        >
          <SettingsLabel label={t.settings.reciter} description={t.settings.reciterDesc} />
          <button
            type="button"
            onClick={() => setReciterModalOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 text-left transition-colors hover:border-[var(--theme-divider)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600/10 text-[14px] font-semibold text-primary-700">
              {currentReciter?.name.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate text-[14px] font-medium text-[var(--theme-text)]">
                {currentReciter?.name ?? "—"}
              </span>
              {currentReciter && (
                <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
                  {currentReciter.country} · {currentReciter.style}
                </span>
              )}
            </div>
            <span className="shrink-0 text-[12px] font-medium text-primary-600">
              {t.settings.changeReciter}
            </span>
          </button>
        </SettingsAccordion>

        {/* ═══ THEME ═══ */}
        <SettingsAccordion
          title={t.settings.sectionTheme}
          summary={themeSummary}
          icon={<IconPalette />}
          isOpen={openSections.has("theme")}
          onToggle={() => toggleSection("theme")}
        >
          <SettingsLabel>{t.theme.settings}</SettingsLabel>
          <div className="mt-2 flex gap-3">
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition-all ${
                    active
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-[var(--theme-divider)]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      active ? "border-primary-600" : "border-[var(--theme-divider)]"
                    }`}
                    style={{ backgroundColor: opt.color }}
                  >
                    {active && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke={opt.value === "dark" || opt.value === "dimmed" ? "#e5e5e5" : "#059669"} strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[12px] font-medium ${active ? "text-primary-700" : "text-[var(--theme-text)]"}`}>
                    {themeLabels[opt.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsAccordion>

        {/* ═══ READING MODE ═══ */}
        <SettingsAccordion
          title={t.settings.sectionReadingMode}
          summary={readingModeSummary}
          icon={<IconBook />}
          isOpen={openSections.has("readingMode")}
          onToggle={() => toggleSection("readingMode")}
        >
          <SegmentedControl options={READING_MODE_OPTIONS} value={readingModeTab} onChange={setReadingModeTab} stretch />
          <div className="mt-5">
            {readingModeTab === "normal" && (
              <NormalTabContent
                fontFamily={currentFont.family}
                arabicFontSize={normalArabicFontSize}
                translationFontSize={normalTranslationFontSize}
                onArabicSizeChange={setNormalArabicFontSize}
                onTranslationSizeChange={setNormalTranslationFontSize}
                colorizeWords={colorizeWords}
                colors={activeColors}
                textType={textType}
              />
            )}
            {readingModeTab === "wordByWord" && (
              <WbwTabContent
                fontFamily={currentFont.family}
                arabicFontSize={wbwArabicFontSize}
                onArabicSizeChange={setWbwArabicFontSize}
                colorizeWords={colorizeWords}
                colors={activeColors}
                showWordTranslation={wbwShowWordTranslation}
                showWordTransliteration={wbwShowWordTransliteration}
                wordTranslationSize={wordTranslationSize}
                wordTransliterationSize={wordTransliterationSize}
                onShowWordTranslationChange={setWbwShowWordTranslation}
                onShowWordTransliterationChange={setWbwShowWordTransliteration}
                onWordTranslationSizeChange={setWordTranslationSize}
                onWordTransliterationSizeChange={setWordTransliterationSize}
                textType={textType}
              />
            )}
            {readingModeTab === "mushaf" && (
              <MushafTabContent
                fontFamily={currentFont.family}
                arabicFontSize={mushafArabicFontSize}
                onArabicSizeChange={setMushafArabicFontSize}
                colorizeWords={colorizeWords}
                colors={activeColors}
                textType={textType}
              />
            )}
          </div>
        </SettingsAccordion>

        {/* ═══ LANGUAGE & NAVIGATION ═══ */}
        <SettingsAccordion
          title={t.settings.sectionLangNav}
          summary={langSummary}
          icon={<IconGlobe />}
          isOpen={openSections.has("langNav")}
          onToggle={() => toggleSection("langNav")}
        >
          <div className="flex items-center justify-between">
            <SettingsLabel label={t.settings.language} description={t.settings.languageDesc} />
            <div className="flex items-center gap-1 rounded-lg bg-[var(--theme-input-bg)] p-0.5">
              {(["tr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${locale === l ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm" : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"}`}
                >
                  {l === "tr" ? "Türkçe" : "English"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
            <SettingsLabel label={t.settings.tabBar} description={t.settings.tabBarDesc} />
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text)]">{t.settings.showLearnTab}</span>
                <ToggleSwitch checked={showLearnTab} onChange={setShowLearnTab} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text)]">{t.settings.showMemorizeTab}</span>
                <ToggleSwitch checked={showMemorizeTab} onChange={setShowMemorizeTab} />
              </div>
            </div>
          </div>
        </SettingsAccordion>
      </div>

      <SaveStatusBar />

      <ReciterModal open={reciterModalOpen} onClose={() => setReciterModalOpen(false)} />
    </div>
  );
}

// ─── Tab content components ─────────────────────────────────────────
function NormalTabContent({
  fontFamily,
  arabicFontSize,
  translationFontSize,
  onArabicSizeChange,
  onTranslationSizeChange,
  colorizeWords,
  colors,
  textType,
}: {
  fontFamily: string;
  arabicFontSize: number;
  translationFontSize: number;
  onArabicSizeChange: (v: number) => void;
  onTranslationSizeChange: (v: number) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
}) {
  const { t } = useTranslation();
  const normalShowTranslation = usePreferencesStore((s) => s.normalShowTranslation);
  const setNormalShowTranslation = usePreferencesStore((s) => s.setNormalShowTranslation);
  const { sampleWords } = getSampleData(textType);

  const fontStyle = {
    fontFamily: `${fontFamily}, "Traditional Arabic", serif`,
    fontSize: `calc(1.65rem * ${arabicFontSize})`,
    lineHeight: 2.6,
  };

  const renderWord = (text: string, i: number) => (
    <span
      key={i}
      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
    >
      {text}
      {i < sampleWords.length - 1 ? " " : ""}
    </span>
  );

  return (
    <>
      {/* Preview */}
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
        <p className="text-[var(--theme-text)]" dir="rtl" style={fontStyle}>
          {sampleWords.map(renderWord)}
        </p>
        <p
          className="mt-2 font-sans text-[var(--theme-text-secondary)]"
          style={{ fontSize: `calc(15px * ${translationFontSize})`, lineHeight: 1.8 }}
        >
          {t.settings.sampleTranslation}
        </p>
      </div>

      {/* Arabic size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.arabicSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(arabicFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="arabic-text text-sm text-[var(--theme-text-tertiary)]">ع</span>
          <input
            type="range" min="0.6" max="2.0" step="0.05"
            value={arabicFontSize}
            onChange={(e) => onArabicSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="arabic-text text-xl text-[var(--theme-text-tertiary)]">ع</span>
        </div>
      </div>

      {/* Translation size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.translationSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(translationFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-[var(--theme-text-tertiary)]">A</span>
          <input
            type="range" min="0.6" max="2.0" step="0.05"
            value={translationFontSize}
            onChange={(e) => onTranslationSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="text-lg text-[var(--theme-text-tertiary)]">A</span>
        </div>
      </div>

      {/* Translation toggle */}
      <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
        <div className="flex items-center justify-between">
          <div>
            <SettingsLabel>{t.settings.showTranslation}</SettingsLabel>
            <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
              {t.settings.showTranslationDesc}
            </p>
          </div>
          <ToggleSwitch checked={normalShowTranslation} onChange={setNormalShowTranslation} />
        </div>

        {/* Translation picker: reorder/add/remove/primary */}
        {normalShowTranslation && (
          <div className="mt-4">
            <SettingsLabel>{t.settings.translationSelection}</SettingsLabel>
            <p className="mt-0.5 mb-2 text-[12px] text-[var(--theme-text-tertiary)]">
              {t.settings.translationSelectionDesc}
            </p>
            <TranslationPicker />
          </div>
        )}
      </div>
    </>
  );
}

function WbwTabContent({
  fontFamily,
  arabicFontSize,
  onArabicSizeChange,
  colorizeWords,
  colors,
  showWordTranslation,
  showWordTransliteration,
  wordTranslationSize,
  wordTransliterationSize,
  onShowWordTranslationChange,
  onShowWordTransliterationChange,
  onWordTranslationSizeChange,
  onWordTransliterationSizeChange,
  textType,
}: {
  fontFamily: string;
  arabicFontSize: number;
  onArabicSizeChange: (v: number) => void;
  colorizeWords: boolean;
  colors: string[];
  showWordTranslation: boolean;
  showWordTransliteration: boolean;
  wordTranslationSize: number;
  wordTransliterationSize: number;
  onShowWordTranslationChange: (v: boolean) => void;
  onShowWordTransliterationChange: (v: boolean) => void;
  onWordTranslationSizeChange: (v: number) => void;
  onWordTransliterationSizeChange: (v: number) => void;
  textType: string;
}) {
  const { t } = useTranslation();
  const { sampleWords } = getSampleData(textType);

  return (
    <>
      {/* Preview */}
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-4">
        <div className="flex flex-wrap justify-end gap-x-5 gap-y-3" dir="rtl">
          {sampleWords.map((word, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className="text-xl"
                dir="rtl"
                style={{
                  fontFamily: `${fontFamily}, "Traditional Arabic", serif`,
                  fontSize: `calc(1.5rem * ${arabicFontSize})`,
                  color: colorizeWords
                    ? colors[i % colors.length]
                    : "var(--theme-text)",
                }}
              >
                {word}
              </span>
              {showWordTranslation && (
                <span
                  className="font-sans text-[var(--theme-text-tertiary)]"
                  style={{ fontSize: `calc(11px * ${wordTranslationSize})` }}
                >
                  {SAMPLE_WORD_TRANSLATIONS[i]}
                </span>
              )}
              {showWordTransliteration && (
                <span
                  className="font-sans text-[var(--theme-text-quaternary)]"
                  style={{ fontSize: `calc(10px * ${wordTransliterationSize})` }}
                >
                  {SAMPLE_WORD_TRANSLITERATIONS[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Arabic size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.arabicSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(arabicFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="arabic-text text-sm text-[var(--theme-text-tertiary)]">ع</span>
          <input
            type="range" min="0.6" max="2.0" step="0.05"
            value={arabicFontSize}
            onChange={(e) => onArabicSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="arabic-text text-xl text-[var(--theme-text-tertiary)]">ع</span>
        </div>
      </div>

      {/* Word Translation toggle + size */}
      <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
        <div className="flex items-center justify-between">
          <SettingsLabel>{t.settings.wordTranslation}</SettingsLabel>
          <ToggleSwitch checked={showWordTranslation} onChange={onShowWordTranslationChange} />
        </div>
        {showWordTranslation && (
          <div className="mt-3 flex items-center gap-3">
            <span className="shrink-0 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.translationSize}</span>
            <input
              type="range" min="0.6" max="2.0" step="0.05"
              value={wordTranslationSize}
              onChange={(e) => onWordTranslationSizeChange(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
            />
            <span className="shrink-0 text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
              %{Math.round(wordTranslationSize * 100)}
            </span>
          </div>
        )}
      </div>

      {/* Word Transliteration toggle + size */}
      <div className="mt-4 border-t border-[var(--theme-border)] pt-5">
        <div className="flex items-center justify-between">
          <SettingsLabel>{t.settings.transliteration}</SettingsLabel>
          <ToggleSwitch checked={showWordTransliteration} onChange={onShowWordTransliterationChange} />
        </div>
        {showWordTransliteration && (
          <div className="mt-3 flex items-center gap-3">
            <span className="shrink-0 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.transliterationSize}</span>
            <input
              type="range" min="0.6" max="2.0" step="0.05"
              value={wordTransliterationSize}
              onChange={(e) => onWordTransliterationSizeChange(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
            />
            <span className="shrink-0 text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
              %{Math.round(wordTransliterationSize * 100)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function MushafTabContent({
  fontFamily,
  arabicFontSize,
  onArabicSizeChange,
  colorizeWords,
  colors,
  textType,
}: {
  fontFamily: string;
  arabicFontSize: number;
  onArabicSizeChange: (v: number) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
}) {
  const { t } = useTranslation();
  const { sampleWords } = getSampleData(textType);

  const fontStyle = {
    fontFamily: `${fontFamily}, "Traditional Arabic", serif`,
    fontSize: `calc(1.65rem * ${arabicFontSize})`,
    lineHeight: 2.8,
  };

  const renderWord = (text: string, i: number) => (
    <span
      key={i}
      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
    >
      {text}
      {i < sampleWords.length - 1 ? " " : ""}
    </span>
  );

  return (
    <>
      {/* Preview, mushaf frame */}
      <div className="mushaf-page">
        <div className="mushaf-cetvel-outer">
          <div className="mushaf-tezhip-band">
            <div className="mushaf-hatayi-pattern" />
            <div className="mushaf-cetvel-inner">
              <div className="mushaf-content">
                <p className="text-center text-[var(--mushaf-ink)]" dir="rtl" style={fontStyle}>
                  {sampleWords.map(renderWord)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arabic size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.arabicSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(arabicFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="arabic-text text-sm text-[var(--theme-text-tertiary)]">ع</span>
          <input
            type="range" min="0.6" max="2.0" step="0.05"
            value={arabicFontSize}
            onChange={(e) => onArabicSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="arabic-text text-xl text-[var(--theme-text-tertiary)]">ع</span>
        </div>
      </div>
    </>
  );
}

// ─── Font Picker Section ────────────────────────────────────────────
const PREVIEW_SURAH = {
  name: "el-Kevser",
  number: 108,
  uthmani: [
    "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
  ],
  simple: [
    "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
  ],
};

function FontPickerSection({
  arabicFontId,
  onFontChange,
  colorizeWords,
  colors,
  textType,
}: {
  arabicFontId: string;
  onFontChange: (id: string) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
}) {
  const { t } = useTranslation();
  const currentFont = getArabicFont(arabicFontId);
  const fontFamily = `${currentFont.family}, "Traditional Arabic", serif`;
  const previewVerses = textType === "uthmani" ? PREVIEW_SURAH.uthmani : PREVIEW_SURAH.simple;
  const [activeTab, setActiveTab] = useState<FontGroup>(currentFont.group);
  let colorIdx = 0;

  const tabFonts = ARABIC_FONTS.filter((f) => f.group === activeTab);

  // Lazy-load Google Fonts for active tab
  useEffect(() => {
    tabFonts.forEach((f) => {
      if (f.source === "google" && f.googleUrl) {
        const id = `font-link-${f.id}`;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = f.googleUrl;
          document.head.appendChild(link);
        }
      }
    });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-5">
      {/* Live surah preview */}
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        {/* Surah header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--theme-text)]">{currentFont.name}</span>
            {currentFont.source === "local" && (
              <span className="rounded-md bg-primary-600/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                {t.common.local}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--theme-text-quaternary)]">
            {PREVIEW_SURAH.name} ({PREVIEW_SURAH.number})
          </span>
        </div>

        {/* Verses */}
        <div className="space-y-3" dir="rtl">
          {previewVerses.map((verse, vi) => {
            const words = verse.split(" ");
            return (
              <p
                key={vi}
                className="text-[1.5rem] leading-[2.4] text-[var(--theme-text)]"
                style={{ fontFamily }}
              >
                {colorizeWords && colors.length > 0
                  ? words.map((w, wi) => {
                      const idx = colorIdx++;
                      return (
                        <span key={wi} style={{ color: colors[idx % colors.length] }}>
                          {w}{wi < words.length - 1 ? " " : ""}
                        </span>
                      );
                    })
                  : verse}
                <span className="mr-1.5 inline-block text-[0.7em] text-[var(--theme-text-tertiary)]">
                  {String.fromCodePoint(0x06F0 + vi + 1)}
                </span>
              </p>
            );
          })}
        </div>

        {/* Description */}
        <p className="mt-3 border-t border-[var(--theme-border)] pt-3 text-[11px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {(t.fonts.descriptions as Record<string, string>)[currentFont.id] ?? currentFont.desc}
        </p>
      </div>

      {/* Style tabs */}
      <div className="scrollbar-none mt-4 flex gap-1.5 overflow-x-auto">
        {FONT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveTab(g.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${activeTab === g.id ? "bg-primary-600 text-white" : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"}`}
          >
            {(t.fonts.groups as Record<string, string>)[g.labelKey]}
          </button>
        ))}
      </div>

      {/* Font card grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabFonts.map((font) => {
          const isSelected = font.id === arabicFontId;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onFontChange(font.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-600/10 shadow-sm"
                  : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] hover:border-[var(--theme-divider)] hover:shadow-sm"
              }`}
            >
              <span
                className="arabic-text block text-[1.25rem] leading-[1.8] text-[var(--theme-text)]"
                dir="rtl"
                style={{ fontFamily: `${font.family}, "Traditional Arabic", serif` }}
              >
                بِسْمِ ٱللَّهِ
              </span>
              <span className={`text-[11px] font-medium leading-tight ${isSelected ? "text-primary-700" : "text-[var(--theme-text-tertiary)]"}`}>
                {font.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared components ──────────────────────────────────────────────
function SettingsLabel({
  children,
  label,
  description,
}: {
  children?: React.ReactNode;
  label?: string;
  description?: string;
}) {
  if (label !== undefined) {
    return (
      <div>
        <span className="text-[13px] font-semibold text-[var(--theme-text)]">{label}</span>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">{description}</p>
        )}
      </div>
    );
  }
  return (
    <span className="text-[13px] font-semibold text-[var(--theme-text)]">
      {children}
    </span>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary-600" : "bg-[var(--theme-divider)]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-[var(--theme-bg-primary)] shadow-sm transition-transform ${
          checked ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
