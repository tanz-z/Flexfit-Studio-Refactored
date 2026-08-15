import { z } from "zod";
import { router, protectedProcedure, staffProcedure, adminProcedure } from "../trpc";
import * as membersService from "@/server/services/members";

export const membersRouter = router({
  profile: protectedProcedure.query(({ ctx }) =>
    membersService.getMemberProfile(ctx.db, ctx.user.id),
  ),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        phone: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      membersService.updateMemberProfile(ctx.db, ctx.user.id, input),
    ),

  search: staffProcedure
    .input(z.object({ q: z.string().default(""), limit: z.number().default(50) }))
    .query(({ ctx, input }) =>
      membersService.searchMembers(ctx.db, input.q, input.limit),
    ),

  byId: staffProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      membersService.getMemberById(ctx.db, input.id),
    ),

  setActive: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(({ ctx, input }) =>
      membersService.setMemberActiveStatus(ctx.db, input.id, input.active),
    ),

  setRole: adminProcedure
    .input(z.object({ id: z.number(), role: z.enum(["member", "trainer", "admin"]) }))
    .mutation(({ ctx, input }) =>
      membersService.setMemberRole(ctx.db, input.id, input.role),
    ),

  lookupByEmailOrPhone: staffProcedure
    .input(z.object({ query: z.string() }))
    .query(({ ctx, input }) =>
      membersService.lookupMemberByEmailOrPhone(ctx.db, input.query),
    ),
});
