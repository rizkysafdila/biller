import "server-only";
import { unstable_cache } from "next/cache";
import { getAllSessionViews } from "@/queries/sessions";
import { userDataTag } from "@/lib/cache";
import {
  aggregateMonthlySpending,
  type MonthlySpending,
  type SpendRecord,
} from "@/domain/analytics";

/** "YYYY-MM" from a Date, local time. */
function monthKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Monthly consumption ranking across all of a user's sessions (cached). */
export function getMonthlySpending(userId: string): Promise<MonthlySpending[]> {
  return unstable_cache(
    async () => {
      const sessions = await getAllSessionViews(userId);

      const records: SpendRecord[] = [];
      for (const s of sessions) {
        const monthKey = monthKeyOf(s.date);
        for (const p of s.participants) {
          records.push({
            monthKey,
            friendId: p.friendId,
            name: p.name,
            color: p.avatarColor,
            amount: s.settlement.owed[p.id] ?? 0,
          });
        }
      }

      return aggregateMonthlySpending(records);
    },
    ["monthly-spending", userId],
    { tags: [userDataTag(userId)], revalidate: 3600 },
  )();
}
