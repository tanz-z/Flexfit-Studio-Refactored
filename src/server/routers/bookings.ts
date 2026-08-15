import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import * as memberBookings from "@/server/services/member-bookings";

export { FREE_CANCELLATION_HOURS, UNLIMITED_CREDITS } from "@/server/services/member-bookings";

export const bookingsRouter = router({
  mine: protectedProcedure
    .input(z.object({ includePast: z.boolean().default(false) }).default({}))
    .query(({ ctx, input }) =>
      memberBookings.listMemberBookings(ctx.db, ctx.user.id, input.includePast),
    ),

  book: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .mutation(({ ctx, input }) =>
      memberBookings.bookClass(ctx.db, ctx.user.id, input.classId),
    ),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(({ ctx, input }) =>
      memberBookings.cancelBooking(ctx.db, ctx.user, input.bookingId),
    ),

  markAttended: staffProcedure
    .input(
      z.object({
        bookingId: z.number(),
        source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
      }),
    )
    .mutation(({ ctx, input }) =>
      memberBookings.markBookingAttended(ctx.db, input.bookingId, input.source),
    ),

  rosterFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ ctx, input }) =>
      memberBookings.getClassRoster(ctx.db, input.classId),
    ),

  upcomingForMember: staffProcedure
    .input(z.object({ userId: z.number(), hoursAhead: z.number().default(2) }))
    .query(({ ctx, input }) =>
      memberBookings.getUpcomingForMember(
        ctx.db,
        input.userId,
        input.hoursAhead,
      ),
    ),

  checkinCountFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ ctx, input }) =>
      memberBookings.getCheckinCountForClass(ctx.db, input.classId),
    ),

  waitlisted: protectedProcedure.query(({ ctx }) =>
    memberBookings.listWaitlistedBookings(ctx.db, ctx.user.id),
  ),
});
