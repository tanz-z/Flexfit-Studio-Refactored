import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { membershipPlans, memberships, payments } from "@/db/schema";
import { addDays } from "@/server/lib/time";
import type { Db } from "@/server/lib/db";

export async function listPlans(db: Db, includeInactive: boolean) {
  const rows = await db.select().from(membershipPlans);
  return includeInactive ? rows : rows.filter((p) => p.active);
}

export async function subscribeToPlan(
  db: Db,
  userId: number,
  planId: number,
  method: "card" | "cash" | "upi" | "transfer",
) {
  const plan = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.id, planId))
    .get();

  if (!plan) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
  }
  if (!plan.active) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This plan is no longer available.",
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const membership = await db
    .insert(memberships)
    .values({
      userId,
      planId: plan.id,
      startDate: today,
      endDate: addDays(today, plan.durationDays),
      creditsRemaining: plan.classCredits,
      status: "active",
    })
    .returning()
    .get();

  await db.insert(payments).values({
    userId,
    membershipId: membership.id,
    amountCents: plan.priceCents,
    method,
    status: "paid",
    reference: `PAY-${Date.now()}`,
  });

  return membership;
}

export async function createPlan(
  db: Db,
  input: {
    name: string;
    description?: string;
    priceCents: number;
    durationDays: number;
    classCredits: number;
  },
) {
  return db
    .insert(membershipPlans)
    .values({ ...input, description: input.description ?? null })
    .returning()
    .get();
}

export async function setPlanActive(db: Db, id: number, active: boolean) {
  return db
    .update(membershipPlans)
    .set({ active })
    .where(eq(membershipPlans.id, id))
    .returning()
    .get();
}
