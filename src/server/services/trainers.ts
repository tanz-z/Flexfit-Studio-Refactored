import { TRPCError } from "@trpc/server";
import { and, eq, gte } from "drizzle-orm";
import { classes, trainerAvailability } from "@/db/schema";
import type { Db } from "@/server/lib/db";

function assertTrainer(role: string) {
  if (role !== "trainer") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only trainers can access this.",
    });
  }
}

export async function getUpcomingTrainerClasses(
  db: Db,
  trainerId: number,
  userRole: string,
) {
  assertTrainer(userRole);
  const now = new Date().toISOString();

  return db
    .select({
      id: classes.id,
      name: classes.name,
      room: classes.room,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      cancelled: classes.cancelled,
    })
    .from(classes)
    .where(
      and(
        eq(classes.trainerId, trainerId),
        gte(classes.startsAt, now),
        eq(classes.cancelled, false),
      ),
    )
    .orderBy(classes.startsAt);
}

export async function getTrainerAvailability(
  db: Db,
  trainerId: number,
  userRole: string,
) {
  assertTrainer(userRole);
  return db
    .select()
    .from(trainerAvailability)
    .where(eq(trainerAvailability.trainerId, trainerId))
    .orderBy(trainerAvailability.dayOfWeek);
}

export async function setTrainerAvailability(
  db: Db,
  trainerId: number,
  userRole: string,
  input: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  },
) {
  assertTrainer(userRole);

  const existing = await db
    .select()
    .from(trainerAvailability)
    .where(
      and(
        eq(trainerAvailability.trainerId, trainerId),
        eq(trainerAvailability.dayOfWeek, input.dayOfWeek),
      ),
    )
    .get();

  if (existing) {
    return db
      .update(trainerAvailability)
      .set({
        startTime: input.startTime,
        endTime: input.endTime,
      })
      .where(eq(trainerAvailability.id, existing.id))
      .returning()
      .get();
  } else {
    return db
      .insert(trainerAvailability)
      .values({
        trainerId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      })
      .returning()
      .get();
  }
}

export async function removeTrainerAvailability(
  db: Db,
  trainerId: number,
  userRole: string,
  dayOfWeek: number,
) {
  assertTrainer(userRole);

  const existing = await db
    .select()
    .from(trainerAvailability)
    .where(
      and(
        eq(trainerAvailability.trainerId, trainerId),
        eq(trainerAvailability.dayOfWeek, dayOfWeek),
      ),
    )
    .get();

  if (existing) {
    await db
      .delete(trainerAvailability)
      .where(eq(trainerAvailability.id, existing.id));
  }

  return { success: true };
}

export async function checkTrainerAvailability(
  db: Db,
  trainerId: number,
  userRole: string,
  startsAt: string,
  durationMin: number,
) {
  if (userRole !== "trainer" && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Staff only.",
    });
  }

  const classStart = new Date(startsAt);
  const classEnd = new Date(classStart.getTime() + durationMin * 60000);

  const dayOfWeek = classStart.getUTCDay();
  const startTimeStr = String(classStart.getUTCHours()).padStart(2, "0") +
    ":" +
    String(classStart.getUTCMinutes()).padStart(2, "0");
  const endTimeStr = String(classEnd.getUTCHours()).padStart(2, "0") +
    ":" +
    String(classEnd.getUTCMinutes()).padStart(2, "0");

  const availability = await db
    .select()
    .from(trainerAvailability)
    .where(
      and(
        eq(trainerAvailability.trainerId, trainerId),
        eq(trainerAvailability.dayOfWeek, dayOfWeek),
      ),
    )
    .get();

  if (!availability) {
    return { available: false, reason: "No availability set for this day" };
  }

  const availStart = availability.startTime;
  const availEnd = availability.endTime;

  const isWithinAvailability =
    startTimeStr >= availStart && endTimeStr <= availEnd;

  if (!isWithinAvailability) {
    return { available: false, reason: "Outside availability hours" };
  }

  const conflictingClasses = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.trainerId, trainerId),
        eq(classes.cancelled, false),
      ),
    );

  for (const cls of conflictingClasses) {
    const existStart = new Date(cls.startsAt);
    const existEnd = new Date(
      existStart.getTime() + cls.durationMin * 60000,
    );

    if (classStart < existEnd && classEnd > existStart) {
      return { available: false, reason: "Trainer already has a class at this time" };
    }
  }

  return { available: true };
}
