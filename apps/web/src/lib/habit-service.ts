/**
 * Alışkanlık Motoru — okuma oturumları, streak, hatim takibi.
 * Tüm server-side işlemler burada. userId daima oturumdan türetilir;
 * oturum yoksa yazma reddedilir ve okuma sorguları boş döner.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db } from "~/db";
import { readingSessions, hatims, readingGoals } from "~/db/quran-schema";
import { auth } from "~/lib/auth";
import { eq, and, desc, gte } from "drizzle-orm";

// ── Yardımcılar ──────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function currentUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ── Okuma Oturumu Kaydet ─────────────────────────────────

export const logReadingSession = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      pagesRead: number;
      ayahsRead: number;
      durationSeconds: number;
      startPage?: number;
      endPage?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const userId = await currentUserId();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };

    const today = todayStr();

    // Bugünün oturumunu bul veya oluştur
    const [existing] = await db
      .select()
      .from(readingSessions)
      .where(and(eq(readingSessions.userId, userId), eq(readingSessions.date, today)));

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
        userId,
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
      .where(and(eq(hatims.userId, userId), eq(hatims.isActive, true)));

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

    return { ok: true as const };
  });

// ── Streak Hesapla ───────────────────────────────────────

export const getStreak = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) return { currentStreak: 0, longestStreak: 0, todayPages: 0 };

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

// ── Aktivite Heatmap (son 84 gün) ────────────────────────

const HEATMAP_DAYS = 84;

export const getWeeklySummary = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  const days: Array<{ date: string; pagesRead: number }> = [];

  if (!userId) {
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) days.push({ date: dateStr(i), pagesRead: 0 });
    return days;
  }

  const startDate = dateStr(HEATMAP_DAYS - 1);
  const sessions = await db
    .select({ date: readingSessions.date, pagesRead: readingSessions.pagesRead })
    .from(readingSessions)
    .where(and(eq(readingSessions.userId, userId), gte(readingSessions.date, startDate)));

  const byDate = new Map(sessions.map((s) => [s.date, s.pagesRead]));
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = dateStr(i);
    days.push({ date, pagesRead: byDate.get(date) ?? 0 });
  }
  return days;
});

// ── Aktivite heatmap (profil, son 6 ay ~26 hafta) ────────

const HEATMAP_RANGE_DAYS = 182;

export const getYearActivity = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  const days: Array<{ date: string; pagesRead: number }> = [];

  if (!userId) {
    for (let i = HEATMAP_RANGE_DAYS - 1; i >= 0; i--) days.push({ date: dateStr(i), pagesRead: 0 });
    return days;
  }

  const startDate = dateStr(HEATMAP_RANGE_DAYS - 1);
  const sessions = await db
    .select({ date: readingSessions.date, pagesRead: readingSessions.pagesRead })
    .from(readingSessions)
    .where(and(eq(readingSessions.userId, userId), gte(readingSessions.date, startDate)));

  const byDate = new Map(sessions.map((s) => [s.date, s.pagesRead]));
  for (let i = HEATMAP_RANGE_DAYS - 1; i >= 0; i--) {
    const date = dateStr(i);
    days.push({ date, pagesRead: byDate.get(date) ?? 0 });
  }
  return days;
});

// ── Hatim ────────────────────────────────────────────────

export const getActiveHatim = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) return null;

  const [hatim] = await db
    .select()
    .from(hatims)
    .where(and(eq(hatims.userId, userId), eq(hatims.isActive, true)));

  return hatim ?? null;
});

export const startHatim = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) return null;

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

export const getReadingGoal = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) return { dailyTargetPages: 1 };

  const [goal] = await db
    .select()
    .from(readingGoals)
    .where(eq(readingGoals.userId, userId));

  return goal ?? { dailyTargetPages: 1 };
});

export const setReadingGoal = createServerFn({ method: "POST" })
  .inputValidator((input: { dailyTargetPages: number }) => input)
  .handler(async ({ data }) => {
    const userId = await currentUserId();
    if (!userId) return { ok: false as const, reason: "unauthenticated" as const };

    const [existing] = await db
      .select()
      .from(readingGoals)
      .where(eq(readingGoals.userId, userId));

    if (existing) {
      await db
        .update(readingGoals)
        .set({ dailyTargetPages: data.dailyTargetPages })
        .where(eq(readingGoals.id, existing.id));
    } else {
      await db.insert(readingGoals).values({
        userId,
        dailyTargetPages: data.dailyTargetPages,
        createdAt: new Date(),
      });
    }

    return { ok: true as const };
  });

// ── Tamamlanmış Hatimler ─────────────────────────────────

export const getCompletedHatims = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) return [];

  return db
    .select()
    .from(hatims)
    .where(and(eq(hatims.userId, userId), eq(hatims.isActive, false)))
    .orderBy(desc(hatims.completedAt));
});
