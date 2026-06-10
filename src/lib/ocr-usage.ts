import "server-only";
import { db } from "./db";
import type { User } from "@prisma/client";

// Per-user daily OCR (receipt-scan) limit enforcement. Days are bucketed by the
// Asia/Jakarta calendar (UTC+7, no DST) so "today" matches the user's wall clock
// rather than UTC. Kept out of the route to stay thin and testable.

// Fallback when neither the per-user override nor OCR_DAILY_LIMIT is set.
const DEFAULT_OCR_DAILY_LIMIT = 20;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** The current Asia/Jakarta calendar day as a UTC-midnight Date (matches @db.Date). */
export function jakartaToday(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + JAKARTA_OFFSET_MS);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
}

/** Effective daily limit for a user: per-user override, else env default, else constant. */
export function getOcrLimit(user: Pick<User, "ocrDailyLimit">): number {
  if (user.ocrDailyLimit != null) return user.ocrDailyLimit;
  const fromEnv = Number(process.env.OCR_DAILY_LIMIT);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : DEFAULT_OCR_DAILY_LIMIT;
}

/** How many receipt scans the user has already used today. */
export async function getTodayOcrCount(userId: string): Promise<number> {
  const usage = await db.ocrUsage.findUnique({
    where: { userId_day: { userId, day: jakartaToday() } },
    select: { count: true },
  });
  return usage?.count ?? 0;
}

/** Increment today's counter by one, creating the row if needed. */
export async function incrementOcrUsage(userId: string): Promise<void> {
  const day = jakartaToday();
  await db.ocrUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
