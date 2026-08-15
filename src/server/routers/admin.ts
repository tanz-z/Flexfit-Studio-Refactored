import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import * as adminService from "@/server/services/admin";

export const adminRouter = router({
  stats: adminProcedure.query(({ ctx }) =>
    adminService.getAdminStats(ctx.db),
  ),

  classUtilisation: adminProcedure
    .input(z.object({ limit: z.number().default(10) }).default({}))
    .query(({ ctx, input }) =>
      adminService.getClassUtilisation(ctx.db, input.limit),
    ),

  revenueByMonth: adminProcedure.query(({ ctx }) =>
    adminService.getRevenueByMonth(ctx.db),
  ),

  revenueByMethod: adminProcedure.query(({ ctx }) =>
    adminService.getRevenueByMethod(ctx.db),
  ),

  expiringMemberships: adminProcedure.query(({ ctx }) =>
    adminService.getExpiringMemberships(ctx.db),
  ),

  refundCount: adminProcedure.query(({ ctx }) =>
    adminService.getRefundCount(ctx.db),
  ),

  checkinsPerDay: adminProcedure.query(({ ctx }) =>
    adminService.getCheckinsPerDay(ctx.db),
  ),

  topTrainers: adminProcedure.query(({ ctx }) =>
    adminService.getTopTrainers(ctx.db),
  ),

  noShowList: adminProcedure.query(({ ctx }) =>
    adminService.getNoShowList(ctx.db),
  ),
});
