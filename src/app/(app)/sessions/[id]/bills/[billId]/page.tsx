import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { colorForName } from "@/lib/colors";
import { BillForm } from "@/components/bill-form";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string; billId: string }>;
}) {
  const { id, billId } = await params;
  const user = await requireUser();

  const session = await db.session.findFirst({
    where: { id, userId: user.id },
    include: {
      participants: { include: { friend: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) notFound();

  const bill = await db.bill.findFirst({
    where: { id: billId, sessionId: id },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { shares: true },
      },
    },
  });
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
