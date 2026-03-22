import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  usePreferencesStore,
  ARABIC_FONTS,
  getArabicFont,
  COLOR_PALETTES,
  getActiveColors,
} from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { CURATED_RECITERS, LOCAL_TRANSLATIONS, LANGUAGE_BADGE_LABELS } from "@mahfuz/shared/constants";
import type { TranslationLanguage } from "@mahfuz/shared/constants";
import {
  IconFont,
  IconDroplet,
  IconMicrophone,
  IconBook,
  IconGlobe,
  SaveStatusBar,
} from "~/components/settings/SettingsShared";
import { FontSection } from "~/components/settings/FontSection";
import { WordColorSection } from "~/components/settings/WordColorSection";
import { ReciterSection } from "~/components/settings/ReciterSection";
import { ReadingModeSection } from "~/components/settings/ReadingModeSection";
import { LanguageSection } from "~/components/settings/LanguageSection";
import { PageLayoutSection } from "~/components/settings/PageLayoutSection";
import { PresetSection } from "~/components/settings/PresetSection";
import { getLocaleConfig } from "~/locales/registry";
import { useReadingPrefs } from "~/stores/useReadingPrefs";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

type AccordionSection = "font" | "wordColor" | "reciter" | "readingMode" | "pageLayout" | "langNav";
type ReadingModeTab = "metin" | "mushaf";

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function SettingsPage() {
  const hydrated = useHydrated();
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const setSelectedTranslations = usePreferencesStore((s) => s.setSelectedTranslations);

  // When locale changes, ensure a matching translation is primary
  const handleLocaleChange = (newLocale: Parameters<typeof setLocale>[0]) => {
    setLocale(newLocale);
    const localeUpper = newLocale.toUpperCase();
    // Find the TranslationLanguage matching this locale
    const matchingLang = (Object.entries(LANGUAGE_BADGE_LABELS) as [TranslationLanguage, string][])
      .find(([, badge]) => badge === localeUpper)?.[0];
    if (!matchingLang) return;
    // Check if any selected translation already matches this language
    const alreadyHas = selectedTranslations.some((id) =>
      LOCAL_TRANSLATIONS.find((tr) => tr.id === id && tr.language === matchingLang),
    );
    if (alreadyHas) return;
    // Find the first available translation for this language
    const match = LOCAL_TRANSLATIONS.find((tr) => tr.language === matchingLang);
    if (!match) return;
    // Prepend as primary
    setSelectedTranslations([match.id, ...selectedTranslations]);
  };


  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const setArabicFont = usePreferencesStore((s) => s.setArabicFont);
  const setColorizeWords = usePreferencesStore((s) => s.setColorizeWords);
  const setColorPalette = usePreferencesStore((s) => s.setColorPalette);
  const textType = usePreferencesStore((s) => s.textType);
  const setTextType = usePreferencesStore((s) => s.setTextType);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const setNormalArabicFontSize = usePreferencesStore((s) => s.setNormalArabicFontSize);
  const setNormalTranslationFontSize = usePreferencesStore((s) => s.setNormalTranslationFontSize);
  const setWbwArabicFontSize = usePreferencesStore((s) => s.setWbwArabicFontSize);
  const setMushafArabicFontSize = usePreferencesStore((s) => s.setMushafArabicFontSize);
  const setMushafTranslationFontSize = usePreferencesStore((s) => s.setMushafTranslationFontSize);
  const mushafTooltipTextSize = usePreferencesStore((s) => s.mushafTooltipTextSize);
  const setMushafTooltipTextSize = usePreferencesStore((s) => s.setMushafTooltipTextSize);

  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const setWbwShowWordTranslation = usePreferencesStore((s) => s.setWbwShowWordTranslation);
  const setWbwShowWordTransliteration = usePreferencesStore((s) => s.setWbwShowWordTransliteration);
  const setWordTranslationSize = usePreferencesStore((s) => s.setWordTranslationSize);
  const setWordTransliterationSize = usePreferencesStore((s) => s.setWordTransliterationSize);

  const reciterId = useAudioStore((s) => s.reciterId);
  const currentReciter = CURATED_RECITERS.find((r) => r.id === reciterId);

  // Page layout (must be before the useEffect that depends on it)
  const pageLayout = useReadingPrefs((s) => s.pageLayout);

  // Show "Saved" toast briefly when any preference changes
  const [showSaved, setShowSaved] = useState(false);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [arabicFontId, viewMode, colorizeWords, colorPaletteId, textType, normalArabicFontSize, normalTranslationFontSize, wbwArabicFontSize, mushafArabicFontSize, mushafTranslationFontSize, wbwShowWordTranslation, wbwShowWordTransliteration, wordTranslationSize, wordTransliterationSize, reciterId, locale, pageLayout]);

  const activeColors = getActiveColors({ colorPaletteId });
  const [activeSection, setActiveSection] = useState<AccordionSection | null>(null);
  const [readingModeTab, setReadingModeTab] = useState<ReadingModeTab>(viewMode);
  const currentFont = getArabicFont(arabicFontId);

  // Preload all Google fonts
  useEffect(() => {
    for (const font of ARABIC_FONTS) {
      if (font.source === "google" && font.googleUrl) {
        const exists = document.querySelector(`link[href="${font.googleUrl}"]`);
        if (!exists) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = font.googleUrl;
          document.head.appendChild(link);
        }
      }
    }
  }, []);

  // ── Summaries ──
  const fontSummary = currentFont.name;
  const wordColorSummary = colorizeWords
    ? COLOR_PALETTES.find((p) => p.id === colorPaletteId)?.name ?? ""
    : t.settings.colorOff;
  const reciterSummary = currentReciter?.name ?? "—";
  const readingModeSummary = t.settings.viewModes[viewMode];
  const pageLayoutSummary = pageLayout === "berkenar" ? t.settings.pageLayoutBerkenar : t.settings.pageLayoutMedine;
  const langSummary = getLocaleConfig(locale).displayName;

  const PageLayoutIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1.5" />
      <rect x="14" y="3" width="7" height="18" rx="1.5" />
    </svg>
  );

  const sections: { id: AccordionSection; title: string; summary: string; icon: React.ReactNode }[] = [
    { id: "font", title: t.settings.sectionFont, summary: fontSummary, icon: <IconFont /> },
    { id: "readingMode", title: t.settings.sectionReadingMode, summary: readingModeSummary, icon: <IconBook /> },
    { id: "pageLayout", title: t.settings.sectionPageLayout, summary: pageLayoutSummary, icon: <PageLayoutIcon /> },
    { id: "wordColor", title: t.settings.sectionWordColor, summary: wordColorSummary, icon: <IconDroplet /> },
    { id: "reciter", title: t.settings.sectionReciter, summary: reciterSummary, icon: <IconMicrophone /> },
    { id: "langNav", title: t.settings.sectionLangNav, summary: langSummary, icon: <IconGlobe /> },
  ];

  const contentRef = useRef<HTMLDivElement>(null);

  function renderSectionContent(section: AccordionSection) {
    switch (section) {
      case "font":
        return (
          <FontSection
            arabicFontId={arabicFontId}
            onFontChange={setArabicFont}
            colorizeWords={colorizeWords}
            colors={activeColors}
            textType={textType}
            onTextTypeChange={setTextType}
          />
        );
      case "wordColor":
        return (
          <WordColorSection
            colorizeWords={colorizeWords}
            onColorizeChange={setColorizeWords}
            colorPaletteId={colorPaletteId}
            onPaletteChange={setColorPalette}
            colors={activeColors}
            arabicFontId={arabicFontId}
            textType={textType}
          />
        );
      case "pageLayout":
        return <PageLayoutSection />;
      case "reciter":
        return <ReciterSection />;
      case "readingMode":
        return (
          <ReadingModeSection
            readingModeTab={readingModeTab}
            onReadingModeTabChange={setReadingModeTab}
            fontFamily={currentFont.family}
            colorizeWords={colorizeWords}
            colors={activeColors}
            textType={textType}
            normalArabicFontSize={normalArabicFontSize}
            normalTranslationFontSize={normalTranslationFontSize}
            onNormalArabicSizeChange={setNormalArabicFontSize}
            onNormalTranslationSizeChange={setNormalTranslationFontSize}
            wbwArabicFontSize={wbwArabicFontSize}
            onWbwArabicSizeChange={setWbwArabicFontSize}
            wbwShowWordTranslation={wbwShowWordTranslation}
            wbwShowWordTransliteration={wbwShowWordTransliteration}
            wordTranslationSize={wordTranslationSize}
            wordTransliterationSize={wordTransliterationSize}
            onWbwShowWordTranslationChange={setWbwShowWordTranslation}
            onWbwShowWordTransliterationChange={setWbwShowWordTransliteration}
            onWordTranslationSizeChange={setWordTranslationSize}
            onWordTransliterationSizeChange={setWordTransliterationSize}
            mushafArabicFontSize={mushafArabicFontSize}
            onMushafArabicSizeChange={setMushafArabicFontSize}
            mushafTranslationFontSize={mushafTranslationFontSize}
            onMushafTranslationSizeChange={setMushafTranslationFontSize}
            mushafTooltipTextSize={mushafTooltipTextSize}
            onMushafTooltipTextSizeChange={setMushafTooltipTextSize}
          />
        );
      case "langNav":
        return (
          <LanguageSection
            locale={locale}
            onLocaleChange={handleLocaleChange}
          />
        );
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--theme-border)]" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-[var(--theme-border)]" />
        <div className="mt-6 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-20 shrink-0 animate-pulse rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[var(--theme-text)]">
        {t.settings.controlPanel}
      </h1>
      <p className="mb-5 text-sm text-[var(--theme-text-tertiary)]">
        {t.settings.subtitle}
      </p>

      {/* Presets */}
      <div className="mb-5">
        <PresetSection />
      </div>

      {/* Ribbon bar */}
      <div className="scrollbar-none grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {sections.map((s) => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveSection(active ? null : s.id);
                if (!active) {
                  requestAnimationFrame(() =>
                    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
                  );
                }
              }}
              className={`group flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
              }`}
            >
              <span className={active ? "text-white" : "text-[var(--theme-text-tertiary)] group-hover:text-[var(--theme-text-secondary)]"}>
                {s.icon}
              </span>
              <span className="text-[10px] font-medium leading-tight text-center">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      {activeSection !== null && (
        <div
          ref={contentRef}
          className="mt-3 animate-page-enter rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5"
        >
          {renderSectionContent(activeSection)}
        </div>
      )}

      {/* Show onboarding again */}
      <div className="mt-6">
        <button
          onClick={() => {
            usePreferencesStore.getState().setHasSeenOnboarding(false);
            window.location.href = "/browse/surahs";
          }}
          className="w-full rounded-xl bg-[var(--theme-pill-bg)] px-4 py-3 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
        >
          {t.onboarding.showAgain}
        </button>
      </div>

      <SaveStatusBar visible={showSaved} label={t.settings.saved} />
    </div>
  );
}
