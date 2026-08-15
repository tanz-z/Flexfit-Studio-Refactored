import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import * as paymentsService from "@/server/services/payments";

export const paymentsRouter = router({
  mine: protectedProcedure.query(({ ctx }) =>
    paymentsService.getMemberPayments(ctx.db, ctx.user.id),
  ),

  all: adminProcedure
    .input(z.object({ limit: z.number().default(100) }).default({}))
    .query(({ ctx, input }) =>
      paymentsService.listAllPayments(ctx.db, input.limit),
    ),

  markPaid: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      paymentsService.markPaymentPaid(ctx.db, input.id),
    ),

  refund: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      paymentsService.refundPayment(ctx.db, input.id),
    ),
});
