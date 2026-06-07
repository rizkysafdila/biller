import Link from "next/link";
import { Store, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { BillActions } from "@/components/bill-actions";
import { formatIDR } from "@/domain/money";
import { sum } from "@/domain/money";
import type { BillView, ParticipantView } from "@/lib/session-view";

export function BillCard({
  sessionId,
  bill,
  participants,
  readOnly = false,
}: {
  sessionId: string;
  bill: BillView;
  participants: ParticipantView[];
  readOnly?: boolean;
}) {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const payer = bill.paidById ? byId.get(bill.paidById) : null;
  const itemsTotal = sum(bill.items.map((i) => i.lineTotal));
  const total =
    itemsTotal + bill.taxAmount + bill.serviceAmount - bill.discountAmount;
  const hasUnassigned = bill.items.some((i) => i.participantIds.length === 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Store className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{bill.merchantName}</p>
              <p className="text-muted-foreground text-sm">
                {formatIDR(total)}
                {payer && <> · dibayar {payer.name}</>}
              </p>
            </div>
          </div>
          {!readOnly && <BillActions sessionId={sessionId} billId={bill.id} />}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {hasUnassigned && (
          <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
            <AlertTriangle className="size-3.5" /> Ada item yang belum
            ditugaskan ke siapa pun.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {bill.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">
                      {item.quantity}×{" "}
                    </span>
                  )}
                  {item.name}
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {item.participantIds.map((pid) => {
                  const p = byId.get(pid);
                  if (!p) return null;
                  return (
                    <ParticipantAvatar
                      key={pid}
                      name={p.name}
                      color={p.avatarColor}
                      className="ring-card size-5 ring-2"
                    />
                  );
                })}
              </div>
              <span className="w-20 text-right tabular-nums">
                {formatIDR(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        {(bill.taxAmount > 0 ||
          bill.serviceAmount > 0 ||
          bill.discountAmount > 0) && (
          <div className="text-muted-foreground border-t pt-2 text-xs">
            {bill.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span>Service</span>
                <span>{formatIDR(bill.serviceAmount)}</span>
              </div>
            )}
            {bill.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatIDR(bill.taxAmount)}</span>
              </div>
            )}
            {bill.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>−{formatIDR(bill.discountAmount)}</span>
              </div>
            )}
          </div>
        )}

        {!readOnly && (
          <Link
            href={`/sessions/${sessionId}/bills/${bill.id}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Edit bill →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
