import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import * as trainersService from "@/server/services/trainers";

export const trainersRouter = router({
  upcomingClasses: protectedProcedure.query(({ ctx }) =>
    trainersService.getUpcomingTrainerClasses(
      ctx.db,
      ctx.user.id,
      ctx.user.role,
    ),
  ),

  availability: protectedProcedure.query(({ ctx }) =>
    trainersService.getTrainerAvailability(ctx.db, ctx.user.id, ctx.user.role),
  ),

  setAvailability: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      trainersService.setTrainerAvailability(
        ctx.db,
        ctx.user.id,
        ctx.user.role,
        input,
      ),
    ),

  removeAvailability: protectedProcedure
    .input(z.object({ dayOfWeek: z.number().int().min(0).max(6) }))
    .mutation(({ ctx, input }) =>
      trainersService.removeTrainerAvailability(
        ctx.db,
        ctx.user.id,
        ctx.user.role,
        input.dayOfWeek,
      ),
    ),

  checkAvailability: protectedProcedure
    .input(
      z.object({
        trainerId: z.number(),
        startsAt: z.string(),
        durationMin: z.number(),
      }),
    )
    .query(({ ctx, input }) =>
      trainersService.checkTrainerAvailability(
        ctx.db,
        input.trainerId,
        ctx.user.role,
        input.startsAt,
        input.durationMin,
      ),
    ),
});
