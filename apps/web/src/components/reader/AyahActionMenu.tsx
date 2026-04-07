/**
 * Ayet eylem menüsü — dairesel ikon menü + alt eylem çubuğu.
 * Ayetin ortasında açılır. Üstte dairesel ikonlar, altta kopyala/paylaş çubuğu.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useBookmarksStore } from "~/stores/bookmarks.store";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudio, SLUG_TO_QDC_ID } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import { VerseNoteSheet } from "~/components/VerseNoteSheet";
import { MealComparisonSheet } from "~/components/MealComparisonSheet";

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

  const reference = `${surahId}:${ayahNumber}`;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(`${text}\n\n— ${reference}`);
    setCopied(label);
    setTimeout(() => onClose(), 600);
  }

  async function share() {
    const text = [textUthmani, translation, `— ${reference}`].filter(Boolean).join("\n\n");
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
      label: isBookmarked ? "Kaldır" : "Kaydet",
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
      label: "Dinle",
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
      label: "Paylaş",
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
      label: "Not",
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
      label: "Mealler",
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
    { key: "arabic", label: "Arapça", text: textUthmani },
    ...(translation ? [{ key: "translation", label: "Meal", text: translation }] : []),
    { key: "both", label: "Tümü", text: [textUthmani, translation].filter(Boolean).join("\n\n") },
  ];

  return (
    <>
      {/* Blur backdrop — ayetin tamamını kaplar */}
      <div
        className="absolute inset-0 z-40 rounded-lg backdrop-blur-[6px] bg-[var(--color-bg)]/40"
        onClick={onClose}
      />

      {/* Menü içeriği */}
      <div
        ref={menuRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {/* Ayet referansı badge */}
        <div className="px-3 py-1 rounded-full bg-[var(--color-accent)] text-white text-[11px] font-semibold tracking-wide shadow-lg">
          {surahId}:{ayahNumber}
        </div>

        {/* Ana eylemler — dairesel ikonlar + label */}
        <div className="flex items-center gap-4">
          {primaryActions.map((action) => (
            <button
              key={action.key}
              onClick={action.onClick}
              className="flex flex-col items-center gap-1.5"
              aria-label={action.label}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                ${action.active
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:text-white hover:border-transparent hover:scale-110"
                }`}
              >
                {action.icon}
              </div>
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Kopyala chip'leri */}
        <div className="flex items-center gap-1.5">
          {copyActions.map((action) => (
            <button
              key={action.key}
              onClick={() => copyText(action.text, action.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 shadow-md
                ${copied === action.key
                  ? "bg-[var(--color-accent)] text-white scale-95"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 hover:shadow-lg"
                }`}
            >
              {copied === action.key ? (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="5" y="5" width="7" height="7" rx="1" />
                    <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" />
                  </svg>
                  {action.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tahlil linki */}
        <Link
          to="/analyse/$verseKey"
          params={{ verseKey: `${surahId}:${ayahNumber}` }}
          search={{ tab: "meal" }}
          onClick={onClose}
          className="px-4 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 transition-colors shadow-md"
        >
          Ayet Tahlili
        </Link>
      </div>

      {/* Verse Note Sheet */}
      {noteOpen && (
        <VerseNoteSheet
          verseKey={`${surahId}:${ayahNumber}`}
          verseText={textUthmani}
          onClose={() => setNoteOpen(false)}
        />
      )}

      {/* Meal Karşılaştırma Sheet */}
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
