/**
 * Floating font size control — okuma ekranında A+/A- butonları.
 * Sol alt köşede, kompakt.
 */

import { useSettingsStore } from "~/stores/settings.store";

const STEP = 0.15;

export function FontSizeControl() {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);

  return (
    <div className="fixed left-4 bottom-20 z-20 flex flex-col gap-1">
      <button
        onClick={() => setArabicFontSize(arabicFontSize + STEP)}
        className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors active:scale-95"
        aria-label="Yazı boyutunu büyüt"
      >
        <span className="text-sm font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">+</sup>
        </span>
      </button>
      <button
        onClick={() => setArabicFontSize(arabicFontSize - STEP)}
        className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors active:scale-95"
        aria-label="Yazı boyutunu küçült"
      >
        <span className="text-[11px] font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">&minus;</sup>
        </span>
      </button>
    </div>
  );
}
