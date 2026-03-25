/**
 * Yukarı kaydır butonu — 400px scroll sonrası görünür.
 */

import { useState, useEffect } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-4 sm:bottom-6 z-20 w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center hover:bg-[var(--color-border)] transition-colors"
      aria-label="Yukarı git"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14V4M5 7L9 3L13 7" />
      </svg>
    </button>
  );
}
