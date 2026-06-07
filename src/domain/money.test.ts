import { describe, it, expect } from "vitest";
import { distributeProportionally, sum, formatIDR } from "./money";

describe("distributeProportionally", () => {
  it("splits evenly when weights are equal", () => {
    expect(distributeProportionally(9000, [1, 1, 1])).toEqual([3000, 3000, 3000]);
  });

  it("never loses a rupiah and assigns remainders to largest fractions", () => {
    const result = distributeProportionally(10000, [1, 1, 1]);
    expect(sum(result)).toBe(10000);
    // 3333.33 each -> first two buckets get the extra rupiah by tie-break order.
    expect(result).toEqual([3334, 3333, 3333]);
  });

  it("respects unequal weights", () => {
    const result = distributeProportionally(10000, [3, 1]);
    expect(sum(result)).toBe(10000);
    expect(result).toEqual([7500, 2500]);
  });

  it("falls back to an equal split when all weights are zero", () => {
    expect(distributeProportionally(3000, [0, 0])).toEqual([1500, 1500]);
  });

  it("handles a zero total", () => {
    expect(distributeProportionally(0, [1, 2, 3])).toEqual([0, 0, 0]);
  });

  it("returns an empty array for no buckets", () => {
    expect(distributeProportionally(1000, [])).toEqual([]);
  });
});

describe("formatIDR", () => {
  it("formats integer rupiah with thousands separators and no decimals", () => {
    // id-ID uses dot thousands separators; the Rp prefix may be followed by a
    // regular or non-breaking space depending on the ICU version.
    const normalized = formatIDR(25000).replace(/ /g, " ");
    expect(normalized).toMatch(/^Rp\s?25\.000$/);
  });
});
