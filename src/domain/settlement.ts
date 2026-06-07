/**
 * Settlement engine — the heart of Patungan.
 *
 * Pure functions, no I/O. Given the bills in a hangout session (each with its
 * items, per-item participant shares, tax/service/discount and who paid), this
 * computes:
 *
 *   - a per-bill, per-person breakdown,
 *   - how much each person is charged across the whole session ("owed"),
 *   - how much each person actually paid out ("paid"),
 *   - each person's net balance, and
 *   - a minimal list of "who transfers to whom" to settle up.
 *
 * Everything is integer rupiah (see ./money). The math is zero-sum by
 * construction: each bill's paid amount equals the sum of what its participants
 * owe for that bill, so net balances always sum to exactly zero.
 */

import { distributeProportionally, sum } from "./money";

/** One participant's stake in a single item (higher weight = larger share). */
export interface ItemShareInput {
  participantId: string;
  /** Relative weight. Equal sharing means every share has the same weight. */
  weight: number;
}

export interface ItemInput {
  id: string;
  /** Total price for this line (unitPrice * qty), integer rupiah. */
  lineTotal: number;
  /** Who consumed this item. Empty = unassigned (excluded from the money math). */
  shares: ItemShareInput[];
}

export interface BillInput {
  id: string;
  /** Participant who paid the bill, or null if not set yet. */
  payerId: string | null;
  taxAmount: number;
  serviceAmount: number;
  /** Discount as a positive amount; subtracted from each person's share. */
  discountAmount: number;
  items: ItemInput[];
}

export interface SessionInput {
  /** All participants in the session (friends + the owner). */
  participantIds: string[];
  bills: BillInput[];
}

export interface ParticipantBillBreakdown {
  participantId: string;
  subtotal: number;
  tax: number;
  service: number;
  discount: number;
  total: number;
}

export interface BillBreakdown {
  billId: string;
  payerId: string | null;
  /** Total actually covered by the payer = sum of assigned participant totals. */
  total: number;
  /** Value of items with no one assigned yet (a data-entry warning, not money). */
  unassignedAmount: number;
  perParticipant: ParticipantBillBreakdown[];
}

export interface Transfer {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
}

export interface SessionSettlement {
  bills: BillBreakdown[];
  /** Total each participant is charged across the session. */
  owed: Record<string, number>;
  /** Total each participant paid out across the session. */
  paid: Record<string, number>;
  /** paid - owed. Positive = should be reimbursed; negative = owes money. */
  net: Record<string, number>;
  /** Minimal set of transfers that settles every balance. */
  transfers: Transfer[];
  /** Sum of all bill totals in the session. */
  grandTotal: number;
}

/**
 * Compute the breakdown for a single bill: how much each participant owes,
 * including their prorated share of tax, service and discount.
 */
export function computeBillBreakdown(bill: BillInput): BillBreakdown {
  const subtotalByParticipant = new Map<string, number>();
  let unassignedAmount = 0;

  for (const item of bill.items) {
    if (item.shares.length === 0) {
      unassignedAmount += item.lineTotal;
      continue;
    }
    const weights = item.shares.map((s) => s.weight);
    const portions = distributeProportionally(item.lineTotal, weights);
    item.shares.forEach((share, i) => {
      subtotalByParticipant.set(
        share.participantId,
        (subtotalByParticipant.get(share.participantId) ?? 0) + portions[i],
      );
    });
  }

  const participantIds = [...subtotalByParticipant.keys()];
  const subtotals = participantIds.map((id) => subtotalByParticipant.get(id)!);

  // Prorate the bill-level charges across participants by their item subtotal.
  const taxShares = distributeProportionally(bill.taxAmount, subtotals);
  const serviceShares = distributeProportionally(bill.serviceAmount, subtotals);
  const discountShares = distributeProportionally(bill.discountAmount, subtotals);

  const perParticipant: ParticipantBillBreakdown[] = participantIds.map(
    (participantId, i) => {
      const subtotal = subtotals[i];
      const tax = taxShares[i];
      const service = serviceShares[i];
      const discount = discountShares[i];
      return {
        participantId,
        subtotal,
        tax,
        service,
        discount,
        total: subtotal + tax + service - discount,
      };
    },
  );

  const total = sum(perParticipant.map((p) => p.total));

  return {
    billId: bill.id,
    payerId: bill.payerId,
    total,
    unassignedAmount,
    perParticipant,
  };
}

/**
 * Reduce a set of net balances to the smallest practical list of transfers.
 *
 * Greedy algorithm: repeatedly settle the largest debtor against the largest
 * creditor. For everyday hangouts (a handful of people) this produces the
 * minimal, most intuitive set of "X bayar ke Y" instructions.
 */
export function simplifyDebts(net: Record<string, number>): Transfer[] {
  const creditors = Object.entries(net)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ id, amount }));
  const debtors = Object.entries(net)
    .filter(([, amount]) => amount < 0)
    .map(([id, amount]) => ({ id, amount: -amount }));

  // Largest first so we clear big balances in as few transfers as possible.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      transfers.push({
        fromParticipantId: debtor.id,
        toParticipantId: creditor.id,
        amount,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return transfers;
}

/**
 * Compute the full settlement for a hangout session across all of its bills.
 */
export function computeSessionSettlement(
  session: SessionInput,
): SessionSettlement {
  const owed: Record<string, number> = {};
  const paid: Record<string, number> = {};
  for (const id of session.participantIds) {
    owed[id] = 0;
    paid[id] = 0;
  }

  const bills = session.bills.map((bill) => {
    const breakdown = computeBillBreakdown(bill);

    for (const p of breakdown.perParticipant) {
      owed[p.participantId] = (owed[p.participantId] ?? 0) + p.total;
    }
    if (breakdown.payerId) {
      paid[breakdown.payerId] = (paid[breakdown.payerId] ?? 0) + breakdown.total;
    }

    return breakdown;
  });

  const net: Record<string, number> = {};
  for (const id of Object.keys(owed)) {
    net[id] = (paid[id] ?? 0) - (owed[id] ?? 0);
  }

  return {
    bills,
    owed,
    paid,
    net,
    transfers: simplifyDebts(net),
    grandTotal: sum(bills.map((b) => b.total)),
  };
}
