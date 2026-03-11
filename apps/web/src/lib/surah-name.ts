import { SURAH_NAMES_TR } from "./surah-names-tr";
import type { Locale } from "~/stores/useI18nStore";

/** Returns the surah name in the given locale. Falls back to English name. */
export function getSurahName(
  chapterId: number,
  englishName: string,
  locale: Locale,
): string {
  if (locale === "tr") return SURAH_NAMES_TR[chapterId] ?? englishName;
  return englishName;
}
