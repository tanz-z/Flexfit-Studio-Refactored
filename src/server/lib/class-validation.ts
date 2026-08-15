import { TRPCError } from "@trpc/server";
import type { GymClass } from "@/db/schema";
import { hoursUntil } from "@/server/lib/time";

export function assertClassBookable(cls: GymClass | undefined): asserts cls is GymClass {
  if (!cls) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  }
  if (cls.cancelled) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This class has been cancelled.",
    });
  }
  if (hoursUntil(cls.startsAt) <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This class has already started.",
    });
  }
}
