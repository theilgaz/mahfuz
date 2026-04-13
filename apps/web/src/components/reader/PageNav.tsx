/**
 * Sayfa navigasyonu — önceki/sonraki sayfa + sure/cüz seçici (tıklanınca açılır).
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { useSwipeNav } from "~/hooks/useSwipeNav";
import { SurahPicker } from "./SurahPicker";
import { useTranslation } from "~/hooks/useTranslation";

const TOTAL_PAGES = 604;

interface PageNavProps {
  pageNumber: number;
  enableSwipe?: boolean;
  /** Sayfadaki ilk surenin ID'si (sure seçici için) */
  surahId?: number;
  /** Dropdown yukarı açılsın (alt nav için) */
  dropUp?: boolean;
}

export function PageNav({ pageNumber, enableSwipe = false, surahId, dropUp = false }: PageNavProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goTo = useCallback(
    (page: number) => {
      if (page < 1 || page > TOTAL_PAGES) return;
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(page) }, search: { ayah: undefined } });
    },
    [navigate],
  );

  // Klavye navigasyonu (RTL: sola = onceki, saga = sonraki)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(pageNumber - 1);
      if (e.key === "ArrowRight") goTo(pageNumber + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, goTo]);

  // Mobil swipe navigasyonu (RTL: sola = onceki, saga = sonraki)
  useSwipeNav({
    onSwipeLeft: enableSwipe ? () => goTo(pageNumber - 1) : () => {},
    onSwipeRight: enableSwipe ? () => goTo(pageNumber + 1) : () => {},
  });

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Sonraki sayfa (sol taraf — RTL kitapta ileri yön) */}
      <button
        onClick={() => goTo(pageNumber + 1)}
        disabled={pageNumber >= TOTAL_PAGES}
        className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={t.reader.nextPage}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5L7 10L12 15" />
        </svg>
      </button>

      {/* Sure/Cüz seçici */}
      {surahId ? (
        <SurahPicker
          currentSurahId={surahId}
          mode="page"
          currentPage={pageNumber}
          totalPages={TOTAL_PAGES}
          dropUp={dropUp}
        />
      ) : (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {pageNumber} / {TOTAL_PAGES}
        </span>
      )}

      {/* Önceki sayfa (sağ taraf — RTL kitapta geri yön) */}
      <button
        onClick={() => goTo(pageNumber - 1)}
        disabled={pageNumber <= 1}
        className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={t.reader.prevPage}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 5L13 10L8 15" />
        </svg>
      </button>
    </div>
  );
}
