import { and, desc, eq, sql } from "drizzle-orm";
import { memberships } from "@/db/schema";
import type { Db } from "@/server/lib/db";
import { todayIso } from "@/server/lib/time";
import { UNLIMITED_CREDITS } from "@/server/lib/constants";

export function isUnlimitedCredits(creditsRemaining: number): boolean {
  return creditsRemaining >= UNLIMITED_CREDITS;
}

export async function getActiveMembership(db: Db, userId: number) {
  const today = todayIso();
  return db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        sql`${memberships.endDate} >= ${today}`,
      ),
    )
    .orderBy(desc(memberships.endDate))
    .get();
}
