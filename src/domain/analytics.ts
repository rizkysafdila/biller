/**
 * Spend analytics — pure aggregation, no I/O.
 *
 * Turns a flat list of per-person, per-session consumption records into a
 * month-by-month ranking of who spent the most. "Spend" = the amount charged to
 * a person (their item shares + prorated tax/service − discount), i.e.
 * `SessionSettlement.owed`, NOT what they fronted.
 */

export interface SpendRecord {
  /** "YYYY-MM" derived from the session date (local time). */
  monthKey: string;
  friendId: string;
  name: string;
  color: string;
  /** Integer rupiah charged to this person for one session. */
  amount: number;
}

export interface PersonSpend {
  friendId: string;
  name: string;
  color: string;
  amount: number;
  /** Proportion of the month total, 0..1 (0 when the month total is 0). */
  share: number;
}

export interface MonthlySpending {
  monthKey: string;
  total: number;
  /** Sorted by amount desc; only people with amount > 0. */
  perPerson: PersonSpend[];
}

export function aggregateMonthlySpending(records: SpendRecord[]): MonthlySpending[] {
  // monthKey -> friendId -> accumulator
  const byMonth = new Map<
    string,
    Map<string, { name: string; color: string; amount: number }>
  >();

  for (const r of records) {
    let friends = byMonth.get(r.monthKey);
    if (!friends) {
      friends = new Map();
      byMonth.set(r.monthKey, friends);
    }
    const prev = friends.get(r.friendId);
    friends.set(r.friendId, {
      // Latest record wins for display fields.
      name: r.name,
      color: r.color,
      amount: (prev?.amount ?? 0) + r.amount,
    });
  }

  const months: MonthlySpending[] = [];
  for (const [monthKey, friends] of byMonth) {
    const people = [...friends.entries()].map(([friendId, v]) => ({
      friendId,
      ...v,
    }));
    const total = people.reduce((acc, p) => acc + p.amount, 0);
    const perPerson: PersonSpend[] = people
      .filter((p) => p.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((p) => ({
        friendId: p.friendId,
        name: p.name,
        color: p.color,
        amount: p.amount,
        share: total > 0 ? p.amount / total : 0,
      }));
    months.push({ monthKey, total, perPerson });
  }

  // Newest month first.
  months.sort((a, b) => (a.monthKey < b.monthKey ? 1 : a.monthKey > b.monthKey ? -1 : 0));
  return months;
}
