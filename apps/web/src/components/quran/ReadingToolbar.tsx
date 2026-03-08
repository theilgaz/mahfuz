import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePreferencesStore, getTranslationFontSizeForMode, getArabicFontSizeForMode, getActiveColors } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import type { Verse } from "@mahfuz/shared/types";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { useAudioStore } from "~/stores/useAudioStore";
import { TranslationPicker } from "./TranslationPicker";

/* ─── Shared helpers ─── */

function SizeSlider({
  label,
  value,
  onChange,
  smallIcon,
  largeIcon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  smallIcon: React.ReactNode;
  largeIcon: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">{label}</span>
        <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(value * 100)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex w-5 shrink-0 items-center justify-center">{smallIcon}</span>
        <input type="range" min="0.6" max="2.0" step="0.05" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
        <span className="flex w-5 shrink-0 items-center justify-center">{largeIcon}</span>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${checked ? "bg-primary-600" : "bg-[var(--theme-divider)]"}`}>
      <span className={`absolute top-[2px] left-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

/* ─── Live Preview ─── */

function PreviewCard({ verse }: { verse: Verse }) {
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalShowTranslation = usePreferencesStore((s) => s.normalShowTranslation);
  const wbwShowTranslation = usePreferencesStore((s) => s.wbwShowTranslation);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const wbwTransliterationFirst = usePreferencesStore((s) => s.wbwTransliterationFirst);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);

  const arabicScale = getArabicFontSizeForMode({ viewMode, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });
  const translationScale = getTranslationFontSizeForMode({ viewMode, normalTranslationFontSize });

  const wordItems = verse.words?.filter((w) => w.char_type_name === "word") || [];
  const colorOf = (i: number) => (colorizeWords && colors.length > 0 ? colors[i % colors.length] : undefined);

  // Preview base sizes — must match actual rendering components
  const arabicPx = 26.4 * arabicScale;  // 1.65rem (AyahText.tsx)
  const wbwArabicPx = 24 * arabicScale;  // 1.5rem (WordByWord.tsx)
  const translationPx = 15 * translationScale;  // 15px (AyahText.tsx)

  if (viewMode === "wordByWord") {
    return (
      <div className="mb-4 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3">
        <div dir="rtl" className="flex flex-wrap justify-end gap-x-3 gap-y-2">
          {wordItems.map((word, i) => {
            const trEl = wbwShowWordTranslation && (
              <span key="tr" className="font-sans text-[var(--theme-text-tertiary)]" style={{ fontSize: `calc(11px * ${wordTranslationSize})`, color: colorOf(i) }}>
                {word.translation?.text}
              </span>
            );
            const tlEl = wbwShowWordTransliteration && (
              <span key="tl" className="font-sans text-[var(--theme-text-quaternary)]" style={{ fontSize: `calc(10px * ${wordTransliterationSize})`, color: colorOf(i), opacity: colorizeWords ? 0.75 : undefined }}>
                {word.transliteration?.text}
              </span>
            );
            return (
              <div key={word.id} className="flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1">
                <span className="arabic-text" style={{ fontSize: `${wbwArabicPx}px`, color: colorOf(i) }}>
                  {word.text_uthmani}
                </span>
                {wbwTransliterationFirst ? <>{tlEl}{trEl}</> : <>{trEl}{tlEl}</>}
              </div>
            );
          })}
        </div>
        {wbwShowTranslation && verse.translations?.[0] && (
          <p className="mt-2 border-l-2 border-[var(--theme-translation-accent)] pl-2.5 leading-[1.7] text-[var(--theme-text-secondary)]" style={{ fontSize: `${translationPx}px` }} dangerouslySetInnerHTML={{ __html: verse.translations[0].text }} />
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3">
      <p dir="rtl" className="arabic-text leading-[2.2] text-[var(--theme-text)]" style={{ fontSize: `${arabicPx}px` }}>
        {wordItems.map((w, i) => (
          <span key={w.id} style={{ color: colorOf(i) }}>{w.text_uthmani}{" "}</span>
        ))}
      </p>
      {viewMode === "normal" && normalShowTranslation && verse.translations?.[0] && (
        <p className="mt-2 border-l-2 border-[var(--theme-translation-accent)] pl-2.5 leading-[1.7] text-[var(--theme-text-secondary)]" style={{ fontSize: `${translationPx}px` }} dangerouslySetInnerHTML={{ __html: verse.translations[0].text }} />
      )}
    </div>
  );
}

/* ─── Mode selector options ─── */

const INNER_MODE_OPTIONS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "normal", label: "Normal",
    icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h7M3 12h10" /></svg>,
  },
  {
    value: "wordByWord", label: "Kelime",
    icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="3" width="4" height="4.5" rx="1" /><rect x="7.5" y="3" width="4" height="4.5" rx="1" /><rect x="1.5" y="9.5" width="4" height="4.5" rx="1" /><rect x="7.5" y="9.5" width="4" height="4.5" rx="1" /></svg>,
  },
  {
    value: "mushaf", label: "Mushaf",
    icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" /><path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" /></svg>,
  },
];

/* ─── iOS-style setting card ─── */

function SettingCard({ icon, iconBg, label, subtitle, checked, onChange, children }: {
  icon: React.ReactNode; iconBg: string; label: string; subtitle: string;
  checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className="mb-2 rounded-xl bg-[var(--theme-pill-bg)] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-snug text-[var(--theme-text)]">{label}</span>
          <span className="block text-[11px] leading-snug text-[var(--theme-text-quaternary)]">{subtitle}</span>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
      {checked && children && (
        <div className="mt-2 border-t border-[var(--theme-divider)] pt-2 pl-[38px]">{children}</div>
      )}
    </div>
  );
}

function CompactSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--theme-text-tertiary)]">A</span>
      <input type="range" min="0.6" max="2.0" step="0.05" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
      <span className="text-[18px] leading-none text-[var(--theme-text-tertiary)]">A</span>
      <span className="w-8 text-right text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(value * 100)}</span>
    </div>
  );
}

