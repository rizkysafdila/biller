/**
 * Money helpers.
 *
 * All monetary amounts in Patungan are stored and computed as **integer rupiah**
 * (the smallest practical unit for IDR). Working with integers avoids the
 * floating-point rounding errors that plague naive bill-splitting code.
 */

/** Sum a list of integer amounts. */
export function sum(amounts: number[]): number {
  return amounts.reduce((acc, n) => acc + n, 0);
}

/**
 * Split an integer `total` across buckets in proportion to `weights`, returning
 * an integer array that sums **exactly** to `total`.
 *
 * Uses the largest-remainder method: every bucket gets the floor of its exact
 * share, then the leftover rupiah are handed out one-by-one to the buckets with
 * the largest fractional parts. This guarantees `sum(result) === total` with no
 * "lost rupiah", and distributes any rounding as fairly as possible.
 *
 * - If `weights` is empty, returns `[]`.
 * - If every weight is zero (or negative sum), the total is split equally.
 *
 * `total` is assumed to be a non-negative integer.
 */
export function distributeProportionally(
  total: number,
  weights: number[],
): number[] {
  const n = weights.length;
  if (n === 0) return [];

  const weightSum = sum(weights);
  const effectiveWeights = weightSum > 0 ? weights : new Array(n).fill(1);
  const effectiveSum = weightSum > 0 ? weightSum : n;

  const exactShares = effectiveWeights.map((w) => (total * w) / effectiveSum);
  const floors = exactShares.map(Math.floor);
  const distributed = sum(floors);
  const remainder = total - distributed;

  const result = [...floors];

  // Hand out leftover rupiah to the largest fractional parts first. Ties are
  // broken by index order so the result is deterministic.
  const byFraction = exactShares
    .map((share, index) => ({ index, frac: share - Math.floor(share) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  for (let k = 0; k < remainder && k < n; k++) {
    result[byFraction[k].index] += 1;
  }

  return result;
}

/** Format an integer rupiah amount as e.g. `Rp25.000`. */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
