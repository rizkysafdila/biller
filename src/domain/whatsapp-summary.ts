import { formatIDR } from "./money";
import { formatDate } from "../lib/format";
import type { SessionView } from "../queries/sessions";

/**
 * Format a session's split result as a WhatsApp-ready message (uses `*bold*`
 * markdown). Returns only the body — the caller appends the app link, since
 * that depends on the share token and the page origin.
 */
export function buildWhatsappSummary(view: SessionView): string {
  const { title, date, participants, bills, settlement } = view;
  const nameById = new Map(participants.map((p) => [p.id, p.name]));
  const totalByBillId = new Map(settlement.bills.map((b) => [b.billId, b.total]));

  const blocks: string[] = [];

  // Header: title + date.
  blocks.push(`*${title}*\n${formatDate(date)}`);

  // Per-bill totals.
  if (bills.length > 0) {
    blocks.push(
      bills
        .map(
          (b) => `📋 ${b.merchantName} — ${formatIDR(totalByBillId.get(b.id) ?? 0)}`,
        )
        .join("\n"),
    );
  }

  // Per-person breakdown — every participant, even those charged nothing.
  if (participants.length > 0) {
    const lines = participants.map(
      (p) => `• ${p.name}: ${formatIDR(settlement.owed[p.id] ?? 0)}`,
    );
    blocks.push(["*Rincian per orang:*", ...lines].join("\n"));
  }

  // Who pays whom.
  const transferLines =
    settlement.transfers.length === 0
      ? ["Semua sudah pas, gak ada yang perlu transfer."]
      : settlement.transfers.map((t) => {
          const from = nameById.get(t.fromParticipantId) ?? "?";
          const to = nameById.get(t.toParticipantId) ?? "?";
          return `• ${from} → ${to}: ${formatIDR(t.amount)}`;
        });
  blocks.push(["*Siapa bayar ke siapa:*", ...transferLines].join("\n"));

  // Grand total.
  blocks.push(`Total: ${formatIDR(settlement.grandTotal)}`);

  return blocks.join("\n\n");
}
