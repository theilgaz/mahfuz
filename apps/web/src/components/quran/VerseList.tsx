import { useRef, useEffect, useCallback } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Verse } from "@mahfuz/shared/types";
import { AyahText } from "./AyahText";
import { Bismillah } from "./Bismillah";
import { MushafView } from "./MushafView";
import { usePreferencesStore } from "~/stores/usePreferencesStore";

/** Surahs that do NOT get a Bismillah prefix (Al-Fatiha has it as verse 1, At-Tawbah has none) */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface VerseListProps {
  verses: Verse[];
  showBismillah?: boolean;
  onPlayFromVerse?: (verseKey: string) => void;
  onTogglePlayPause?: () => void;
  scrollToVerse?: number;
}

export function VerseList({
  verses,
  showBismillah = true,
  onPlayFromVerse,
  onTogglePlayPause,
  scrollToVerse,
}: VerseListProps) {
  const viewMode = usePreferencesStore((s) => s.viewMode);

  if (viewMode === "mushaf") {
    return <MushafView verses={verses} showBismillah={showBismillah} />;
  }

  return (
    <VirtualizedVerseList
      verses={verses}
      showBismillah={showBismillah}
      onPlayFromVerse={onPlayFromVerse}
      onTogglePlayPause={onTogglePlayPause}
      scrollToVerse={scrollToVerse}
    />
  );
}

function VirtualizedVerseList({
  verses,
  showBismillah,
  onPlayFromVerse,
  onTogglePlayPause,
  scrollToVerse,
}: Omit<VerseListProps, "viewMode"> & { showBismillah: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: verses.length,
    estimateSize: () => 200,
    overscan: 3,
    getItemKey: (index) => verses[index].id,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // Scroll to a specific verse when scrollToVerse changes
  useEffect(() => {
    if (scrollToVerse === undefined) return;
    const index = verses.findIndex((v) => v.verse_number === scrollToVerse);
    if (index >= 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(index, { align: "center" });
      });
    }
  }, [scrollToVerse, verses, virtualizer]);

  const measureRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        virtualizer.measureElement(node);
      }
    },
    [virtualizer],
  );

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={listRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualRow) => {
          const verse = verses[virtualRow.index];
          const surahId = Number(verse.verse_key.split(":")[0]);
          const needsBismillah =
            showBismillah &&
            verse.verse_number === 1 &&
            !NO_BISMILLAH_SURAHS.has(surahId);

          return (
            <div
              key={virtualRow.key}
              ref={measureRef}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div className="border-b border-[var(--theme-divider)]/40">
                {needsBismillah && <Bismillah />}
                <AyahText
                  verse={verse}
                  onPlayFromVerse={onPlayFromVerse}
                  onTogglePlayPause={onTogglePlayPause}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
