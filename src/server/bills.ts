"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { BillSchema, type BillData } from "@/schemas/bill";
import type { ActionResult } from "./friends";

/** Load a session owned by the user along with its valid participant ids. */
async function loadOwnedSession(sessionId: string, userId: string) {
  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
    include: { participants: { select: { id: true } } },
  });
  if (!session) return null;
  return {
    session,
    participantIds: new Set(session.participants.map((p) => p.id)),
  };
}

/** Build the nested Item+ItemShare create payload from validated bill data. */
function buildItemsCreate(data: BillData, validParticipants: Set<string>) {
  return data.items.map((item, index) => {
    const ids = item.participantIds.filter((id) => validParticipants.has(id));
    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      position: index,
      shares: {
        create: ids.map((participantId) => ({ participantId, weight: 1 })),
      },
    };
  });
}

export async function createBill(
  sessionId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const owned = await loadOwnedSession(sessionId, user.id);
  if (!owned) return { ok: false, error: "Sesi tidak ditemukan." };

  const parsed = BillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const paidById =
    data.paidById && owned.participantIds.has(data.paidById)
      ? data.paidById
      : null;

  await db.bill.create({
    data: {
      sessionId,
      merchantName: data.merchantName,
      paidById,
      taxAmount: data.taxAmount,
      serviceAmount: data.serviceAmount,
      discountAmount: data.discountAmount,
      receiptImageUrl: data.receiptImageUrl || null,
      items: { create: buildItemsCreate(data, owned.participantIds) },
    },
  });

  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

export async function updateBill(
  billId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { session: { select: { id: true, userId: true } } },
  });
  if (!bill || bill.session.userId !== user.id) {
    return { ok: false, error: "Bill tidak ditemukan." };
  }

  const owned = await loadOwnedSession(bill.session.id, user.id);
  if (!owned) return { ok: false, error: "Sesi tidak ditemukan." };

  const parsed = BillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const paidById =
    data.paidById && owned.participantIds.has(data.paidById)
      ? data.paidById
      : null;

  // Replace items wholesale (cascade removes their shares), then recreate.
  await db.$transaction([
    db.item.deleteMany({ where: { billId } }),
    db.bill.update({
      where: { id: billId },
      data: {
        merchantName: data.merchantName,
        paidById,
        taxAmount: data.taxAmount,
        serviceAmount: data.serviceAmount,
        discountAmount: data.discountAmount,
        receiptImageUrl: data.receiptImageUrl || null,
        items: { create: buildItemsCreate(data, owned.participantIds) },
      },
    }),
  ]);

  revalidatePath(`/sessions/${bill.session.id}`);
  redirect(`/sessions/${bill.session.id}`);
}

export async function deleteBill(billId: string): Promise<ActionResult> {
  const user = await requireUser();
  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { session: { select: { id: true, userId: true } } },
  });
  if (!bill || bill.session.userId !== user.id) {
    return { ok: false, error: "Bill tidak ditemukan." };
  }
  await db.bill.delete({ where: { id: billId } });
  revalidatePath(`/sessions/${bill.session.id}`);
  return { ok: true };
}
