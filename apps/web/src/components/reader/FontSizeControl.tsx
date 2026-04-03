/**
 * Floating font size control — okuma ekranında A+/A- butonları.
 * Sol alt köşede, kompakt.
 *
 * mushaf=true modunda:
 *   A+ → "fill" modu (her satır ekran genişliğini doldurur)
 *   A- → "standard" modu (varsayılan mushaf oranları)
 */

import { useSettingsStore } from "~/stores/settings.store";

const STEP = 0.15;

const BTN =
  "w-9 h-9 rounded-full bg-[var(--color-surface)] border shadow-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors active:scale-95";
const BTN_ACTIVE =
  "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]";
const BTN_IDLE = "border-[var(--color-border)]";

export function FontSizeControl({ mushaf = false }: { mushaf?: boolean }) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const mushafSizeMode = useSettingsStore((s) => s.mushafSizeMode);
  const setMushafSizeMode = useSettingsStore((s) => s.setMushafSizeMode);

  if (mushaf) {
    return (
      <div className="fixed left-4 bottom-20 z-20 flex flex-col gap-1">
        {/* A+ → cihaza uygun (fill) */}
        <button
          onClick={() => setMushafSizeMode("fill")}
          className={`${BTN} ${mushafSizeMode === "fill" ? BTN_ACTIVE : BTN_IDLE}`}
          aria-label="Ekrana uygun boyut"
          title="Ekrana uygun"
        >
          <span className="text-sm font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
            A<sup className="text-[8px] font-bold">+</sup>
          </span>
        </button>
        {/* A- → orijinal mushaf oranları */}
        <button
          onClick={() => setMushafSizeMode("standard")}
          className={`${BTN} ${mushafSizeMode === "standard" ? BTN_ACTIVE : BTN_IDLE}`}
          aria-label="Mushaf orijinal boyutu"
          title="Orijinal"
        >
          <span className="text-[11px] font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
            A<sup className="text-[8px] font-bold">&minus;</sup>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-4 bottom-20 z-20 flex flex-col gap-1">
      <button
        onClick={() => setArabicFontSize(arabicFontSize + STEP)}
        className={`${BTN} ${BTN_IDLE}`}
        aria-label="Yazı boyutunu büyüt"
      >
        <span className="text-sm font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">+</sup>
        </span>
      </button>
      <button
        onClick={() => setArabicFontSize(arabicFontSize - STEP)}
        className={`${BTN} ${BTN_IDLE}`}
        aria-label="Yazı boyutunu küçült"
      >
        <span className="text-[11px] font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">&minus;</sup>
        </span>
      </button>
    </div>
  );
}
