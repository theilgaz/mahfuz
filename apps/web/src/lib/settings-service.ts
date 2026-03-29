/**
 * Settings persistence — server-side save/load.
 * Kullanıcının tüm ayarlarını DB'de JSON blob olarak saklar.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { userSettings } from "~/db/schema";
import { eq } from "drizzle-orm";

/** Ayar verisi — settings store + locale */
export interface UserSettingsData {
  theme?: string;
  textStyle?: string;
  translationSlugs?: string[];
  showTranslation?: boolean;
  showWbw?: boolean;
  wbwTranslation?: string;
  wbwTranslit?: string;
  showTajweed?: boolean;
  readingMode?: string;
  surahListFilter?: string;
  reciterSlug?: string;
  arabicFontSize?: number;
  translationFontSize?: number;
  locale?: string;
}

/** Kullanıcının ayarlarını getir */
export const getUserSettings = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<UserSettingsData | null> => {
    const [row] = await db
      .select({ data: userSettings.data })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!row) return null;

    try {
      return JSON.parse(row.data) as UserSettingsData;
    } catch {
      return null;
    }
  });

/** Kullanıcının ayarlarını kaydet (upsert) */
export const saveUserSettings = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; data: UserSettingsData }) => input)
  .handler(async ({ data: { userId, data } }) => {
    const json = JSON.stringify(data);
    const now = new Date();

    const [existing] = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userSettings)
        .set({ data: json, updatedAt: now })
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        data: json,
        updatedAt: now,
      });
    }
  });
