import "server-only";
import { db } from "@/lib/db";

/** Load a bill (with items + shares) for editing. Caller verifies session ownership. */
export function getBillForEdit(billId: string, sessionId: string) {
  return db.bill.findFirst({
    where: { id: billId, sessionId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { shares: true },
      },
    },
  });
}
