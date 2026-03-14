import type { tr } from "./tr";

/** Full message shape — derived from the Turkish (source) locale. */
export type Messages = typeof tr;

/**
 * Makes every nested key optional while keeping leaf `Record<string, string>`
 * maps (e.g. surah name dictionaries) atomic — they're either provided in full
 * or omitted entirely.
 */
export type DeepPartial<T> = T extends Record<string, string>
  ? T
  : { [K in keyof T]?: DeepPartial<T[K]> };

/** Partial translation bundle — used by incomplete locales that fall back to Turkish. */
export type PartialMessages = DeepPartial<Messages>;

/** Text direction hint for the locale. */
export type Direction = "ltr" | "rtl";

/** Metadata for a registered locale. */
export interface LocaleConfig {
  messages: Messages | PartialMessages;
  displayName: string;
  dir: Direction;
  bcp47: string;
  /** True when every key in Messages is present (no fallback needed). */
  complete: boolean;
}
