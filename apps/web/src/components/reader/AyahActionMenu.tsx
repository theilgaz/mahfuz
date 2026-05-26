/**
 * Ayet eylem menüsü — dairesel ikon menü + alt eylem çubuğu.
 * Ayetin ortasında açılır. Üstte dairesel ikonlar, altta kopyala/paylaş çubuğu.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudioForSlug } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import { VerseNoteSheet } from "~/components/VerseNoteSheet";
import { MealComparisonSheet } from "~/components/MealComparisonSheet";
import { useTranslation } from "~/hooks/useTranslation";

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
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(surahId, ayahNumber));
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const playSurah = useAudioStore((s) => s.playSurah);
  const currentChapterId = useAudioStore((s) => s.chapterId);
  const engine = useAudioStore((s) => s.engine);
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const [audioLoading, setAudioLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [mealsOpen, setMealsOpen] = useState(false);

  void anchorRect;

  const handlePlayFromHere = useCallback(async () => {
    const verseKey = `${surahId}:${ayahNumber}`;
    if (currentChapterId === surahId && engine) {
      engine.playByKey(verseKey);
      onClose();
      return;
    }
    setAudioLoading(true);
    try {
      const audioData = await fetchChapterAudioForSlug(reciterSlug, surahId);
      if (audioData) {
        const surahName = SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`;
        playSurah(surahId, surahName, audioData, verseKey);
      }
    } finally {
      setAudioLoading(false);
      onClose();
    }
  }, [surahId, ayahNumber, currentChapterId, engine, reciterSlug, playSurah, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  // Reset copied state on close
  useEffect(() => {
    if (!open) setCopied(null);
  }, [open]);

  if (!open) return null;

  const surahName = SURAH_NAMES_TR[surahId] ?? `Sure ${surahId}`;
  const shareFooter = `${surahName} ${ayahNumber} · Mahfuz\nmahfuz.ilg.az`;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(`${text}\n\n${shareFooter}`);
    setCopied(label);
    setTimeout(() => onClose(), 600);
  }

  async function share() {
    const text = [textUthmani, translation, shareFooter].filter(Boolean).join("\n\n");
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
    onClose();
  }

  // Ana eylemler — dairesel ikonlar
  const primaryActions = [
    {
      key: "bookmark",
      label: isBookmarked ? t.ayahMenu.remove : t.ayahMenu.save,
      active: isBookmarked,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M5 2.5h10a1.25 1.25 0 011.25 1.25v14.375L10 13.75 3.75 18.125V3.75A1.25 1.25 0 015 2.5z" />
        </svg>
      ),
      onClick: () => {
        toggleBookmark({ surahId, ayahNumber, pageNumber: pageNumber ?? 1 });
        onClose();
      },
    },
    {
      key: "play",
      label: t.ayahMenu.listen,
      active: false,
      icon: audioLoading ? (
        <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin" stroke="currentColor" fill="none" strokeWidth="1.5">
          <circle cx="10" cy="10" r="7" strokeDasharray="22 14" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 4L16 10L6 16V4Z" />
        </svg>
      ),
      onClick: handlePlayFromHere,
    },
    {
      key: "share",
      label: t.ayahMenu.share,
      active: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v5a1 1 0 001 1h10a1 1 0 001-1v-5M13 6l-3-3-3 3M10 3v10" />
        </svg>
      ),
      onClick: share,
    },
    {
      key: "note",
      label: t.ayahMenu.note,
      active: noteOpen,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h12v9l-4 4H4V4z" />
          <path d="M8 8h4M8 11h2" />
        </svg>
      ),
      onClick: () => setNoteOpen(true),
    },
    {
      key: "meals",
      label: t.ayahMenu.translations,
      active: mealsOpen,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h12M4 10h8M4 15h10" />
        </svg>
      ),
      onClick: () => setMealsOpen(true),
    },
  ];

  // Kopyala eylemleri — yatay chip'ler
  const copyActions = [
    { key: "arabic", label: t.ayahMenu.copyArabic, text: textUthmani },
    ...(translation ? [{ key: "translation", label: t.ayahMenu.copyTranslation, text: translation }] : []),
    { key: "both", label: t.ayahMenu.copyAll, text: [textUthmani, translation].filter(Boolean).join("\n\n") },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 rounded-lg backdrop-blur-md bg-[var(--color-bg)]/70"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg overflow-hidden"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {surahName} {ayahNumber}
          </span>
          <div className="flex items-center gap-3">
            <Link
              to="/tafsir/$verseKey"
              params={{ verseKey: `${surahId}:${ayahNumber}` }}
              search={{ source: undefined }}
              onClick={onClose}
              className="text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              {t.ayahMenu.tafsir}
            </Link>
            <Link
              to="/analyse/$verseKey"
              params={{ verseKey: `${surahId}:${ayahNumber}` }}
              search={{ tab: "meal" }}
              onClick={onClose}
              className="text-[11px] font-medium text-[var(--color-accent)]"
            >
              {t.ayahMenu.analyse}
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-5">
          {primaryActions.map((action) => (
            <button
              key={action.key}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                action.active
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] active:text-[var(--color-accent)]"
              }`}
              aria-label={action.label}
            >
              {action.icon}
              <span className="text-[9px] font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Copy row */}
        <div className="flex border-t border-[var(--color-border)]">
          {copyActions.map((action, i) => (
            <button
              key={action.key}
              onClick={() => copyText(action.text, action.key)}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                i > 0 ? "border-l border-[var(--color-border)]" : ""
              } ${
                copied === action.key
                  ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "text-[var(--color-text-secondary)] active:text-[var(--color-accent)]"
              }`}
            >
              {copied === action.key ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M3 7l3 3 5-5" />
                </svg>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Verse Note Sheet */}
      {noteOpen && (
        <VerseNoteSheet
          verseKey={`${surahId}:${ayahNumber}`}
          verseText={textUthmani}
          onClose={() => setNoteOpen(false)}
        />
      )}

      {/* Meal Comparison Sheet */}
      {mealsOpen && (
        <MealComparisonSheet
          surahId={surahId}
          ayahNumber={ayahNumber}
          ayahText={textUthmani}
          onClose={() => setMealsOpen(false)}
        />
      )}
    </>
  );
}
