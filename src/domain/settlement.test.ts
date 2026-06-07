import { describe, it, expect } from "vitest";
import {
  computeBillBreakdown,
  computeSessionSettlement,
  simplifyDebts,
  type BillInput,
  type SessionInput,
} from "./settlement";
import { sum } from "./money";

/** Equal-weight shares helper for tests. */
function shares(...ids: string[]) {
  return ids.map((participantId) => ({ participantId, weight: 1 }));
}

describe("computeBillBreakdown", () => {
  it("charges each person for the items they consumed", () => {
    const bill: BillInput = {
      id: "b1",
      payerId: "ana",
      taxAmount: 0,
      serviceAmount: 0,
      discountAmount: 0,
      items: [
        { id: "i1", lineTotal: 30000, shares: shares("ana") },
        { id: "i2", lineTotal: 20000, shares: shares("budi") },
      ],
    };
    const result = computeBillBreakdown(bill);
    const byId = Object.fromEntries(
      result.perParticipant.map((p) => [p.participantId, p.total]),
    );
    expect(byId).toEqual({ ana: 30000, budi: 20000 });
    expect(result.total).toBe(50000);
  });

  it("splits a shared item equally among its participants", () => {
    const bill: BillInput = {
      id: "b1",
      payerId: "ana",
      taxAmount: 0,
      serviceAmount: 0,
      discountAmount: 0,
      items: [{ id: "i1", lineTotal: 30000, shares: shares("ana", "budi", "citra") }],
    };
    const result = computeBillBreakdown(bill);
    const totals = result.perParticipant.map((p) => p.total).sort((a, b) => a - b);
    expect(totals).toEqual([10000, 10000, 10000]);
    expect(result.total).toBe(30000);
  });

  it("prorates tax and service across participants by their subtotal", () => {
    const bill: BillInput = {
      id: "b1",
      payerId: "ana",
      taxAmount: 10000, // 10% tax
      serviceAmount: 5000, // 5% service
      discountAmount: 0,
      items: [
        { id: "i1", lineTotal: 60000, shares: shares("ana") },
        { id: "i2", lineTotal: 40000, shares: shares("budi") },
      ],
    };
    const result = computeBillBreakdown(bill);
    const byId = Object.fromEntries(
      result.perParticipant.map((p) => [p.participantId, p]),
    );
    // ana has 60% of the subtotal -> 60% of tax and service.
    expect(byId.ana.tax).toBe(6000);
    expect(byId.ana.service).toBe(3000);
    expect(byId.ana.total).toBe(69000);
    expect(byId.budi.total).toBe(46000);
    expect(result.total).toBe(115000);
  });

  it("applies discount as a subtraction prorated by subtotal", () => {
    const bill: BillInput = {
      id: "b1",
      payerId: "ana",
      taxAmount: 0,
      serviceAmount: 0,
      discountAmount: 10000,
      items: [
        { id: "i1", lineTotal: 50000, shares: shares("ana") },
        { id: "i2", lineTotal: 50000, shares: shares("budi") },
      ],
    };
    const result = computeBillBreakdown(bill);
    const totals = result.perParticipant.map((p) => p.total);
    expect(totals).toEqual([45000, 45000]);
    expect(result.total).toBe(90000);
  });

  it("tracks unassigned items without breaking the money math", () => {
    const bill: BillInput = {
      id: "b1",
      payerId: "ana",
      taxAmount: 0,
      serviceAmount: 0,
      discountAmount: 0,
      items: [
        { id: "i1", lineTotal: 20000, shares: shares("ana") },
        { id: "i2", lineTotal: 15000, shares: [] },
      ],
    };
    const result = computeBillBreakdown(bill);
    expect(result.unassignedAmount).toBe(15000);
    expect(result.total).toBe(20000);
  });
});

describe("simplifyDebts", () => {
  it("produces a minimal set of transfers and always nets to zero", () => {
    const net = { ana: 20000, budi: -5000, citra: -15000 };
    const transfers = simplifyDebts(net);
    // Two debtors paying one creditor -> at most two transfers.
    expect(transfers).toHaveLength(2);
    for (const t of transfers) {
      expect(t.toParticipantId).toBe("ana");
    }
    const received = sum(transfers.map((t) => t.amount));
    expect(received).toBe(20000);
  });

  it("returns no transfers when everyone is settled", () => {
    expect(simplifyDebts({ ana: 0, budi: 0 })).toEqual([]);
  });
});

describe("computeSessionSettlement", () => {
  it("consolidates multiple bills paid by different people across one hangout", () => {
    // Hangout with two stops. Ana pays the cafe, Budi pays the bar.
    const session: SessionInput = {
      participantIds: ["ana", "budi", "citra"],
      bills: [
        {
          id: "cafe",
          payerId: "ana",
          taxAmount: 0,
          serviceAmount: 0,
          discountAmount: 0,
          items: [
            { id: "c1", lineTotal: 30000, shares: shares("ana", "budi", "citra") },
          ],
        },
        {
          id: "bar",
          payerId: "budi",
          taxAmount: 0,
          serviceAmount: 0,
          discountAmount: 0,
          items: [
            { id: "b1", lineTotal: 60000, shares: shares("budi", "citra") },
          ],
        },
      ],
    };

    const result = computeSessionSettlement(session);

    // Charged: ana 10k; budi 10k+30k=40k; citra 10k+30k=40k.
    expect(result.owed).toEqual({ ana: 10000, budi: 40000, citra: 40000 });
    // Paid: ana 30k (cafe), budi 60k (bar), citra 0.
    expect(result.paid).toEqual({ ana: 30000, budi: 60000, citra: 0 });
    // Net: ana +20k, budi +20k, citra -40k.
    expect(result.net).toEqual({ ana: 20000, budi: 20000, citra: -40000 });
    expect(result.grandTotal).toBe(90000);

    // Net always sums to zero, and citra (the only debtor) settles both.
    expect(sum(Object.values(result.net))).toBe(0);
    expect(result.transfers.every((t) => t.fromParticipantId === "citra")).toBe(true);
    expect(sum(result.transfers.map((t) => t.amount))).toBe(40000);
  });

  it("keeps net balances summing to zero even with messy rounding", () => {
    const session: SessionInput = {
      participantIds: ["ana", "budi", "citra"],
      bills: [
        {
          id: "b1",
          payerId: "ana",
          taxAmount: 3337,
          serviceAmount: 1111,
          discountAmount: 999,
          items: [
            { id: "i1", lineTotal: 10000, shares: shares("ana", "budi", "citra") },
            { id: "i2", lineTotal: 7777, shares: shares("budi", "citra") },
          ],
        },
      ],
    };
    const result = computeSessionSettlement(session);
    expect(sum(Object.values(result.net))).toBe(0);
    // The payer's outlay equals the sum of what everyone owes.
    expect(result.paid.ana).toBe(sum(Object.values(result.owed)));
  });
});
