/**
 * Ayet eylem menüsü — yer imi, kopyala, paylaş.
 * Ayet numarasına tıklayınca açılır.
 */

import { useEffect, useRef } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";

interface AyahActionMenuProps {
  open: boolean;
  onClose: () => void;
  textUthmani: string;
  translation: string | null;
  surahId: number;
  ayahNumber: number;
  pageNumber?: number;
  anchorRect?: DOMRect | null;
}

export function AyahActionMenu({
  open,
  onClose,
  textUthmani,
  translation,
  surahId,
  ayahNumber,
  pageNumber,
  anchorRect,
}: AyahActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const reference = `${surahId}:${ayahNumber}`;

  async function copyArabic() {
    await navigator.clipboard.writeText(`${textUthmani}\n— ${reference}`);
    onClose();
  }

  async function copyTranslation() {
    if (!translation) return;
    await navigator.clipboard.writeText(`${translation}\n— ${reference}`);
    onClose();
  }

  async function copyBoth() {
    const text = [textUthmani, translation, `— ${reference}`].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(text);
    onClose();
  }

  async function share() {
    const text = [textUthmani, translation, `— ${reference}`].filter(Boolean).join("\n\n");
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
    onClose();
  }

  // Position menu near the anchor
  const style: React.CSSProperties = {};
  if (anchorRect) {
    style.position = "fixed";
    style.top = Math.min(anchorRect.bottom + 4, window.innerHeight - 200);
    style.left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 180));
    style.zIndex = 50;
  }

  return (
    <div
      ref={menuRef}
      dir="ltr"
      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 w-44"
      style={{ ...style, fontFamily: "var(--font-ui)", fontSize: "0.875rem" }}
    >
      <button
        onClick={() => {
          toggleBookmark({ surahId, ayahNumber, pageNumber: pageNumber ?? 1 });
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z" />
        </svg>
        {isBookmarked ? "Yer İmini Kaldır" : "Yer İmine Ekle"}
      </button>

      <div className="h-px bg-[var(--color-border)] my-1" />

      <button onClick={copyArabic} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <rect x="5" y="5" width="7" height="7" rx="1" />
          <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" />
        </svg>
        Arapça Kopyala
      </button>

      {translation && (
        <button onClick={copyTranslation} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <rect x="5" y="5" width="7" height="7" rx="1" />
            <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" />
          </svg>
          Meal Kopyala
        </button>
      )}

      <button onClick={copyBoth} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <rect x="5" y="5" width="7" height="7" rx="1" />
          <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" />
        </svg>
        Tümünü Kopyala
      </button>

      <div className="h-px bg-[var(--color-border)] my-1" />

      <button onClick={share} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="3" cy="7" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="11" cy="11" r="1.5" />
          <path d="M4.3 6.2L9.7 3.8M4.3 7.8L9.7 10.2" />
        </svg>
        Paylaş
      </button>
    </div>
  );
}
