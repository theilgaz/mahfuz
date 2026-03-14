import { useState } from "react";
import {
  usePreferencesStore,
  ARABIC_FONTS,
  getArabicFont,
  getActiveColors,
  COLOR_PALETTES,
} from "~/stores/usePreferencesStore";
import type { Theme, ColorPaletteId } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";
import { getAllLocaleConfigs } from "~/locales/registry";
import { useAudioStore } from "~/stores/useAudioStore";
import { CURATED_RECITERS } from "@mahfuz/shared/constants";
import { ReciterModal } from "~/components/audio/ReciterModal";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/Dialog";
import { MahfuzLogo } from "~/components/icons";

const TOTAL_STEPS = 4;

const THEMES: { value: Theme; color: string; border: string }[] = [
  { value: "light", color: "#ffffff", border: "#d2d2d7" },
  { value: "crystal", color: "#ffffff", border: "#007AFF" },
  { value: "sepia", color: "#f5ead6", border: "#d4b882" },
  { value: "dark", color: "#1a1a1a", border: "#444" },
  { value: "dimmed", color: "#22272e", border: "#444c56" },
  { value: "teal", color: "#1c3f44", border: "#2a5a60" },
  { value: "black", color: "#000000", border: "#333" },
];

// Top 6 fonts across groups for the onboarding grid
const ONBOARDING_FONT_IDS = [
  "uthmani-hafs",
  "me-quran",
  "scheherazade-new",
  "amiri",
  "noto-naskh-arabic",
  "reem-kufi",
];
const ONBOARDING_FONTS = ONBOARDING_FONT_IDS.map(
  (id) => ARABIC_FONTS.find((f) => f.id === id)!,
);

