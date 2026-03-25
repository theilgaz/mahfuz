/**
 * Sayfa atlama diyalogu — sayfa numarasına tıklayınca açılır.
 * Hızlıca belirli bir sayfaya gitmeyi sağlar.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

const TOTAL_PAGES = 604;

interface PageJumpDialogProps {
  open: boolean;
  onClose: () => void;
  currentPage: number;
}

export function PageJumpDialog({ open, onClose, currentPage }: PageJumpDialogProps) {
  const [value, setValue] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setValue(String(currentPage));
      setTimeout(() => {
        inputRef.current?.select();
      }, 50);
    }
  }, [open, currentPage]);

  if (!open) return null;

  const pageNum = parseInt(value, 10);
  const isValid = !isNaN(pageNum) && pageNum >= 1 && pageNum <= TOTAL_PAGES;

  function handleGo() {
    if (!isValid) return;
    navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum) }, search: { ayah: undefined } });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 w-72 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-xl p-5">
        <h3 className="text-sm font-medium mb-3">Sayfaya Git</h3>

        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={TOTAL_PAGES}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-center focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="1-604"
          />
          <button
            onClick={handleGo}
            disabled={!isValid}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Git
          </button>
        </div>

        {/* Hızlı erişim butonları */}
        <div className="flex flex-wrap gap-1.5">
          {[1, 78, 188, 294, 396, 489, 604].map((p) => (
            <button
              key={p}
              onClick={() => {
                navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) }, search: { ayah: undefined } });
                onClose();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                p === currentPage
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
