import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { classes, bookings, users } from "@/db/schema";
import type { Db } from "@/server/lib/db";

export async function listClasses(
  db: Db,
  input: { from?: string; to?: string; includeCancelled?: boolean },
) {
  const filters = [];
  if (input.from) filters.push(gte(classes.startsAt, input.from));
  if (input.to) filters.push(lte(classes.startsAt, input.to));
  if (!input.includeCancelled) filters.push(eq(classes.cancelled, false));

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      room: classes.room,
      capacity: classes.capacity,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      creditCost: classes.creditCost,
      cancelled: classes.cancelled,
      trainerName: users.name,
      booked: sql<number>`(
        select count(*) from ${bookings}
        where ${bookings.classId} = ${classes.id}
          and ${bookings.status} = 'booked'
      )`.as("booked"),
    })
    .from(classes)
    .leftJoin(users, eq(classes.trainerId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(classes.startsAt));

  return rows.map((r) => ({
    ...r,
    spotsLeft: Math.max(0, r.capacity - Number(r.booked)),
    full: Number(r.booked) >= r.capacity,
  }));
}

export async function getClassById(db: Db, id: number) {
  const cls = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .get();

  if (!cls) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  }

  const roster = await db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      memberName: users.name,
      memberEmail: users.email,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.classId, cls.id));

  return { ...cls, roster };
}

export async function createClass(
  db: Db,
  input: {
    name: string;
    description?: string;
    trainerId?: number;
    room: string;
    capacity: number;
    startsAt: string;
    durationMin: number;
    creditCost: number;
  },
) {
  return db
    .insert(classes)
    .values({
      ...input,
      description: input.description ?? null,
      trainerId: input.trainerId ?? null,
    })
    .returning()
    .get();
}

export async function updateClass(
  db: Db,
  id: number,
  patch: {
    name?: string;
    room?: string;
    capacity?: number;
    startsAt?: string;
    trainerId?: number | null;
  },
) {
  const updated = await db
    .update(classes)
    .set(patch)
    .where(eq(classes.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  }
  return updated;
}

export async function cancelClass(db: Db, id: number) {
  const cls = await db
    .update(classes)
    .set({ cancelled: true })
    .where(eq(classes.id, id))
    .returning()
    .get();

  if (!cls) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  }

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(
      and(eq(bookings.classId, id), eq(bookings.status, "booked")),
    );

  return cls;
}
