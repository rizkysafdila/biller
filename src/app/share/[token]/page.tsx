import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import { getSharedSessionView } from "@/queries/sessions";
import { SettlementSummary } from "@/components/settlement-summary";
import { BillCard } from "@/components/bill-card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Hasil Split — Patungan",
  robots: { index: false },
};

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getSharedSessionView(token);
  if (!view) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3 font-bold">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <Receipt className="size-4" />
          </span>
          Patungan
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-12">
        <div className="mb-4">
          <h1 className="text-xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground text-sm">{formatDate(view.date)}</p>
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

        <SettlementSummary
          participants={view.participants}
          settlement={view.settlement}
        />

        <h2 className="mt-5 mb-3 font-semibold">Bill</h2>
        <div className="flex flex-col gap-3">
          {view.bills.map((bill) => (
            <BillCard
              key={bill.id}
              sessionId={view.id}
              bill={bill}
              participants={view.participants}
              readOnly
            />
          ))}
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Dibuat dengan Patungan
        </p>
      </main>
    </div>
  );
}
