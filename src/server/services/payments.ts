import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { payments, users, memberships, membershipPlans } from "@/db/schema";
import type { Db } from "@/server/lib/db";

export async function getMemberPayments(db: Db, userId: number) {
  return db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      method: payments.method,
      status: payments.status,
      reference: payments.reference,
      createdAt: payments.createdAt,
      planName: membershipPlans.name,
    })
    .from(payments)
    .leftJoin(memberships, eq(payments.membershipId, memberships.id))
    .leftJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function listAllPayments(db: Db, limit: number) {
  return db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      method: payments.method,
      status: payments.status,
      reference: payments.reference,
      createdAt: payments.createdAt,
      memberName: users.name,
      memberEmail: users.email,
    })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function markPaymentPaid(db: Db, id: number) {
  const row = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .get();

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
  }
  if (row.status === "refunded") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Refunded payments cannot be marked paid.",
    });
  }

  return db
    .update(payments)
    .set({ status: "paid" })
    .where(eq(payments.id, id))
    .returning()
    .get();
}

export async function refundPayment(db: Db, id: number) {
  const row = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .get();

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
  }
  if (row.status !== "paid") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only paid payments can be refunded.",
    });
  }

  const updated = await db
    .update(payments)
    .set({ status: "refunded" })
    .where(eq(payments.id, id))
    .returning()
    .get();

  if (row.membershipId) {
    await db
      .update(memberships)
      .set({ status: "cancelled" })
      .where(eq(memberships.id, row.membershipId));
  }

  return updated;
}
