import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import * as corporateBookings from "@/server/services/corporate-bookings";

export { CORPORATE_FREE_CANCELLATION_HOURS } from "@/server/services/corporate-bookings";

export const corporateBookingsRouter = router({
  mine: protectedProcedure
    .input(z.object({ includePast: z.boolean().default(false) }).default({}))
    .query(({ ctx, input }) =>
      corporateBookings.listCorporateBookings(
        ctx.db,
        ctx.user.id,
        input.includePast,
      ),
    ),

  book: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .mutation(({ ctx, input }) =>
      corporateBookings.bookCorporateClass(ctx.db, ctx.user.id, input.classId),
    ),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(({ ctx, input }) =>
      corporateBookings.cancelCorporateBooking(
        ctx.db,
        ctx.user,
        input.bookingId,
      ),
    ),

  markAttended: staffProcedure
    .input(
      z.object({
        bookingId: z.number(),
        source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
      }),
    )
    .mutation(({ ctx, input }) =>
      corporateBookings.markCorporateBookingAttended(ctx.db, input.bookingId),
    ),

  rosterFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ ctx, input }) =>
      corporateBookings.getCorporateClassRoster(ctx.db, input.classId),
    ),
});
