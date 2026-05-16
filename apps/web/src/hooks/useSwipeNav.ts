/**
 * Mobil swipe navigasyonu — sol/sağ swipe ile sayfa değiştirme.
 *
 * Default: document'e bağlanır. `target` ref verilirse o elemana scoped olur.
 */

import { useRef, useEffect, useCallback, type RefObject } from "react";

const SWIPE_THRESHOLD = 50;

interface UseSwipeNavOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Hangi elemana scoped olunacak. Verilmezse document. */
  target?: RefObject<HTMLElement | null>;
  /** Hook aktif mi (false ise hiç listener bağlanmaz). */
  enabled?: boolean;
}

const INTERACTIVE_SELECTOR = "button, a, input, textarea, select, [role='button'], [contenteditable='true']";

export function useSwipeNav({ onSwipeLeft, onSwipeRight, target, enabled = true }: UseSwipeNavOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startedOnInteractive = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    const el = e.target as Element | null;
    startedOnInteractive.current = !!el?.closest(INTERACTIVE_SELECTOR);
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (startedOnInteractive.current) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }
    },
    [onSwipeLeft, onSwipeRight],
  );

  useEffect(() => {
    if (!enabled) return;
    const el: Document | HTMLElement = target?.current ?? document;
    el.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    el.addEventListener("touchend", handleTouchEnd as EventListener, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart as EventListener);
      el.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchEnd, target, enabled]);
}
