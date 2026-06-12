import { describe, it, expect } from "vitest";
import { buildWhatsappSummary } from "./whatsapp-summary";
import { formatIDR } from "./money";
import type { SessionView } from "../queries/sessions";
import type { SessionSettlement } from "./settlement";
import { formatDate } from "../lib/format";

/** Build a SessionView fixture; only the fields the summary reads matter. */
function makeView(overrides: {
  title?: string;
  date?: Date;
  participants?: { id: string; name: string }[];
  bills?: { id: string; merchantName: string }[];
  settlement?: Partial<SessionSettlement>;
}): SessionView {
  const participants = (overrides.participants ?? []).map((p) => ({
    id: p.id,
    friendId: `f-${p.id}`,
    name: p.name,
    avatarColor: "#000",
    isOwner: false,
  }));
  const bills = (overrides.bills ?? []).map((b) => ({
    id: b.id,
    merchantName: b.merchantName,
    paidById: null,
    taxAmount: 0,
    serviceAmount: 0,
    discountAmount: 0,
    receiptImageUrl: null,
    items: [],
  }));
  const settlement: SessionSettlement = {
    bills: [],
    owed: {},
    paid: {},
    net: {},
    transfers: [],
    grandTotal: 0,
    ...overrides.settlement,
  };
  return {
    id: "s1",
    title: overrides.title ?? "Sesi",
    date: overrides.date ?? new Date("2026-06-12"),
    note: null,
    shareToken: null,
    participants,
    bills,
    settlement,
  };
}

describe("buildWhatsappSummary", () => {
  it("puts the title and formatted date at the top", () => {
    const view = makeView({ title: "Makan di Sushi Tei", date: new Date("2026-06-12") });
    const msg = buildWhatsappSummary(view);
    const lines = msg.split("\n");
    expect(lines[0]).toBe("*Makan di Sushi Tei*");
    expect(lines[1]).toBe(formatDate(view.date));
  });

  it("lists each bill with its total", () => {
    const view = makeView({
      bills: [
        { id: "b1", merchantName: "Sushi Tei" },
        { id: "b2", merchantName: "Kopi Kenangan" },
      ],
      settlement: {
        bills: [
          { billId: "b1", payerId: null, total: 180000, unassignedAmount: 0, perParticipant: [] },
          { billId: "b2", payerId: null, total: 70000, unassignedAmount: 0, perParticipant: [] },
        ],
      },
    });
    const msg = buildWhatsappSummary(view);
    expect(msg).toContain(`📋 Sushi Tei — ${formatIDR(180000)}`);
    expect(msg).toContain(`📋 Kopi Kenangan — ${formatIDR(70000)}`);
  });

  it("shows every participant in the per-person breakdown, including zero", () => {
    const view = makeView({
      participants: [
        { id: "andi", name: "Andi" },
        { id: "budi", name: "Budi" },
        { id: "citra", name: "Citra" },
      ],
      settlement: { owed: { andi: 80000, budi: 90000, citra: 0 } },
    });
    const msg = buildWhatsappSummary(view);
    expect(msg).toContain("*Rincian per orang:*");
    expect(msg).toContain(`• Andi: ${formatIDR(80000)}`);
    expect(msg).toContain(`• Budi: ${formatIDR(90000)}`);
    // Zero-owed participant still listed.
    expect(msg).toContain(`• Citra: ${formatIDR(0)}`);
  });

  it("lists who pays whom", () => {
    const view = makeView({
      participants: [
        { id: "andi", name: "Andi" },
        { id: "budi", name: "Budi" },
      ],
      settlement: {
        owed: { andi: 0, budi: 0 },
        transfers: [{ fromParticipantId: "andi", toParticipantId: "budi", amount: 45000 }],
      },
    });
    const msg = buildWhatsappSummary(view);
    expect(msg).toContain("*Siapa bayar ke siapa:*");
    expect(msg).toContain(`• Andi → Budi: ${formatIDR(45000)}`);
  });

  it("says everyone is settled when there are no transfers", () => {
    const view = makeView({
      participants: [{ id: "andi", name: "Andi" }],
      settlement: { owed: { andi: 0 }, transfers: [] },
    });
    const msg = buildWhatsappSummary(view);
    expect(msg).toContain("Semua sudah pas, gak ada yang perlu transfer.");
    expect(msg).not.toContain("→");
  });

  it("ends with the grand total", () => {
    const view = makeView({ settlement: { grandTotal: 250000 } });
    const msg = buildWhatsappSummary(view);
    expect(msg).toContain(`Total: ${formatIDR(250000)}`);
  });

  it("does not include the app link (appended by the caller)", () => {
    const view = makeView({ title: "X" });
    const msg = buildWhatsappSummary(view);
    expect(msg).not.toContain("http");
    expect(msg).not.toContain("Lihat detail");
  });
});
