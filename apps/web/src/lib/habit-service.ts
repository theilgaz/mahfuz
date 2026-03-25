/**
 * Alışkanlık Motoru — okuma oturumları, streak, hatim takibi.
 * Tüm server-side işlemler burada.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import { readingSessions, hatims, readingGoals } from "~/db/quran-schema";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";

// ── Yardımcılar ──────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ── Okuma Oturumu Kaydet ─────────────────────────────────

export const logReadingSession = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      userId: string;
      pagesRead: number;
      ayahsRead: number;
      durationSeconds: number;
      startPage?: number;
      endPage?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const today = todayStr();

    // Bugünün oturumunu bul veya oluştur
    const [existing] = await db
      .select()
      .from(readingSessions)
      .where(and(eq(readingSessions.userId, data.userId), eq(readingSessions.date, today)));

    if (existing) {
      // Mevcut oturumu güncelle (kümülatif)
      await db
        .update(readingSessions)
        .set({
          pagesRead: existing.pagesRead + data.pagesRead,
          ayahsRead: existing.ayahsRead + data.ayahsRead,
          durationSeconds: existing.durationSeconds + data.durationSeconds,
          endPage: data.endPage ?? existing.endPage,
        })
        .where(eq(readingSessions.id, existing.id));
    } else {
      await db.insert(readingSessions).values({
        userId: data.userId,
        date: today,
        pagesRead: data.pagesRead,
        ayahsRead: data.ayahsRead,
        durationSeconds: data.durationSeconds,
        startPage: data.startPage,
        endPage: data.endPage,
      });
    }

    // Aktif hatim varsa güncelle
    const [activeHatim] = await db
      .select()
      .from(hatims)
      .where(and(eq(hatims.userId, data.userId), eq(hatims.isActive, true)));

    if (activeHatim && data.endPage) {
      const newLastPage = Math.max(activeHatim.lastPage, data.endPage);
      const isComplete = newLastPage >= 604;

      await db
        .update(hatims)
        .set({
          lastPage: newLastPage,
          ...(isComplete
            ? { completedAt: new Date(), isActive: false }
            : {}),
        })
        .where(eq(hatims.id, activeHatim.id));
    }

    return { ok: true };
  });

// ── Streak Hesapla ───────────────────────────────────────

export const getStreak = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // Son 365 günün oturumlarını çek
    const since = dateStr(365);
    const sessions = await db
      .select({ date: readingSessions.date, pagesRead: readingSessions.pagesRead })
      .from(readingSessions)
      .where(and(eq(readingSessions.userId, userId), gte(readingSessions.date, since)))
      .orderBy(desc(readingSessions.date));

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, todayPages: 0 };
    }

    const dateSet = new Set(sessions.map((s) => s.date));
    const today = todayStr();

    // Bugünün sayfaları
    const todaySession = sessions.find((s) => s.date === today);
    const todayPages = todaySession?.pagesRead ?? 0;

    // Streak hesapla — bugünden geriye doğru ardışık günler
    let currentStreak = 0;
    let checkDate = new Date();

    // Bugün okumadıysa dünden başla
    if (!dateSet.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // En uzun streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...dateSet].sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak, todayPages };
  });

// ── Haftalık Özet ────────────────────────────────────────

export const getWeeklySummary = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const days: Array<{ date: string; pagesRead: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = dateStr(i);
      const [session] = await db
        .select({ pagesRead: readingSessions.pagesRead })
        .from(readingSessions)
        .where(and(eq(readingSessions.userId, userId), eq(readingSessions.date, date)));

      days.push({ date, pagesRead: session?.pagesRead ?? 0 });
    }

    return days;
  });

// ── Hatim ────────────────────────────────────────────────

export const getActiveHatim = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const [hatim] = await db
      .select()
      .from(hatims)
      .where(and(eq(hatims.userId, userId), eq(hatims.isActive, true)));

    return hatim ?? null;
  });

export const startHatim = createServerFn({ method: "POST" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // Mevcut aktif hatmi kapat
    await db
      .update(hatims)
      .set({ isActive: false })
      .where(and(eq(hatims.userId, userId), eq(hatims.isActive, true)));

    // Yeni hatim başlat
    const [hatim] = await db
      .insert(hatims)
      .values({
        userId,
        startedAt: new Date(),
        lastPage: 1,
        isActive: true,
      })
      .returning();

    return hatim;
  });

// ── Hedef ────────────────────────────────────────────────

export const getReadingGoal = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const [goal] = await db
      .select()
      .from(readingGoals)
      .where(eq(readingGoals.userId, userId));

    return goal ?? { dailyTargetPages: 1 };
  });

export const setReadingGoal = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; dailyTargetPages: number }) => input)
  .handler(async ({ data: { userId, dailyTargetPages } }) => {
    const [existing] = await db
      .select()
      .from(readingGoals)
      .where(eq(readingGoals.userId, userId));

    if (existing) {
      await db
        .update(readingGoals)
        .set({ dailyTargetPages })
        .where(eq(readingGoals.id, existing.id));
    } else {
      await db.insert(readingGoals).values({
        userId,
        dailyTargetPages,
        createdAt: new Date(),
      });
    }

    return { ok: true };
  });

// ── Tamamlanmış Hatimler ─────────────────────────────────

export const getCompletedHatims = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return db
      .select()
      .from(hatims)
      .where(and(eq(hatims.userId, userId), eq(hatims.isActive, false)))
      .orderBy(desc(hatims.completedAt));
  });
