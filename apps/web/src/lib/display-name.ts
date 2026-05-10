/**
 * Liderlik tablosu, şampiyonlar ve kupalar gibi herkese açık alanlarda
 * kullanıcı adının nasıl görüneceğini ayarlar.
 *
 *  - full      → "Ahmet Yılmaz"
 *  - initials  → "A. Y."
 *  - anonymous → "Mahfuz Kullanıcısı #1A2B"
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db, userSettings } from "~/db";
import { auth } from "~/lib/auth";
import { eq } from "drizzle-orm";

export type DisplayNameMode = "full" | "initials" | "anonymous";

export const DISPLAY_NAME_MODES: DisplayNameMode[] = ["full", "initials", "anonymous"];

const ANON_LABEL = "Mahfuz Kullanıcısı";

/** userId'den deterministik 4 karakterlik suffix üretir (anonim modda ayırt etmek için). */
function anonSuffix(userId: string): string {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) + h) ^ userId.charCodeAt(i);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(4, "0");
  return hex.slice(-4);
}

/** Tam adı, mode'a göre göstermek üzere dönüştür. */
export function formatDisplayName(
  fullName: string | null | undefined,
  mode: DisplayNameMode | string | null | undefined,
  userId: string,
): string {
  const safeMode: DisplayNameMode = mode === "initials" || mode === "anonymous" ? mode : "full";
  const trimmed = (fullName ?? "").trim();

  if (safeMode === "anonymous" || !trimmed) {
    return `${ANON_LABEL} #${anonSuffix(userId)}`;
  }

  if (safeMode === "initials") {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return `${ANON_LABEL} #${anonSuffix(userId)}`;
    if (parts.length === 1) {
      // Tek kelime: ilk harf + nokta
      return `${parts[0]!.charAt(0).toLocaleUpperCase("tr")}.`;
    }
    return parts.map((p) => `${p.charAt(0).toLocaleUpperCase("tr")}.`).join(" ");
  }

  return trimmed;
}

// ── Server functions ──────────────────────────────────────

function isMode(v: unknown): v is DisplayNameMode {
  return v === "full" || v === "initials" || v === "anonymous";
}

/** Giriş yapmış kullanıcının seçili modunu getirir. Yoksa "full" döner. */
export const getMyDisplayNameMode = createServerFn({ method: "GET" })
  .handler(async (): Promise<DisplayNameMode> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) return "full";

    const [row] = await db
      .select({ mode: userSettings.displayNameMode })
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    return isMode(row?.mode) ? row.mode : "full";
  });

/** Modu günceller (upsert). */
export const setDisplayNameMode = createServerFn({ method: "POST" })
  .inputValidator((mode: DisplayNameMode) => mode)
  .handler(async ({ data: mode }) => {
    if (!isMode(mode)) throw new Error("invalid mode");

    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user?.id) throw new Error("unauthorized");
    const userId = session.user.id;
    const now = new Date();

    const [existing] = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userSettings)
        .set({ displayNameMode: mode, updatedAt: now })
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        displayNameMode: mode,
        updatedAt: now,
      });
    }

    return { mode };
  });
