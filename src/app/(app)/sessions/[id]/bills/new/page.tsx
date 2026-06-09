import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getSessionWithParticipants } from "@/queries/sessions";
import { colorForName } from "@/lib/colors";
import { BillForm } from "@/components/bill-form";

export default async function NewBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const session = await getSessionWithParticipants(id, user.id);
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