const BISMILLAH_WORDS = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reciterModalOpen, setReciterModalOpen] = useState(false);

  const setHasSeenOnboarding = usePreferencesStore(
    (s) => s.setHasSeenOnboarding,
  );
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const setArabicFont = usePreferencesStore((s) => s.setArabicFont);
  const textType = usePreferencesStore((s) => s.textType);
  const setTextType = usePreferencesStore((s) => s.setTextType);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const setColorizeWords = usePreferencesStore((s) => s.setColorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const setColorPalette = usePreferencesStore((s) => s.setColorPalette);

  const reciterId = useAudioStore((s) => s.reciterId);

  const { t, locale } = useTranslation();
  const setLocale = useI18nStore((s) => s.setLocale);

  const currentFont = getArabicFont(arabicFontId);
  const currentReciter = CURATED_RECITERS.find((r) => r.id === reciterId);
  const colors = getActiveColors({ colorPaletteId });

  const finish = () => setHasSeenOnboarding(true);

  const features = [
    { icon: "\u{1F4D6}", label: t.onboarding.feature_read },
    { icon: "\u{1F3A7}", label: t.onboarding.feature_listen },
    { icon: "\u{1F393}", label: t.onboarding.feature_learn },
    { icon: "\u{1F9E0}", label: t.onboarding.feature_memorize },
  ];

  return (
    <Dialog open>
      <DialogContent preventOverlayClose className="z-[100]">
        <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-modal)]">
          <DialogTitle style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{t.onboarding.welcomeTitle}</DialogTitle>
        {/* Skip */}
        {step < TOTAL_STEPS - 1 && (
          <button
            onClick={finish}
            className="absolute right-4 top-4 z-10 text-[12px] font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
          >
            {t.onboarding.skip}
          </button>
        )}

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* Step 1: Welcome */}
            <div className="w-full shrink-0 p-8 text-center">
              <MahfuzLogo branded size={56} className="mx-auto mb-4" />
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">
                {t.onboarding.welcomeTitle}
              </h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">
                {t.onboarding.welcomeSubtitle}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {features.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl bg-[var(--theme-pill-bg)] px-3 py-3 text-center"
                  >
                    <span className="mb-1 block text-[22px]">{f.icon}</span>
                    <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Preferences */}
            <div className="w-full shrink-0 overflow-y-auto max-h-[70vh] p-8 text-center">
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">
                {t.onboarding.prefsTitle}
              </h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">
                {t.onboarding.prefsSubtitle}
              </p>
              <div className="mb-5 grid grid-cols-4 justify-items-center gap-x-2 gap-y-3">
                {THEMES.map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTheme(th.value)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${theme === th.value ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`}
                      style={{ backgroundColor: th.color, boxShadow: th.value === "crystal" ? "inset 0 0 0 2px #007AFF" : undefined }}
                    >
                      {theme === th.value && (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke={
                            ["dark", "dimmed", "teal", "black"].includes(th.value)
                              ? "#e5e5e5"
                              : th.value === "crystal"
                                ? "#007AFF"
                                : "#059669"
                          }
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--theme-text-tertiary)]">
                      {t.theme[th.value as Theme]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-pill-bg)] p-1">
                {getAllLocaleConfigs().map(({ code, config }) => (
                  <button
                    key={code}
                    onClick={() => setLocale(code)}
                    className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${locale === code ? "bg-primary-600 text-white" : "text-[var(--theme-text-secondary)]"}`}
                  >
                    {config.displayName}
                  </button>
                ))}
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="mt-5 flex w-full items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)] transition-colors"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {t.onboarding.advanced}
              </button>

              {/* Advanced Settings Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? "mt-4 max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-5 text-left">
                  {/* Font Selection */}
                  <div>
                    <label className="mb-2 block text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {t.onboarding.font}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ONBOARDING_FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setArabicFont(font.id)}
                          className={`rounded-xl border-2 px-2 py-2.5 text-center transition-all ${arabicFontId === font.id ? "border-primary-600 bg-primary-600/5" : "border-[var(--theme-border)] hover:border-[var(--theme-text-tertiary)]"}`}
                        >
                          <span
                            dir="rtl"
                            className="block text-[16px] leading-relaxed text-[var(--theme-text)]"
                            style={{ fontFamily: font.family }}
                          >
                            {"بِسْمِ ٱللَّهِ"}
                          </span>
                          <span className="mt-1 block text-[9px] text-[var(--theme-text-tertiary)]">
                            {font.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reciter Selection */}
                  <div>
                    <label className="mb-2 block text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {t.onboarding.reciter}
                    </label>
                    <button
                      onClick={() => setReciterModalOpen(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--theme-border)] px-3 py-2.5 text-left transition-colors hover:border-[var(--theme-text-tertiary)]"
                    >
                      <span className="text-[13px] text-[var(--theme-text)]">
                        {currentReciter?.name ?? "—"}
                      </span>
                      <span className="text-[12px] font-medium text-primary-600">
                        {t.onboarding.changeReciter}
                      </span>
                    </button>
                  </div>

                  {/* Script Type Toggle */}
                  <div>
                    <label className="mb-2 block text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {t.onboarding.script}
                    </label>
                    <div className="flex items-center gap-2 rounded-xl bg-[var(--theme-pill-bg)] p-1">
                      <button
                        onClick={() => setTextType("uthmani")}
                        className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${textType === "uthmani" ? "bg-primary-600 text-white" : "text-[var(--theme-text-secondary)]"}`}
                      >
                        {t.onboarding.uthmani}
                      </button>
                      <button
                        onClick={() => setTextType("simple")}
                        className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${textType === "simple" ? "bg-primary-600 text-white" : "text-[var(--theme-text-secondary)]"}`}
                      >
                        {t.onboarding.simple}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bismillah Preview */}
              {showAdvanced && (
                <p
                  dir="rtl"
                  className="arabic-text mt-4 rounded-xl bg-[var(--theme-pill-bg)] px-4 py-3 text-[22px] leading-[2] text-[var(--theme-text)]"
                  style={{ fontFamily: currentFont.family }}
                >
                  {textType === "uthmani"
                    ? "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
                    : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                </p>
              )}
            </div>

            {/* Step 3: Word Colors */}
            <div className="w-full shrink-0 p-8 text-center">
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">
                {t.onboarding.colorTitle}
              </h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">
                {t.onboarding.colorSubtitle}
              </p>

              {/* Toggle */}
              <div className="mb-5 flex items-center justify-between rounded-xl bg-[var(--theme-pill-bg)] px-4 py-3">
                <span className="text-[13px] font-medium text-[var(--theme-text)]">
                  {t.theme.colorizeWords}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={colorizeWords}
                  onClick={() => setColorizeWords(!colorizeWords)}
                  className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${colorizeWords ? "bg-primary-600" : "bg-[var(--theme-divider)]"}`}
                >
                  <span className={`absolute top-[2px] left-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${colorizeWords ? "translate-x-[18px]" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Palette grid */}
              {colorizeWords && (
                <div className="mb-5 flex items-center justify-center gap-3">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setColorPalette(p.id as ColorPaletteId)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${colorPaletteId === p.id ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`}
                      aria-label={p.name}
                      title={p.name}
                    >
                      <svg width="20" height="20" viewBox="0 0 18 18">
                        <rect x="1" y="1" width="7" height="7" rx="1.5" fill={p.colors[0]} />
                        <rect x="10" y="1" width="7" height="7" rx="1.5" fill={p.colors[1]} />
                        <rect x="1" y="10" width="7" height="7" rx="1.5" fill={p.colors[2]} />
                        <rect x="10" y="10" width="7" height="7" rx="1.5" fill={p.colors[3]} />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Bismillah color preview */}
              <p
                dir="rtl"
                className="arabic-text rounded-xl bg-[var(--theme-pill-bg)] px-4 py-4 text-[24px] leading-[2] text-[var(--theme-text)]"
                style={{ fontFamily: currentFont.family }}
              >
                {BISMILLAH_WORDS.map((word, i) => (
                  <span key={i}>
                    {i > 0 && " "}
                    <span style={colorizeWords ? { color: colors[i % colors.length] } : undefined}>
                      {word}
                    </span>
                  </span>
                ))}
              </p>
            </div>

            {/* Step 4: Ready */}
            <div className="w-full shrink-0 p-8 text-center">
              <p
                dir="rtl"
                className="arabic-text mb-4 text-[28px] leading-[2] text-[var(--theme-text)]"
              >
                {"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"}
              </p>
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">
                {t.onboarding.readyTitle}
              </h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">
                {t.onboarding.readySubtitle}
              </p>
              <button
                onClick={finish}
                className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
              >
                {t.onboarding.start}
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Back + Dots/Counter + Next */}
        <div className="flex items-center justify-between border-t border-[var(--theme-border)] px-6 py-4">
          {/* Back button */}
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg px-4 py-1.5 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
            >
              {t.onboarding.back}
            </button>
          ) : (
            <span className="w-[60px]" />
          )}

          {/* Dots + Step counter */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${step === i ? "w-4 bg-primary-600" : "w-1.5 bg-[var(--theme-divider)] hover:bg-[var(--theme-text-tertiary)]"}`}
                  aria-label={`${i + 1} / ${TOTAL_STEPS}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[var(--theme-text-tertiary)]">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>

          {/* Next button */}
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t.onboarding.next}
            </button>
          ) : (
            <span className="w-[60px]" />
          )}
        </div>
      </div>

        {/* Reciter Modal */}
        <ReciterModal
          open={reciterModalOpen}
          onClose={() => setReciterModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
