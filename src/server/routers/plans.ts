import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import * as plansService from "@/server/services/plans";

export const plansRouter = router({
  list: publicProcedure
    .input(z.object({ includeInactive: z.boolean().default(false) }).default({}))
    .query(({ ctx, input }) =>
      plansService.listPlans(ctx.db, input.includeInactive),
    ),

  subscribe: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        method: z.enum(["card", "cash", "upi", "transfer"]).default("card"),
      }),
    )
    .mutation(({ ctx, input }) =>
      plansService.subscribeToPlan(ctx.db, ctx.user.id, input.planId, input.method),
    ),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        priceCents: z.number().int().nonnegative(),
        durationDays: z.number().int().positive(),
        classCredits: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(({ ctx, input }) =>
      plansService.createPlan(ctx.db, input),
    ),

  setActive: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(({ ctx, input }) =>
      plansService.setPlanActive(ctx.db, input.id, input.active),
    ),
});
