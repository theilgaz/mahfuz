import { useMemo } from "react";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useLocalTranslations } from "./useLocalTranslation";
import { LOCAL_TRANSLATIONS } from "@mahfuz/shared/constants";
import type { Verse } from "@mahfuz/shared/types";

/**
 * Takes an array of verses and returns them with translations
 * from all user-selected local translation JSON files.
 * All translations are now local — no API dependency.
 */
export function useTranslatedVerses(verses: Verse[]): Verse[] {
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const { localMap } = useLocalTranslations(selectedTranslations);

  return useMemo(() => {
    if (selectedTranslations.length === 0) return verses;

    return verses.map((v) => {
      const translations: Verse["translations"] = [];

      for (const id of selectedTranslations) {
        const verseMap = localMap.get(id);
        if (verseMap) {
          const text = verseMap.get(v.verse_key) ?? "";
          const meta = LOCAL_TRANSLATIONS.find((t) => t.id === id);
          translations.push({
            id: 0,
            resource_id: 0,
            resource_name: meta?.name ?? id,
            text,
            language_name: "turkish",
          });
        }
      }

      return { ...v, translations };
    });
  }, [verses, selectedTranslations, localMap]);
}
