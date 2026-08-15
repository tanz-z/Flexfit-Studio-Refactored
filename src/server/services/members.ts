import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { users, memberships, membershipPlans, bookings } from "@/db/schema";
import type { Db } from "@/server/lib/db";

export async function getMemberProfile(db: Db, userId: number) {
  const membership = await db
    .select({
      id: memberships.id,
      status: memberships.status,
      startDate: memberships.startDate,
      endDate: memberships.endDate,
      creditsRemaining: memberships.creditsRemaining,
      planName: membershipPlans.name,
      planCredits: membershipPlans.classCredits,
    })
    .from(memberships)
    .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.endDate))
    .get();

  const [{ attended }] = await db
    .select({ attended: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(eq(bookings.userId, userId), eq(bookings.status, "attended")),
    );

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    membership: membership ?? null,
    classesAttended: Number(attended),
  };
}

export async function updateMemberProfile(
  db: Db,
  userId: number,
  input: { name?: string; phone?: string | null },
) {
  return db
    .update(users)
    .set(input)
    .where(eq(users.id, userId))
    .returning()
    .get();
}

export async function searchMembers(db: Db, q: string, limit: number) {
  const term = `%${q.trim()}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(
      q.trim()
        ? or(like(users.name, term), like(users.email, term))
        : undefined,
    )
    .limit(limit);
}

export async function getMemberById(db: Db, id: number) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  const history = await db
    .select({
      id: memberships.id,
      planName: membershipPlans.name,
      startDate: memberships.startDate,
      endDate: memberships.endDate,
      status: memberships.status,
      creditsRemaining: memberships.creditsRemaining,
    })
    .from(memberships)
    .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
    .where(eq(memberships.userId, user.id))
    .orderBy(desc(memberships.startDate));

  const { passwordHash: _omit, ...safe } = user;
  return { ...safe, memberships: history };
}

export async function setMemberActiveStatus(db: Db, id: number, active: boolean) {
  return db
    .update(users)
    .set({ active })
    .where(eq(users.id, id))
    .returning()
    .get();
}

export async function setMemberRole(
  db: Db,
  id: number,
  role: "member" | "trainer" | "admin",
) {
  return db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning()
    .get();
}

export async function lookupMemberByEmailOrPhone(db: Db, query: string) {
  const term = `%${query.trim()}%`;
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(
      or(
        like(users.email, term),
        like(users.phone, term),
      ),
    )
    .get();

  if (!user || user.role !== "member") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  return user;
}
