/**
 * Floating font size control — okuma ekranında A+/A- butonları.
 * Sol alt köşede, kompakt.
 *
 * mushaf=true modunda:
 *   A+ → "fill" modu (her satır ekran genişliğini doldurur)
 *   A- → "standard" modu (varsayılan mushaf oranları)
 */

import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "~/stores/settings.store";
import { useTranslation } from "~/hooks/useTranslation";

const STEP = 0.15;

const BTN =
  "w-9 h-9 rounded-full bg-[var(--color-surface)] border flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors active:scale-95";
const BTN_ACTIVE =
  "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]";
const BTN_IDLE = "border-[var(--color-border)]";

export function FontSizeControl({ mushaf = false }: { mushaf?: boolean }) {
  const { t } = useTranslation();
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const mushafSizeMode = useSettingsStore((s) => s.mushafSizeMode);
  const setMushafSizeMode = useSettingsStore((s) => s.setMushafSizeMode);

  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < lastY.current);
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wrapperClass = `fixed left-4 bottom-20 z-20 flex flex-col gap-1 transition-opacity duration-300 ${visible ? "opacity-60" : "opacity-0 pointer-events-none"}`;

  if (mushaf) {
    return (
      <div className={wrapperClass}>
        {/* A+ → cihaza uygun (fill) */}
        <button
          onClick={() => setMushafSizeMode("fill")}
          className={`${BTN} ${mushafSizeMode === "fill" ? BTN_ACTIVE : BTN_IDLE}`}
          aria-label={t.reader.fitScreen}
          title={t.reader.fitScreenShort}
        >
          <span className="text-sm font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
            A<sup className="text-[8px] font-bold">+</sup>
          </span>
        </button>
        {/* A- → orijinal mushaf oranları */}
        <button
          onClick={() => setMushafSizeMode("standard")}
          className={`${BTN} ${mushafSizeMode === "standard" ? BTN_ACTIVE : BTN_IDLE}`}
          aria-label={t.reader.originalSize}
          title={t.reader.originalShort}
        >
          <span className="text-[11px] font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
            A<sup className="text-[8px] font-bold">&minus;</sup>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <button
        onClick={() => setArabicFontSize(arabicFontSize + STEP)}
        className={`${BTN} ${BTN_IDLE}`}
        aria-label={t.reader.increaseFont}
      >
        <span className="text-sm font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">+</sup>
        </span>
      </button>
      <button
        onClick={() => setArabicFontSize(arabicFontSize - STEP)}
        className={`${BTN} ${BTN_IDLE}`}
        aria-label={t.reader.decreaseFont}
      >
        <span className="text-[11px] font-bold leading-none select-none" style={{ fontFamily: "var(--font-ui)" }}>
          A<sup className="text-[8px] font-bold">&minus;</sup>
        </span>
      </button>
    </div>
  );
}
