import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { users, sessions } from "@/db/schema";
import { verifyPassword, hashPassword } from "@/lib/password";
import type { Db } from "@/server/lib/db";

const SESSION_DAYS = 30;

export async function loginUser(
  db: Db,
  emailInput: string,
  passwordInput: string,
) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, emailInput.toLowerCase().trim()))
    .get();

  if (!user || !verifyPassword(passwordInput, user.passwordHash)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Email or password is incorrect.",
    });
  }

  if (!user.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This account has been deactivated.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await db.insert(sessions).values({
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return {
    token,
    expiresAt,
    user: { id: user.id, name: user.name, role: user.role },
  };
}

export async function registerUser(
  db: Db,
  input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  },
) {
  const email = input.email.toLowerCase().trim();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with that email already exists.",
    });
  }

  const created = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(input.password),
      name: input.name,
      phone: input.phone ?? null,
      role: "member",
    })
    .returning()
    .get();

  return { id: created.id, name: created.name };
}

export async function logoutUser(db: Db, token?: string) {
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  return { ok: true };
}
