/**
 * Mushaf sayfa overlay'i -- dokunulunca acilir, 4 saniye sonra gizlenir.
 * Ust strip: sure adi, sayfa no, cuz bilgisi
 * Alt strip: sayfa slider + onceki/sonraki
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { PageJumpDialog } from "./PageJumpDialog";
import { useQuery } from "@tanstack/react-query";
import { surahsQueryOptions } from "~/hooks/useQuranQuery";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";

const TOTAL_PAGES = 604;
const AUTO_HIDE_MS = 4000;

interface SurahGroup {
  surah: { id: number; nameArabic: string; nameSimple: string };
  ayahs: Array<{ juzNumber: number; surahId: number; ayahNumber: number }>;
  isStart: boolean;
}

interface MushafOverlayProps {
  pageNumber: number;
  surahGroups: SurahGroup[];
  onNavigate: (page: number) => void;
  onToggle?: (visible: boolean) => void;
}

export function MushafOverlay({ pageNumber, surahGroups, onNavigate, onToggle }: MushafOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locale = useLocaleStore((s) => s.locale);
  const { data: surahs } = useQuery(surahsQueryOptions());

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  }, []);

  const toggleOverlay = useCallback(() => {
    setVisible((v) => {
      const next = !v;
      if (next) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { setVisible(false); onToggle?.(false); }, AUTO_HIDE_MS);
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Reset timer on page change, hide overlay
  useEffect(() => {
    setVisible(false);
    onToggle?.(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [pageNumber, onToggle]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    resetTimer();
  }, [resetTimer]);

  // Surah info
  const uniqueSurahs = surahGroups.map((g) => g.surah);
  const juzNumber = surahGroups[0]?.ayahs[0]?.juzNumber;

  // Find surah pageStart for navigation
  const getSurahPageStart = useCallback((surahId: number): number => {
    if (!surahs) return 1;
    const s = surahs.find((s: any) => s.id === surahId);
    return s?.pageStart ?? 1;
  }, [surahs]);

  return (
    <>
      {/* Tap target -- full image area */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={toggleOverlay}
      />

      {/* Overlay strips */}
      {visible && (
        <div className="absolute inset-0 z-20 pointer-events-none" onClick={handleInteraction}>
          {/* Top strip */}
          <div
            className="pointer-events-auto flex items-center justify-between px-4 py-2.5"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 70%, transparent 100%)",
              minHeight: 44,
            }}
            onClick={handleInteraction}
          >
            {/* Surah name(s) */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {uniqueSurahs.map((surah, i) => (
                <span key={surah.id} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <span className="text-white/50 text-xs">-</span>}
                  <Link
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(getSurahPageStart(surah.id)) }}
                    search={{ ayah: undefined }}
                    className="text-white text-sm font-medium truncate hover:text-white/80 transition-colors"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {getSurahName(surah.id, locale) || surah.nameSimple}
                  </Link>
                </span>
              ))}
            </div>

            {/* Page number */}
            <button
              onClick={(e) => { e.stopPropagation(); setJumpOpen(true); resetTimer(); }}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-mono font-semibold backdrop-blur-sm"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              {pageNumber}
            </button>

            {/* Juz info */}
            {juzNumber && (
              <div
                className="text-white/80 text-xs font-medium flex-1 text-right"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              >
                Cuz {juzNumber}
              </div>
            )}
          </div>

          {/* Bottom: page counter */}
          <div
            className="pointer-events-auto absolute bottom-0 left-0 right-0 flex justify-center pb-3"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
            }}
          >
            <span
              className="text-white/80 text-xs font-mono tracking-wide"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              {pageNumber} / {TOTAL_PAGES}
            </span>
          </div>
        </div>
      )}

      {/* Page jump dialog */}
      <PageJumpDialog open={jumpOpen} onClose={() => setJumpOpen(false)} currentPage={pageNumber} />
    </>
  );
}
