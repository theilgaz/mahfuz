/**
 * Sayfa navigasyonu — önceki/sonraki sayfa + sayfa numarası (tıklanınca atla).
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useSwipeNav } from "~/hooks/useSwipeNav";
import { PageJumpDialog } from "./PageJumpDialog";

const TOTAL_PAGES = 604;

interface PageNavProps {
  pageNumber: number;
  enableSwipe?: boolean;
}

export function PageNav({ pageNumber, enableSwipe = false }: PageNavProps) {
  const navigate = useNavigate();
  const [jumpOpen, setJumpOpen] = useState(false);

  const goTo = useCallback(
    (page: number) => {
      if (page < 1 || page > TOTAL_PAGES) return;
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(page) }, search: { ayah: undefined } });
    },
    [navigate],
  );

  // Klavye navigasyonu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (jumpOpen) return; // dialog açıkken devre dışı
      if (e.key === "ArrowLeft") goTo(pageNumber + 1);
      if (e.key === "ArrowRight") goTo(pageNumber - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, goTo, jumpOpen]);

  // Mobil swipe navigasyonu (sadece üst PageNav'da aktif — çift ateşlemeyi önlemek için)
  useSwipeNav({
    onSwipeLeft: enableSwipe ? () => goTo(pageNumber + 1) : () => {},
    onSwipeRight: enableSwipe ? () => goTo(pageNumber - 1) : () => {},
  });

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Önceki sayfa */}
        <button
          onClick={() => goTo(pageNumber - 1)}
          disabled={pageNumber <= 1}
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Önceki sayfa"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </button>

        {/* Sayfa numarası — tıklayınca atlama diyalogu */}
        <button
          onClick={() => setJumpOpen(true)}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--color-surface)]"
        >
          {pageNumber} / {TOTAL_PAGES}
        </button>

        {/* Sonraki sayfa */}
        <button
          onClick={() => goTo(pageNumber + 1)}
          disabled={pageNumber >= TOTAL_PAGES}
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Sonraki sayfa"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 5L13 10L8 15" />
          </svg>
        </button>
      </div>

      <PageJumpDialog
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        currentPage={pageNumber}
      />
    </>
  );
}
