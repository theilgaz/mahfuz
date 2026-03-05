import type { Verse } from "@mahfuz/shared/types";
import { AyahText } from "./AyahText";
import { Bismillah } from "./Bismillah";
import { MushafView } from "./MushafView";
import { usePreferencesStore } from "~/stores/usePreferencesStore";

/** Surahs that do NOT get a Bismillah prefix (Al-Fatiha has it as verse 1, At-Tawbah has none) */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface VerseListProps {
  verses: Verse[];
  showTranslation?: boolean;
  showBismillah?: boolean;
  onPlayFromVerse?: (verseKey: string) => void;
}

export function VerseList({
  verses,
  showTranslation = true,
  showBismillah = true,
  onPlayFromVerse,
}: VerseListProps) {
  const viewMode = usePreferencesStore((s) => s.viewMode);

  if (viewMode === "mushaf") {
    return <MushafView verses={verses} showBismillah={showBismillah} />;
  }

  return (
    <div className="divide-y divide-[var(--theme-divider)]/40">
      {verses.map((verse) => {
        const surahId = Number(verse.verse_key.split(":")[0]);
        const needsBismillah =
          showBismillah &&
          verse.verse_number === 1 &&
          !NO_BISMILLAH_SURAHS.has(surahId);

        return (
          <div key={verse.id}>
            {needsBismillah && <Bismillah />}
            <AyahText
              verse={verse}
              showTranslation={showTranslation}
              onPlayFromVerse={onPlayFromVerse}
            />
          </div>
        );
      })}
    </div>
  );
}
