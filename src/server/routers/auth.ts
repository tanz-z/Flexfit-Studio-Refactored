import { z } from "zod";
import { cookies } from "next/headers";
import {
  router,
  publicProcedure,
  protectedProcedure,
  SESSION_COOKIE,
} from "../trpc";
import * as authService from "@/server/services/auth";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { token, expiresAt, user } = await authService.loginUser(
        ctx.db,
        input.email,
        input.password,
      );

      const store = await cookies();
      store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });

      return user;
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      authService.registerUser(ctx.db, input),
    ),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await authService.logoutUser(ctx.db, ctx.token);
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return { ok: true };
  }),
});
