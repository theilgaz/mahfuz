/**
 * Mobil swipe navigasyonu — sol/sağ swipe ile sayfa değiştirme.
 */

import { useRef, useEffect, useCallback } from "react";

const SWIPE_THRESHOLD = 50;

interface UseSwipeNavOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function useSwipeNav({ onSwipeLeft, onSwipeRight }: UseSwipeNavOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Yatay hareket dikey hareketten büyükse swipe kabul et
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
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