/* ─── Tab: Boyut ─── */

function ModeTabContent({ viewMode, setViewMode, normalArabicFontSize, setNormalArabicFontSize, wbwArabicFontSize, setWbwArabicFontSize, mushafArabicFontSize, setMushafArabicFontSize, translationFontSize, setNormalTranslationFontSize, normalShowTranslation, setNormalShowTranslation, normalShowWordHover, setNormalShowWordHover, wbwShowTranslation, setWbwShowTranslation, wbwShowWordTranslation, setWbwShowWordTranslation, wordTranslationSize, setWordTranslationSize, wbwShowWordTransliteration, setWbwShowWordTransliteration, wordTransliterationSize, setWordTransliterationSize, wbwTransliterationFirst, setWbwTransliterationFirst }: {
  viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
  normalArabicFontSize: number; setNormalArabicFontSize: (s: number) => void;
  wbwArabicFontSize: number; setWbwArabicFontSize: (s: number) => void;
  mushafArabicFontSize: number; setMushafArabicFontSize: (s: number) => void;
  translationFontSize: number; setNormalTranslationFontSize: (s: number) => void;
  normalShowTranslation: boolean; setNormalShowTranslation: (v: boolean) => void;
  normalShowWordHover: boolean; setNormalShowWordHover: (v: boolean) => void;
  wbwShowTranslation: boolean; setWbwShowTranslation: (v: boolean) => void;
  wbwShowWordTranslation: boolean; setWbwShowWordTranslation: (v: boolean) => void;
  wordTranslationSize: number; setWordTranslationSize: (s: number) => void;
  wbwShowWordTransliteration: boolean; setWbwShowWordTransliteration: (v: boolean) => void;
  wordTransliterationSize: number; setWordTransliterationSize: (s: number) => void;
  wbwTransliterationFirst: boolean; setWbwTransliterationFirst: (v: boolean) => void;
}) {
  const arabicSize = viewMode === "wordByWord" ? wbwArabicFontSize : viewMode === "mushaf" ? mushafArabicFontSize : normalArabicFontSize;
  const setArabicSize = viewMode === "wordByWord" ? setWbwArabicFontSize : viewMode === "mushaf" ? setMushafArabicFontSize : setNormalArabicFontSize;

  return (
    <>
      <div className="mb-4">
        <SegmentedControl options={INNER_MODE_OPTIONS} value={viewMode} onChange={setViewMode} stretch />
      </div>

      <SizeSlider label="Arapça Boyutu" value={arabicSize} onChange={setArabicSize}
        smallIcon={<span className="-translate-y-[4px] text-[15px] leading-none text-[var(--theme-text-tertiary)]" style={{ fontFamily: 'var(--font-arabic)' }}>ع</span>}
        largeIcon={<span className="-translate-y-[5px] text-[24px] leading-none text-[var(--theme-text-tertiary)]" style={{ fontFamily: 'var(--font-arabic)' }}>ع</span>}
      />

      {viewMode === "normal" && (
        <>
          <SettingCard
            icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h6M3 12h8" /></svg>}
            iconBg="bg-blue-500" label="Çeviri" subtitle="Meal metnini göster"
            checked={normalShowTranslation} onChange={setNormalShowTranslation}
          >
            <CompactSlider value={translationFontSize} onChange={setNormalTranslationFontSize} />
            <TranslationPicker compact />
          </SettingCard>
          <SettingCard
            icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg>}
            iconBg="bg-teal-500" label="Kelime Bilgisi" subtitle="Kelimeye dokununca çeviri ve okunuş"
            checked={normalShowWordHover} onChange={setNormalShowWordHover}
          />
        </>
      )}

      {viewMode === "wordByWord" && (
        <>
          {(wbwTransliterationFirst
            ? [
                { key: "tl", label: "Transliterasyon", subtitle: "Okunuş rehberi", checked: wbwShowWordTransliteration, onChange: setWbwShowWordTransliteration, size: wordTransliterationSize, onSize: setWordTransliterationSize, iconBg: "bg-purple-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg> },
                { key: "tr", label: "Kelime Çevirisi", subtitle: "Her kelimenin anlamı", checked: wbwShowWordTranslation, onChange: setWbwShowWordTranslation, size: wordTranslationSize, onSize: setWordTranslationSize, iconBg: "bg-emerald-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9.5" width="5.5" height="5" rx="1.5" /><rect x="9" y="9.5" width="5.5" height="5" rx="1.5" /></svg> },
              ]
            : [
                { key: "tr", label: "Kelime Çevirisi", subtitle: "Her kelimenin anlamı", checked: wbwShowWordTranslation, onChange: setWbwShowWordTranslation, size: wordTranslationSize, onSize: setWordTranslationSize, iconBg: "bg-emerald-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9.5" width="5.5" height="5" rx="1.5" /><rect x="9" y="9.5" width="5.5" height="5" rx="1.5" /></svg> },
                { key: "tl", label: "Transliterasyon", subtitle: "Okunuş rehberi", checked: wbwShowWordTransliteration, onChange: setWbwShowWordTransliteration, size: wordTransliterationSize, onSize: setWordTransliterationSize, iconBg: "bg-purple-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg> },
              ]
          ).map((item) => (
            <SettingCard key={item.key} icon={item.icon} iconBg={item.iconBg} label={item.label} subtitle={item.subtitle} checked={item.checked} onChange={item.onChange}>
              <CompactSlider value={item.size} onChange={item.onSize} />
            </SettingCard>
          ))}
          <SettingCard
            icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h6M3 12h8" /></svg>}
            iconBg="bg-blue-500" label="Çeviri" subtitle="Meal metnini göster"
            checked={wbwShowTranslation} onChange={setWbwShowTranslation}
          >
            <TranslationPicker compact />
          </SettingCard>
          <button type="button" onClick={() => setWbwTransliterationFirst(!wbwTransliterationFirst)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--theme-pill-bg)] px-3 py-2 text-[12px] font-medium text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M7 4l-4 4M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4" /></svg>
            Sırayı Değiştir
          </button>
        </>
      )}
    </>
  );
}

