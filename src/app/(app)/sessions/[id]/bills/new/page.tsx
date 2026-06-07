import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { colorForName } from "@/lib/colors";
import { BillForm } from "@/components/bill-form";

export default async function NewBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const session = await db.session.findFirst({
    where: { id, userId: user.id },
    include: {
      participants: { include: { friend: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) notFound();

  return (
    <BillForm
      sessionId={session.id}
      participants={session.participants.map((p) => ({
        id: p.id,
        name: p.friend.name,
        avatarColor: p.friend.avatarColor ?? colorForName(p.friend.name),
      }))}
    />
  );
}
