import type { Messages, PartialMessages } from "./types";

const cache = new Map<string, Messages>();

function merge(fallback: unknown, partial: unknown): unknown {
  if (partial === undefined || partial === null) return fallback;
  if (typeof fallback !== "object" || typeof partial !== "object") return partial;

  const partialObj = partial as Record<string, unknown>;
  const fallbackObj = fallback as Record<string, unknown>;

  const partialValues = Object.values(partialObj);
  if (partialValues.length > 0 && partialValues.every((v) => typeof v === "string")) {
    return partial;
  }

  const result: Record<string, unknown> = { ...fallbackObj };
  for (const key of Object.keys(fallbackObj)) {
    if (key in partialObj) {
      result[key] = merge(fallbackObj[key], partialObj[key]);
    }
  }
  return result;
}

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
