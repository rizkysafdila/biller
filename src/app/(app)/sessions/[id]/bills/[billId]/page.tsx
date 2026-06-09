import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getSessionWithParticipants } from "@/queries/sessions";
import { getBillForEdit } from "@/queries/bills";
import { colorForName } from "@/lib/colors";
import { BillForm } from "@/components/bill-form";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string; billId: string }>;
}) {
  const { id, billId } = await params;
  const user = await requireUser();

  const session = await getSessionWithParticipants(id, user.id);
  if (!session) notFound();

  const bill = await getBillForEdit(billId, id);
  if (!bill) notFound();

  return (
    <BillForm
      sessionId={session.id}
      billId={bill.id}
      participants={session.participants.map((p) => ({
        id: p.id,
        name: p.friend.name,
        avatarColor: p.friend.avatarColor ?? colorForName(p.friend.name),
      }))}
      initial={{
        merchantName: bill.merchantName,
        paidById: bill.paidById,
        taxAmount: bill.taxAmount,
        serviceAmount: bill.serviceAmount,
        discountAmount: bill.discountAmount,
        receiptImageUrl: bill.receiptImageUrl,
        items: bill.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          participantIds: it.shares.map((s) => s.participantId),
        })),
      }}
    />
  );
}
