import { useState, useRef, useCallback, useEffect } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { useMemorizeGestures } from "~/hooks/useMemorizeGestures";
import type { ModeResult, VerseResult } from "~/stores/useMemorizationStore";

interface ImmersiveContentProps {
  surahId: number;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

export function ImmersiveContent({ surahId, verses, onVerseChange, onComplete }: ImmersiveContentProps) {
  const [verseIdx, setVerseIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const verseStartTime = useRef(Date.now());
  const verseResults = useRef<VerseResult[]>([]);

  const verse = verses[verseIdx];
  const words = verse?.words?.filter((w) => w.char_type_name === "word") || [];

  const recordVerse = useCallback(() => {
    if (!verse) return;
    verseResults.current.push({
      verseKey: verse.verse_key,
      mode: "immersive",
      wordsCorrect: words.length,
      wordsTotal: words.length,
      timeMs: Date.now() - verseStartTime.current,
    });
    verseStartTime.current = Date.now();
  }, [verse, words.length]);

  const goNext = useCallback(() => {
    recordVerse();
    if (verseIdx + 1 < verses.length) {
      const next = verseIdx + 1;
      setVerseIdx(next);
      setShowMeaning(false);
      onVerseChange(next);
    } else {
      const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
      onComplete({
        mode: "immersive",
        surahId,
        verseResults: verseResults.current,
        totalCorrect: totalWords,
        totalWords,
        completedAt: Date.now(),
      });
    }
  }, [verseIdx, verses.length, surahId, onComplete, onVerseChange, recordVerse]);

  const goPrev = useCallback(() => {
    if (verseIdx > 0) {
      const prev = verseIdx - 1;
      setVerseIdx(prev);
      setShowMeaning(false);
      onVerseChange(prev);
    }
  }, [verseIdx, onVerseChange]);

  const toggleMeaning = useCallback(() => {
    setShowMeaning((prev) => !prev);
  }, []);

  useMemorizeGestures(containerRef, {
    onNextVerse: goNext,
    onPrevVerse: goPrev,
    onTapCenter: toggleMeaning,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === " ") { e.preventDefault(); toggleMeaning(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, toggleMeaning]);

  if (!verse) return null;

  return (
    <div ref={containerRef} className="flex w-full max-w-2xl flex-col items-center gap-8">
      {/* Arabic text */}
      <div className="text-center" dir="rtl">
        <p className="arabic-text text-[32px] font-semibold leading-[2.2] text-white sm:text-[42px]">
          {verse.text_imlaei || words.map((w) => w.text_imlaei || w.text).join(" ")}
        </p>
      </div>

      {/* Meaning (tap to show) */}
      <div
        className={`min-h-[60px] transition-opacity duration-300 ${showMeaning ? "opacity-100" : "opacity-0"}`}
      >
        {showMeaning && (
          <div className="flex flex-wrap justify-center gap-3" dir="rtl">
            {words.map((w) => (
              <div key={w.id} className="flex flex-col items-center gap-0.5">
                <span className="text-[13px] text-white/70">
                  {w.transliteration?.text}
                </span>
                <span className="text-[11px] text-white/40">
                  {w.translation?.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verse number */}
      <span className="text-[14px] tabular-nums text-white/30">
        ﴿{verse.verse_number}﴾
      </span>

      {/* Dot indicators */}
      <div className="flex gap-1.5">
        {verses.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === verseIdx ? "w-4 bg-white/60" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
