import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { reschedules, bookings, classes } from "@/db/schema";
import type { Db } from "@/server/lib/db";
import { validateRescheduleRequest } from "@/server/lib/reschedule-validation";

async function loadBookingWithClass(db: Db, bookingId: number) {
  return db
    .select({ booking: bookings, cls: classes })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.id, bookingId))
    .get();
}

async function countBookedSpots(db: Db, classId: number) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(and(eq(bookings.classId, classId), eq(bookings.status, "booked")));
  return Number(count);
}

async function hasActiveBookingForClass(
  db: Db,
  classId: number,
  userId: number,
) {
  const row = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, classId),
        eq(bookings.userId, userId),
        sql`${bookings.status} in ('booked', 'waitlisted')`,
      ),
    )
    .get();
  return !!row;
}

export async function validateReschedule(
  db: Db,
  userId: number,
  fromBookingId: number,
  toClassId: number,
) {
  const originalRow = await loadBookingWithClass(db, fromBookingId);
  if (!originalRow) {
    return { valid: false as const, reason: "Booking not found." };
  }

  const targetClass = await db
    .select()
    .from(classes)
    .where(eq(classes.id, toClassId))
    .get();

  const targetBookedCount = targetClass
    ? await countBookedSpots(db, targetClass.id)
    : 0;

  const hasExistingTargetBooking = targetClass
    ? await hasActiveBookingForClass(db, targetClass.id, userId)
    : false;

  return validateRescheduleRequest({
    originalBooking: originalRow.booking,
    originalClass: originalRow.cls,
    targetClass,
    userId,
    targetBookedCount,
    hasExistingTargetBooking,
  });
}

export async function rescheduleBooking(
  db: Db,
  userId: number,
  fromBookingId: number,
  toClassId: number,
) {
  const validation = await validateReschedule(db, userId, fromBookingId, toClassId);
  if (!validation.valid) {
    throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason });
  }

  const originalRow = await loadBookingWithClass(db, fromBookingId);
  if (!originalRow) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  }

  const originalBooking = originalRow.booking;
  const originalClass = originalRow.cls;

  const targetClass = await db
    .select()
    .from(classes)
    .where(eq(classes.id, toClassId))
    .get();

  if (!targetClass) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Target class not found.",
    });
  }

  const targetIsFull = validation.targetIsFull;

  const newBooking = await db
    .insert(bookings)
    .values({
      classId: targetClass.id,
      userId,
      membershipId: originalBooking.membershipId,
      status: targetIsFull ? "waitlisted" : "booked",
      creditsUsed: originalBooking.creditsUsed,
    })
    .returning()
    .get();

  await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    })
    .where(eq(bookings.id, originalBooking.id));

  await db.insert(reschedules).values({
    userId,
    fromBookingId: originalBooking.id,
    toBookingId: newBooking.id,
    fromClassId: originalClass.id,
    toClassId: targetClass.id,
  });

  return {
    ok: true as const,
    newBooking,
    newStatus: targetIsFull ? ("waitlisted" as const) : ("booked" as const),
  };
}

export async function getRescheduleHistory(db: Db, userId: number) {
  return db
    .select({
      id: reschedules.id,
      rescheduledAt: reschedules.rescheduledAt,
      fromClassName: classes.name,
      fromClassTime: sql<string>`(
          SELECT ${classes.startsAt} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.fromClassId}
        )`,
      fromClassRoom: sql<string>`(
          SELECT ${classes.room} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.fromClassId}
        )`,
      toClassName: sql<string>`(
          SELECT ${classes.name} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
      toClassTime: sql<string>`(
          SELECT ${classes.startsAt} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
      toClassRoom: sql<string>`(
          SELECT ${classes.room} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
    })
    .from(reschedules)
    .innerJoin(classes, eq(reschedules.fromClassId, classes.id))
    .where(eq(reschedules.userId, userId))
    .orderBy(desc(reschedules.rescheduledAt));
}

export { FREE_RESCHEDULE_HOURS } from "@/server/lib/constants";
