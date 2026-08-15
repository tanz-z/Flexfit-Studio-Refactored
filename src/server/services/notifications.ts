import { and, eq, desc, not, sql } from "drizzle-orm";
import { notifications, users } from "@/db/schema";
import type { Db } from "@/server/lib/db";

export async function getUnreadNotificationCount(db: Db, userId: number) {
  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        not(notifications.read),
      ),
    );

  return Number(count) || 0;
}

export async function listNotifications(db: Db, userId: number, limit: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllNotificationsAsRead(db: Db, userId: number) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, userId),
        not(notifications.read),
      ),
    );

  return { ok: true };
}

export async function broadcastAnnouncement(
  db: Db,
  title: string,
  message: string,
) {
  const activeMembers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "member"));

  if (activeMembers.length === 0) {
    return { ok: true, count: 0 };
  }

  await db.insert(notifications).values(
    activeMembers.map((member) => ({
      userId: member.id,
      type: "announcement" as const,
      title,
      message,
    })),
  );

  return { ok: true, count: activeMembers.length };
}
