/**
 * Kelime tooltip — Arapça kelimeye tap/click'te transliterasyon + anlam gösterir.
 * createPortal ile document.body'e render edilir — RTL/transform container'larından etkilenmez.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    // Slight delay so the opening click/tap doesn't immediately close
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }, 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  const viewportW = window.innerWidth;
  const tipW = 160;
  let left = anchorRect.left + anchorRect.width / 2 - tipW / 2;
  left = Math.max(8, Math.min(left, viewportW - tipW - 8));

  // Kelimenin üstünde yeterli yer varsa yukarı, yoksa aşağıya
  const tipH = 64;
  const above = anchorRect.top >= tipH + 12;
  const top = above
    ? anchorRect.top - tipH - 8
    : anchorRect.bottom + 8;

  const content = (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] bg-[var(--color-surface)] border border-[var(--color-accent)]/40 rounded-xl shadow-2xl px-3 py-2 text-center pointer-events-auto"
      style={{ left, top, width: tipW }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
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
      {/* Ok işareti */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
          above
            ? "bottom-0 translate-y-full border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[var(--color-accent)]/40"
            : "top-0 -translate-y-full border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-[var(--color-accent)]/40"
        }`}
      />
    </div>
  );

  return createPortal(content, document.body);
}
