import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import * as rescheduleService from "@/server/services/reschedules";

export { FREE_RESCHEDULE_HOURS } from "@/server/services/reschedules";

export const reschedulesRouter = router({
  reschedule: protectedProcedure
    .input(
      z.object({
        fromBookingId: z.number(),
        toClassId: z.number(),
      }),
    )
    .mutation(({ ctx, input }) =>
      rescheduleService.rescheduleBooking(
        ctx.db,
        ctx.user.id,
        input.fromBookingId,
        input.toClassId,
      ),
    ),

  history: protectedProcedure.query(({ ctx }) =>
    rescheduleService.getRescheduleHistory(ctx.db, ctx.user.id),
  ),

  validateReschedule: protectedProcedure
    .input(
      z.object({
        fromBookingId: z.number(),
        toClassId: z.number(),
      }),
    )
    .query(({ ctx, input }) =>
      rescheduleService.validateReschedule(
        ctx.db,
        ctx.user.id,
        input.fromBookingId,
        input.toClassId,
      ),
    ),
});
