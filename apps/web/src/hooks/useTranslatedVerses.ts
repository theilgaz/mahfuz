import { useMemo } from "react";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useLocalTranslations } from "./useLocalTranslation";
import { LOCAL_TRANSLATIONS } from "@mahfuz/shared/constants";
import type { Verse } from "@mahfuz/shared/types";

/**
 * Takes an array of verses (with API translations) and returns them
 * with translations built from all user-selected translations.
 *
 * - "diyanet-api" entries keep the existing verse.translations from the API response
 * - Each local id adds an entry from the locally-loaded JSON
 */
export function useTranslatedVerses(verses: Verse[]): Verse[] {
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const { localMap } = useLocalTranslations(selectedTranslations);

  return useMemo(() => {
    if (selectedTranslations.length === 1 && selectedTranslations[0] === "diyanet-api") {
      return verses;
    }

    return verses.map((v) => {
      const translations: Verse["translations"] = [];

      for (const id of selectedTranslations) {
        if (id === "diyanet-api") {
          // Keep existing API translations
          if (v.translations?.length) {
            translations.push(...v.translations);
          }
        } else {
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
      }

      return { ...v, translations };
    });
  }, [verses, selectedTranslations, localMap]);
}
