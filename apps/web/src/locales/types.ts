import type { tr } from "./tr";

/** Recursively widen string literal types to string. */
type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> };

/** Full message shape — derived from the Turkish (source) locale. */
export type Messages = Widen<typeof tr>;

/** Makes every nested key optional while keeping leaf string maps atomic. */
export type DeepPartial<T> = T extends Record<string, string>
  ? T
  : { [K in keyof T]?: DeepPartial<T[K]> };

/** Partial translation bundle — used by incomplete locales that fall back to Turkish. */
export type PartialMessages = DeepPartial<Messages>;

/** Metadata for a registered locale. */
export interface LocaleConfig {
  messages: Messages | PartialMessages;
  displayName: string;
  dir: "ltr" | "rtl";
  bcp47: string;
}
