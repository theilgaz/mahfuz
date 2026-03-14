import type { Messages, PartialMessages } from "./types";

/** Module-level cache so each locale is merged at most once. */
const cache = new Map<string, Messages>();

/**
 * Recursively merge a partial translation bundle onto the full fallback.
 *
 * - Leaf `Record<string, string>` maps (e.g. surah name dictionaries) are
 *   treated as atomic — if the partial provides the key, it replaces the
 *   entire map; otherwise the fallback map is used as-is.
 * - Intermediate objects are merged key-by-key so partially translated
 *   sections fall back per-key.
 */
function merge(fallback: unknown, partial: unknown): unknown {
  // If partial is missing, use fallback
  if (partial === undefined || partial === null) return fallback;

  // If either side is a primitive (string, number, etc.), partial wins
  if (typeof fallback !== "object" || typeof partial !== "object") return partial;

  // Both are objects — check if this is a leaf Record<string, string>
  // (all values are strings → atomic replacement)
  const partialObj = partial as Record<string, unknown>;
  const fallbackObj = fallback as Record<string, unknown>;

  const partialValues = Object.values(partialObj);
  if (partialValues.length > 0 && partialValues.every((v) => typeof v === "string")) {
    return partial;
  }

  // Intermediate object — recurse per key
  const result: Record<string, unknown> = { ...fallbackObj };
  for (const key of Object.keys(fallbackObj)) {
    if (key in partialObj) {
      result[key] = merge(fallbackObj[key], partialObj[key]);
    }
  }
  return result;
}

/**
 * Deep-merge a partial translation onto the Turkish fallback.
 * Results are cached per locale key.
 */
export function deepMerge(
  localeKey: string,
  fallback: Messages,
  partial: PartialMessages,
): Messages {
  const cached = cache.get(localeKey);
  if (cached) return cached;

  const merged = merge(fallback, partial) as Messages;
  cache.set(localeKey, merged);
  return merged;
}
