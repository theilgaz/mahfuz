/**
 * Builds a map from verse keys to page numbers.
 * Used for audio auto-navigation to direct users to the correct page during playback.
 *
 * @param verses - Array of verses with verse_key and page_number properties
 * @returns A record mapping verse keys (e.g., "1:1") to page numbers
 */
export function buildVersePageMap(
  verses: { verse_key: string; page_number: number }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of verses) map[v.verse_key] = v.page_number;
  return map;
}
