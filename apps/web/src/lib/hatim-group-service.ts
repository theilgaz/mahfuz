/**
 * Hatim Grubu servisi — oluşturma, katılma, ilerleme takibi.
 */

import { createServerFn } from "@tanstack/react-start";
import { db } from "~/db";
import {
  hatimGroups,
  hatimGroupMembers,
  hatimGroupProgress,
} from "~/db/ikra-schema";
import { user } from "~/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "~/lib/auth-session";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Grup oluştur ─────────────────────────────────────────

interface CreateGroupInput {
  name: string;
  scopeType: "full" | "juz" | "range";
  scopeData?: Record<string, unknown>;
  targetDate?: number;
}

export const createHatimGroup = createServerFn({ method: "POST" })
  .inputValidator((input: CreateGroupInput) => input)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    const id = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    const now = Date.now();

    await db.insert(hatimGroups).values({
      id,
      name: data.name,
      creatorId: session.user.id,
      scopeType: data.scopeType,
      scopeData: JSON.stringify(data.scopeData ?? {}),
      targetDate: data.targetDate ?? null,
      inviteCode,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Oluşturan kişiyi otomatik ekle
    await db.insert(hatimGroupMembers).values({
      groupId: id,
      userId: session.user.id,
      assignedSections: "[]",
      joinedAt: now,
    });

    return { id, inviteCode };
  });

// ── Gruba katıl ──────────────────────────────────────────

export const joinHatimGroup = createServerFn({ method: "POST" })
  .inputValidator((inviteCode: string) => inviteCode)
  .handler(async ({ data: inviteCode }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    const [group] = await db
      .select()
      .from(hatimGroups)
      .where(and(eq(hatimGroups.inviteCode, inviteCode), eq(hatimGroups.status, "active")));

    if (!group) throw new Error("Geçersiz davet kodu veya grup aktif değil.");

    // Zaten üye mi?
    const [existing] = await db
      .select()
      .from(hatimGroupMembers)
      .where(and(eq(hatimGroupMembers.groupId, group.id), eq(hatimGroupMembers.userId, session.user.id)));

    if (existing) return { groupId: group.id, alreadyMember: true };

    await db.insert(hatimGroupMembers).values({
      groupId: group.id,
      userId: session.user.id,
      assignedSections: "[]",
      joinedAt: Date.now(),
    });

    return { groupId: group.id, alreadyMember: false };
  });

// ── Kullanıcının grupları ────────────────────────────────

export const getMyHatimGroups = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const memberships = await db
    .select()
    .from(hatimGroupMembers)
    .where(eq(hatimGroupMembers.userId, session.user.id));

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.groupId);
  const groups = await db
    .select()
    .from(hatimGroups)
    .where(inArray(hatimGroups.id, groupIds))
    .orderBy(desc(hatimGroups.createdAt));

  return groups;
});

// ── Grup dashboard ───────────────────────────────────────

export const getGroupDashboard = createServerFn({ method: "GET" })
  .inputValidator((groupId: string) => groupId)
  .handler(async ({ data: groupId }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    const [group] = await db
      .select()
      .from(hatimGroups)
      .where(eq(hatimGroups.id, groupId));

    if (!group) throw new Error("Grup bulunamadı.");

    const members = await db
      .select({ member: hatimGroupMembers, user: { id: user.id, name: user.name, image: user.image } })
      .from(hatimGroupMembers)
      .innerJoin(user, eq(hatimGroupMembers.userId, user.id))
      .where(eq(hatimGroupMembers.groupId, groupId));

    const progress = await db
      .select()
      .from(hatimGroupProgress)
      .where(eq(hatimGroupProgress.groupId, groupId));

    // Toplam tamamlanan bölüm sayısı (basit hesap)
    const scope = JSON.parse(group.scopeData);
    let totalSections = 30; // Varsayılan: 30 cüz
    if (group.scopeType === "juz" && scope.juzNumbers) {
      totalSections = scope.juzNumbers.length;
    }

    const completedByUser: Record<string, number> = {};
    for (const p of progress) {
      completedByUser[p.userId] = (completedByUser[p.userId] ?? 0) + 1;
    }

    return {
      group,
      members: members.map((m) => ({
        ...m.member,
        userName: m.user.name,
        userImage: m.user.image,
        completedCount: completedByUser[m.member.userId] ?? 0,
        totalSections,
        percentage: Math.round(((completedByUser[m.member.userId] ?? 0) / totalSections) * 100),
      })),
      totalProgress: progress.length,
      totalSections: totalSections * members.length,
    };
  });

// ── Bölüm tamamlandı olarak işaretle ────────────────────

export const markSectionComplete = createServerFn({ method: "POST" })
  .inputValidator((input: { groupId: string; sectionId: string }) => input)
  .handler(async ({ data: { groupId, sectionId } }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    const existing = await db
      .select()
      .from(hatimGroupProgress)
      .where(
        and(
          eq(hatimGroupProgress.groupId, groupId),
          eq(hatimGroupProgress.userId, session.user.id),
          eq(hatimGroupProgress.sectionId, sectionId),
        )
      );

    if (existing.length > 0) return { alreadyCompleted: true };

    await db.insert(hatimGroupProgress).values({
      id: crypto.randomUUID(),
      groupId,
      userId: session.user.id,
      sectionId,
      completedAt: Date.now(),
    });

    return { alreadyCompleted: false };
  });

// ── Bölüm tamamlanmadı olarak işaretle ──────────────────

export const unmarkSectionComplete = createServerFn({ method: "POST" })
  .inputValidator((input: { groupId: string; sectionId: string }) => input)
  .handler(async ({ data: { groupId, sectionId } }) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

    await db
      .delete(hatimGroupProgress)
      .where(
        and(
          eq(hatimGroupProgress.groupId, groupId),
          eq(hatimGroupProgress.userId, session.user.id),
          eq(hatimGroupProgress.sectionId, sectionId),
        )
      );

    return { ok: true };
  });

// ── Kullanıcının tamamladığı bölümler ───────────────────

export const getMyProgress = createServerFn({ method: "GET" })
  .inputValidator((groupId: string) => groupId)
  .handler(async ({ data: groupId }) => {
    const session = await getSession();
    if (!session?.user?.id) return [];

    const rows = await db
      .select({ sectionId: hatimGroupProgress.sectionId })
      .from(hatimGroupProgress)
      .where(
        and(
          eq(hatimGroupProgress.groupId, groupId),
          eq(hatimGroupProgress.userId, session.user.id),
        )
      );

    return rows.map((r) => r.sectionId);
  });

// ── Kullanıcının aktif grupları (otomatik takip için) ────

export const getMyActiveGroupIds = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const memberships = await db
    .select({ groupId: hatimGroupMembers.groupId })
    .from(hatimGroupMembers)
    .where(eq(hatimGroupMembers.userId, session.user.id));

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.groupId);
  const activeGroups = await db
    .select({ id: hatimGroups.id })
    .from(hatimGroups)
    .where(and(inArray(hatimGroups.id, groupIds), eq(hatimGroups.status, "active")));

  return activeGroups.map((g) => g.id);
});
