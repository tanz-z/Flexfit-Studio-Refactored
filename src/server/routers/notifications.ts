import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import * as notificationsService from "@/server/services/notifications";

export const notificationsRouter = router({
  unreadCount: protectedProcedure.query(({ ctx }) =>
    notificationsService.getUnreadNotificationCount(ctx.db, ctx.user.id),
  ),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }).default({}))
    .query(({ ctx, input }) =>
      notificationsService.listNotifications(ctx.db, ctx.user.id, input.limit),
    ),

  markAllAsRead: protectedProcedure.mutation(({ ctx }) =>
    notificationsService.markAllNotificationsAsRead(ctx.db, ctx.user.id),
  ),

  broadcast: adminProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      notificationsService.broadcastAnnouncement(
        ctx.db,
        input.title,
        input.message,
      ),
    ),
});
