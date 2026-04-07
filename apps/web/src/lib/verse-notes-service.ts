/**
 * Ayet notları servisi — kişisel not ekleme ve okuma.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { verseNotes } from "~/db/ikra-schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "~/lib/auth-session";

export const saveVerseNote = createServerFn({ method: "POST" })
  .inputValidator((input: { verseKey: string; content: string; tags?: string[] }) => input)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    const now = Date.now();

    // Var mı kontrol et
    const [existing] = await db
      .select()
      .from(verseNotes)
      .where(and(eq(verseNotes.userId, session.user.id), eq(verseNotes.verseKey, data.verseKey)));

    if (existing) {
      await db
        .update(verseNotes)
        .set({
          content: data.content,
          tags: JSON.stringify(data.tags ?? []),
          updatedAt: now,
        })
        .where(eq(verseNotes.id, existing.id));
      return { id: existing.id };
    }

    const id = crypto.randomUUID();
    await db.insert(verseNotes).values({
      id,
      userId: session.user.id,
      verseKey: data.verseKey,
      content: data.content,
      tags: JSON.stringify(data.tags ?? []),
      isPrivate: true,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  });

export const getVerseNote = createServerFn({ method: "GET" })
  .inputValidator((verseKey: string) => verseKey)
  .handler(async ({ data: verseKey }) => {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const [note] = await db
      .select()
      .from(verseNotes)
      .where(and(eq(verseNotes.userId, session.user.id), eq(verseNotes.verseKey, verseKey)));

    return note ?? null;
  });

export const getMyVerseNotes = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(verseNotes)
    .where(eq(verseNotes.userId, session.user.id))
    .orderBy(desc(verseNotes.updatedAt))
    .limit(100);
});

export const deleteVerseNote = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    await db
      .delete(verseNotes)
      .where(and(eq(verseNotes.id, id), eq(verseNotes.userId, session.user.id)));

    return { success: true };
  });