/* ─── Main Component ─── */

export function ReadingToolbar({ segmentStyle }: { segmentStyle?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const audioVisible = useAudioStore((s) => s.isVisible);

  // Preview verse (Besmele — Fatiha 1)
  const { data: rawPreviewVerse } = useQuery(verseByKeyQueryOptions("1:1"));
  const translatedPreview = useTranslatedVerses(rawPreviewVerse ? [rawPreviewVerse] : []);
  const previewVerse = translatedPreview[0] ?? rawPreviewVerse;

  // View mode
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);

  // Arabic font sizes (per-mode)
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const setNormalArabicFontSize = usePreferencesStore((s) => s.setNormalArabicFontSize);
  const setWbwArabicFontSize = usePreferencesStore((s) => s.setWbwArabicFontSize);
  const setMushafArabicFontSize = usePreferencesStore((s) => s.setMushafArabicFontSize);

  // Normal mode settings
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const setNormalTranslationFontSize = usePreferencesStore((s) => s.setNormalTranslationFontSize);
  const normalShowTranslation = usePreferencesStore((s) => s.normalShowTranslation);
  const setNormalShowTranslation = usePreferencesStore((s) => s.setNormalShowTranslation);
  const normalShowWordHover = usePreferencesStore((s) => s.normalShowWordHover);
  const setNormalShowWordHover = usePreferencesStore((s) => s.setNormalShowWordHover);
  // Word-by-word settings
  const wbwShowTranslation = usePreferencesStore((s) => s.wbwShowTranslation);
  const setWbwShowTranslation = usePreferencesStore((s) => s.setWbwShowTranslation);
  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const setWbwShowWordTranslation = usePreferencesStore((s) => s.setWbwShowWordTranslation);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const setWordTranslationSize = usePreferencesStore((s) => s.setWordTranslationSize);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const setWbwShowWordTransliteration = usePreferencesStore((s) => s.setWbwShowWordTransliteration);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const setWordTransliterationSize = usePreferencesStore((s) => s.setWordTransliterationSize);
  const wbwTransliterationFirst = usePreferencesStore((s) => s.wbwTransliterationFirst);
  const setWbwTransliterationFirst = usePreferencesStore((s) => s.setWbwTransliterationFirst);

  const translationFontSize = getTranslationFontSizeForMode({ viewMode, normalTranslationFontSize });

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleClickOutside, handleEscape]);

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 font-medium transition-colors ${
          segmentStyle
            ? `relative z-[1] justify-center rounded-lg px-2.5 py-1.5 text-[12px] sm:px-3.5 ${open ? "text-[var(--theme-text)]" : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"}`
            : `h-8 rounded-full px-3 text-[13px] ${open ? "bg-primary-600 text-white" : "bg-[var(--theme-pill-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)]"}`
        }`}
        aria-label="Okuma ayarları" aria-expanded={open}
      >
        <span className="text-[14px] font-semibold">A</span>
        <span className="arabic-text text-[14px] font-semibold leading-none">ع</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />
          <div ref={popoverRef}
            className={`fixed inset-x-0 z-50 max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-5 pb-8 shadow-[var(--shadow-float)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:p-4 sm:pb-4 sm:animate-toolbar-in ${audioVisible ? "bottom-16" : "bottom-0"}`}
            style={{ backdropFilter: "saturate(180%) blur(20px)" }}
          >
            {/* Mobile header */}
            <div className="mb-3 flex items-center justify-between sm:hidden">
              <span className="text-[14px] font-semibold text-[var(--theme-text)]">Okuma Ayarları</span>
              <button onClick={() => setOpen(false)} className="flex h-7 items-center gap-1 rounded-full bg-primary-600 px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700" aria-label="Kapat">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Tamam
              </button>
            </div>

            {/* Live preview */}
            {previewVerse && <PreviewCard verse={previewVerse} />}

            <ModeTabContent
              viewMode={viewMode} setViewMode={setViewMode}
              normalArabicFontSize={normalArabicFontSize} setNormalArabicFontSize={setNormalArabicFontSize}
              wbwArabicFontSize={wbwArabicFontSize} setWbwArabicFontSize={setWbwArabicFontSize}
              mushafArabicFontSize={mushafArabicFontSize} setMushafArabicFontSize={setMushafArabicFontSize}
              translationFontSize={translationFontSize} setNormalTranslationFontSize={setNormalTranslationFontSize}
              normalShowTranslation={normalShowTranslation} setNormalShowTranslation={setNormalShowTranslation}
              normalShowWordHover={normalShowWordHover} setNormalShowWordHover={setNormalShowWordHover}
              wbwShowTranslation={wbwShowTranslation} setWbwShowTranslation={setWbwShowTranslation}
              wbwShowWordTranslation={wbwShowWordTranslation} setWbwShowWordTranslation={setWbwShowWordTranslation}
              wordTranslationSize={wordTranslationSize} setWordTranslationSize={setWordTranslationSize}
              wbwShowWordTransliteration={wbwShowWordTransliteration} setWbwShowWordTransliteration={setWbwShowWordTransliteration}
              wordTransliterationSize={wordTransliterationSize} setWordTransliterationSize={setWordTransliterationSize}
              wbwTransliterationFirst={wbwTransliterationFirst} setWbwTransliterationFirst={setWbwTransliterationFirst}
            />
          </div>
        </>
      )}
    </div>
  );
}
