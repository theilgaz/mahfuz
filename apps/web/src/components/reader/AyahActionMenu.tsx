/**
 * Ayet eylem menüsü — yer imi, kopyala, paylaş.
 * Ayet numarasına tıklayınca açılır.
 */

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudio, SLUG_TO_QDC_ID } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";

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
  const playSurah = useAudioStore((s) => s.playSurah);
  const currentChapterId = useAudioStore((s) => s.chapterId);
  const playbackState = useAudioStore((s) => s.playbackState);
  const engine = useAudioStore((s) => s.engine);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const [audioLoading, setAudioLoading] = useState(false);

  const handlePlayFromHere = useCallback(async () => {
    const verseKey = `${surahId}:${ayahNumber}`;

    // Aynı sure zaten yüklüyse, direkt o ayete atla
    if (currentChapterId === surahId && engine) {
      engine.playByKey(verseKey);
      onClose();
      return;
    }

    // Yeni sure yükle ve belirtilen ayetten başlat
    setAudioLoading(true);
    try {
      const reciterId = SLUG_TO_QDC_ID[reciterSlug] ?? 7;
      const audioData = await fetchChapterAudio(reciterId, surahId);
      if (audioData) {
        const surahName = SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`;
        playSurah(surahId, surahName, audioData, verseKey);
      }
    } finally {
      setAudioLoading(false);
      onClose();
    }
  }, [surahId, ayahNumber, currentChapterId, engine, reciterSlug, playSurah, onClose]);

  // Position menu at cursor — measure after render for accurate placement
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRect || !menuRef.current) {
      setPos(null);
      return;
    }

    const menu = menuRef.current;
    const menuW = menu.offsetWidth;
    const menuH = menu.offsetHeight;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Ayetin yatay ve dikey merkezi
    const cx = anchorRect.left + anchorRect.width / 2;
    const cy = anchorRect.top + anchorRect.height / 2;

    // Menüyü ayetin tam ortasına yerleştir
    let left = cx - menuW / 2;
    let top = cy - menuH / 2;

    // Viewport sınırlarına clamp
    left = Math.max(pad, Math.min(left, vw - menuW - pad));
    top = Math.max(pad, Math.min(top, vh - menuH - pad));

    setPos({ top, left });
  }, [open, anchorRect]);

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

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    ...(pos ? { top: pos.top, left: pos.left, opacity: 1 } : { top: 0, left: -9999, opacity: 0 }),
  };

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

      <button
        onClick={handlePlayFromHere}
        disabled={audioLoading}
        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {audioLoading ? (
          <svg width="14" height="14" viewBox="0 0 14 14" className="animate-spin" stroke="currentColor" fill="none" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" strokeDasharray="16 10" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M4 2L12 7L4 12V2Z" />
          </svg>
        )}
        Buradan Dinle
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
