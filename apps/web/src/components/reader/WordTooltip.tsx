/**
 * Kelime tooltip — Arapça kelimeye tap/hover'da transliterasyon + anlam gösterir.
 * Fixed pozisyonlu, RTL metin içinde de doğru çalışır.
 */

import { useEffect, useRef } from "react";
import type { WbwWord } from "~/hooks/useWbwData";

interface WordTooltipProps {
  word: WbwWord;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function WordTooltip({ word, anchorRect, onClose }: WordTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  // Tooltip'i pencerenin dışına taşıma
  const viewportW = window.innerWidth;
  const tipW = 140;
  let left = anchorRect.left + anchorRect.width / 2 - tipW / 2;
  left = Math.max(8, Math.min(left, viewportW - tipW - 8));

  // Yukarı yeterli yer yoksa aşağıya yerleştir
  const spaceAbove = anchorRect.top;
  const tipH = 60;
  const above = spaceAbove >= tipH + 12;
  const top = above
    ? anchorRect.top - tipH - 8
    : anchorRect.bottom + 8;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[200] bg-[var(--color-surface)] border border-[var(--color-accent)]/30 rounded-xl shadow-xl px-3 py-2 text-center pointer-events-auto"
      style={{ left, top, width: tipW }}
      onClick={(e) => e.stopPropagation()}
    >
      {word.transliteration && (
        <p
          className="text-[var(--color-accent)] italic leading-tight"
          style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem" }}
        >
          {word.transliteration}
        </p>
      )}
      {word.translation && (
        <p
          className="text-[var(--color-text-translation)] leading-tight mt-0.5"
          style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem" }}
        >
          {word.translation}
        </p>
      )}
      {/* Ok */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
          above
            ? "bottom-0 translate-y-full border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[var(--color-accent)]/30"
            : "top-0 -translate-y-full border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-[var(--color-accent)]/30"
        }`}
      />
    </div>
  );
}
