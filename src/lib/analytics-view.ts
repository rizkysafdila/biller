import "server-only";
import { getAllSessionViews } from "./session-view";
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

/** Monthly consumption ranking across all of a user's sessions. */
export async function getMonthlySpending(userId: string): Promise<MonthlySpending[]> {
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
}
