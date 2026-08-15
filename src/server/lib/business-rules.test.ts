import { describe, expect, it } from "vitest";
import {
  FREE_CANCELLATION_HOURS,
  FREE_RESCHEDULE_HOURS,
  UNLIMITED_CREDITS,
} from "@/server/lib/constants";
import { hoursUntil, addDays } from "@/server/lib/time";
import { isUnlimitedCredits } from "@/server/lib/memberships";
import { isCancellationRefundable } from "@/server/services/member-bookings";
import { validateRescheduleRequest } from "@/server/lib/reschedule-validation";
import type { Booking, GymClass } from "@/db/schema";

describe("hoursUntil", () => {
  it("returns positive hours for a future class", () => {
    const now = new Date("2026-08-15T10:00:00.000Z");
    const startsAt = "2026-08-15T14:00:00.000Z";
    expect(hoursUntil(startsAt, now)).toBe(4);
  });

  it("returns zero when class starts now", () => {
    const now = new Date("2026-08-15T10:00:00.000Z");
    expect(hoursUntil("2026-08-15T10:00:00.000Z", now)).toBe(0);
  });

  it("returns negative hours for a past class", () => {
    const now = new Date("2026-08-15T14:00:00.000Z");
    expect(hoursUntil("2026-08-15T10:00:00.000Z", now)).toBe(-4);
  });
});

describe("addDays", () => {
  it("adds days to an ISO date string", () => {
    expect(addDays("2026-08-15", 30)).toBe("2026-09-14");
  });
});

describe("isUnlimitedCredits", () => {
  it("treats 999+ credits as unlimited", () => {
    expect(isUnlimitedCredits(UNLIMITED_CREDITS)).toBe(true);
    expect(isUnlimitedCredits(1000)).toBe(true);
  });

  it("treats fewer than 999 credits as limited", () => {
    expect(isUnlimitedCredits(10)).toBe(false);
  });
});

describe("isCancellationRefundable", () => {
  const now = new Date("2026-08-15T10:00:00.000Z");

  it("refunds when cancelled 12+ hours before with credits used", () => {
    const startsAt = "2026-08-15T23:00:00.000Z";
    expect(isCancellationRefundable(startsAt, 1, now)).toBe(true);
  });

  it("does not refund when cancelled less than 12 hours before", () => {
    const startsAt = "2026-08-15T20:00:00.000Z";
    expect(isCancellationRefundable(startsAt, 1, now)).toBe(false);
  });

  it("does not refund waitlisted bookings with zero credits used", () => {
    const startsAt = "2026-08-16T10:00:00.000Z";
    expect(isCancellationRefundable(startsAt, 0, now)).toBe(false);
  });

  it("uses FREE_CANCELLATION_HOURS constant boundary", () => {
    const exactlyAtBoundary = new Date(
      now.getTime() + FREE_CANCELLATION_HOURS * 36e5,
    ).toISOString();
    expect(isCancellationRefundable(exactlyAtBoundary, 1, now)).toBe(true);
  });
});

describe("validateRescheduleRequest", () => {
  const now = new Date("2026-08-15T10:00:00.000Z");

  const baseBooking: Booking = {
    id: 1,
    classId: 10,
    userId: 5,
    membershipId: 1,
    status: "booked",
    creditsUsed: 1,
    bookedAt: "2026-08-10T10:00:00.000Z",
    cancelledAt: null,
  };

  const originalClass: GymClass = {
    id: 10,
    name: "Yoga Flow",
    description: null,
    trainerId: 2,
    room: "Studio A",
    capacity: 10,
    startsAt: "2026-08-16T10:00:00.000Z",
    durationMin: 60,
    creditCost: 1,
    cancelled: false,
    createdAt: "2026-08-01T10:00:00.000Z",
  };

  const targetClass: GymClass = {
    ...originalClass,
    id: 11,
    startsAt: "2026-08-17T10:00:00.000Z",
  };

  it("accepts a valid reschedule to another slot of the same class name", () => {
    const result = validateRescheduleRequest({
      originalBooking: baseBooking,
      originalClass,
      targetClass,
      userId: 5,
      targetBookedCount: 3,
      hasExistingTargetBooking: false,
      now,
    });

    expect(result).toEqual({ valid: true, targetIsFull: false });
  });

  it("rejects reschedule when less than FREE_RESCHEDULE_HOURS remain", () => {
    const soonClass = {
      ...originalClass,
      startsAt: new Date(now.getTime() + (FREE_RESCHEDULE_HOURS - 1) * 36e5).toISOString(),
    };

    const result = validateRescheduleRequest({
      originalBooking: baseBooking,
      originalClass: soonClass,
      targetClass,
      userId: 5,
      targetBookedCount: 0,
      hasExistingTargetBooking: false,
      now,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain(String(FREE_RESCHEDULE_HOURS));
    }
  });

  it("rejects reschedule to a different class name", () => {
    const result = validateRescheduleRequest({
      originalBooking: baseBooking,
      originalClass,
      targetClass: { ...targetClass, name: "HIIT" },
      userId: 5,
      targetBookedCount: 0,
      hasExistingTargetBooking: false,
      now,
    });

    expect(result).toEqual({
      valid: false,
      reason: "You can only reschedule to a class with the same name.",
    });
  });

  it("reports when target class is full", () => {
    const result = validateRescheduleRequest({
      originalBooking: baseBooking,
      originalClass,
      targetClass: { ...targetClass, capacity: 5 },
      userId: 5,
      targetBookedCount: 5,
      hasExistingTargetBooking: false,
      now,
    });

    expect(result).toEqual({ valid: true, targetIsFull: true });
  });
});
