import "server-only";
import { db } from "./db";
import type { User } from "@prisma/client";

// Per-user weekly OCR (receipt-scan) limit enforcement. Usage is recorded per
// day, bucketed by the Asia/Jakarta calendar (UTC+7, no DST), then summed over
// the current week to compare against the limit. The week starts on Monday
// (Jakarta). Kept out of the route to stay thin and testable.

// Fallback when neither the per-user override nor OCR_WEEKLY_LIMIT is set.
const DEFAULT_OCR_WEEKLY_LIMIT = 20;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

/** Monday (UTC-midnight) of the current Asia/Jakarta week. */
export function jakartaWeekStart(now: Date = new Date()): Date {
  const today = jakartaToday(now);
  // getUTCDay: 0=Sun..6=Sat. Days since Monday = (day + 6) % 7.
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  return new Date(today.getTime() - daysSinceMonday * DAY_MS);
}

/** Effective weekly limit for a user: per-user override, else env default, else constant. */
export function getOcrLimit(user: Pick<User, "ocrWeeklyLimit">): number {
  if (user.ocrWeeklyLimit != null) return user.ocrWeeklyLimit;
  const fromEnv = Number(process.env.OCR_WEEKLY_LIMIT);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : DEFAULT_OCR_WEEKLY_LIMIT;
}

/** How many receipt scans the user has already used this week (Jakarta). */
export async function getWeekOcrCount(userId: string): Promise<number> {
  const agg = await db.ocrUsage.aggregate({
    _sum: { count: true },
    where: { userId, day: { gte: jakartaWeekStart() } },
  });
  return agg._sum.count ?? 0;
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
