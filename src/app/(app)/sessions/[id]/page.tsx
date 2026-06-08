import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Store } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getSessionView } from "@/lib/session-view";
import { SettlementSummary } from "@/components/settlement-summary";
import { BillCard } from "@/components/bill-card";
import { ShareToggle } from "@/components/share-toggle";
import { SessionMenu } from "@/components/session-menu";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const view = await getSessionView(id, user.id);
  if (!view) notFound();

  const hasBills = view.bills.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/sessions"
          className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" /> Semua sesi
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{view.title}</h1>
            <p className="text-muted-foreground text-sm">
              {formatDate(view.date)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ShareToggle sessionId={view.id} initialToken={view.shareToken} />
            <SessionMenu sessionId={view.id} />
          </div>
        </div>
        {view.note && (
          <p className="text-muted-foreground mt-2 text-sm">{view.note}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {view.participants.map((p) => (
            <div
              key={p.id}
              className="bg-muted flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs"
            >
              <ParticipantAvatar
                name={p.name}
                color={p.avatarColor}
                className="size-5"
              />
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {hasBills && (
        <SettlementSummary
          participants={view.participants}
          settlement={view.settlement}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Bill</h2>
        <Button render={<Link href={`/sessions/${view.id}/bills/new`} />} nativeButton={false} size="sm">
          <Plus /> Tambah bill
        </Button>
      </div>

      {!hasBills ? (
        <EmptyState
          icon={Store}
          title="Belum ada bill"
          description="Tambahkan bill dari tiap tempat yang kalian datangi. Bisa scan struk biar cepat."
          action={
            <Button render={<Link href={`/sessions/${view.id}/bills/new`} />} nativeButton={false} size="sm">
              <Plus /> Tambah bill
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {view.bills.map((bill) => (
            <BillCard
              key={bill.id}
              sessionId={view.id}
              bill={bill}
              participants={view.participants}
            />
          ))}
        </div>
      )}
    </div>
  );
}
