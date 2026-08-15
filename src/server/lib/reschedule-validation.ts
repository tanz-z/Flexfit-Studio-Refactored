import type { Booking, GymClass } from "@/db/schema";
import { FREE_RESCHEDULE_HOURS } from "@/server/lib/constants";
import { hoursUntil } from "@/server/lib/time";

export type RescheduleValidationResult =
  | { valid: true; targetIsFull: boolean }
  | { valid: false; reason: string };

export function validateRescheduleRequest(input: {
  originalBooking: Booking;
  originalClass: GymClass;
  targetClass: GymClass | undefined;
  userId: number;
  targetBookedCount: number;
  hasExistingTargetBooking: boolean;
  now?: Date;
}): RescheduleValidationResult {
  const {
    originalBooking,
    originalClass,
    targetClass,
    userId,
    targetBookedCount,
    hasExistingTargetBooking,
    now,
  } = input;

  if (originalBooking.userId !== userId) {
    return { valid: false, reason: "You cannot reschedule this booking." };
  }

  if (
    originalBooking.status !== "booked" &&
    originalBooking.status !== "waitlisted"
  ) {
    return { valid: false, reason: "This booking is no longer active." };
  }

  const hoursBeforeOriginal = hoursUntil(originalClass.startsAt, now);
  if (hoursBeforeOriginal < FREE_RESCHEDULE_HOURS) {
    return {
      valid: false,
      reason: `You can only reschedule up to ${FREE_RESCHEDULE_HOURS} hours before the class starts.`,
    };
  }

  if (!targetClass) {
    return { valid: false, reason: "Target class not found." };
  }

  if (targetClass.name !== originalClass.name) {
    return {
      valid: false,
      reason: "You can only reschedule to a class with the same name.",
    };
  }

  if (targetClass.id === originalClass.id) {
    return { valid: false, reason: "You are already booked for this class." };
  }

  if (hoursUntil(targetClass.startsAt, now) <= 0) {
    return { valid: false, reason: "This class has already started." };
  }

  if (targetClass.cancelled) {
    return { valid: false, reason: "This class has been cancelled." };
  }

  if (hasExistingTargetBooking) {
    return {
      valid: false,
      reason: "You already have an active booking for this class.",
    };
  }

  const targetIsFull = targetBookedCount >= targetClass.capacity;
  return { valid: true, targetIsFull };
}
