import { describe, it, expect } from "vitest";
import { aggregateMonthlySpending, type SpendRecord } from "./analytics";

const rec = (
  monthKey: string,
  friendId: string,
  amount: number,
  name = friendId,
  color = "#000",
): SpendRecord => ({ monthKey, friendId, name, color, amount });

describe("aggregateMonthlySpending", () => {
  it("returns [] for no records", () => {
    expect(aggregateMonthlySpending([])).toEqual([]);
  });

  it("ranks people in a month by amount desc with correct total and share", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 200, "Rizky"),
      rec("2026-06", "b", 300, "Budi"),
    ]);
    expect(month.monthKey).toBe("2026-06");
    expect(month.total).toBe(500);
    expect(month.perPerson.map((p) => p.name)).toEqual(["Budi", "Rizky"]);
    expect(month.perPerson[0].amount).toBe(300);
    expect(month.perPerson[0].share).toBeCloseTo(0.6);
  });

  it("sums the same friend across multiple sessions in one month", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 200),
      rec("2026-06", "a", 150),
    ]);
    expect(month.perPerson).toHaveLength(1);
    expect(month.perPerson[0].amount).toBe(350);
  });

  it("uses the latest name/color seen for a friend", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 100, "Old", "#111"),
      rec("2026-06", "a", 100, "New", "#222"),
    ]);
    expect(month.perPerson[0].name).toBe("New");
    expect(month.perPerson[0].color).toBe("#222");
  });

  it("sorts months newest first", () => {
    const months = aggregateMonthlySpending([
      rec("2026-04", "a", 100),
      rec("2026-06", "a", 100),
      rec("2026-05", "a", 100),
    ]);
    expect(months.map((m) => m.monthKey)).toEqual(["2026-06", "2026-05", "2026-04"]);
  });

  it("excludes people with zero amount", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 0),
      rec("2026-06", "b", 100),
    ]);
    expect(month.perPerson.map((p) => p.friendId)).toEqual(["b"]);
  });
});
