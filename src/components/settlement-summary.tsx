import { ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { formatIDR } from "@/domain/money";
import type { ParticipantView } from "@/queries/sessions";
import type { SessionSettlement } from "@/domain/settlement";

/**
 * The consolidated result of a hangout: total charged per person plus the
 * minimal "who transfers to whom" list, summed across every bill in the session.
 */
export function SettlementSummary({
  participants,
  settlement,
}: {
  participants: ParticipantView[];
  settlement: SessionSettlement;
}) {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const { transfers, owed, paid, grandTotal } = settlement;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Wallet className="text-primary size-4" /> Siapa bayar ke siapa
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              Total {formatIDR(grandTotal)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {transfers.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Semua sudah pas, gak ada yang perlu transfer.
            </p>
          ) : (
            transfers.map((t, i) => {
              const from = byId.get(t.fromParticipantId);
              const to = byId.get(t.toParticipantId);
              if (!from || !to) return null;
              return (
                <div
                  key={i}
                  className="bg-muted/50 flex items-center gap-2 rounded-lg p-2.5"
                >
                  <ParticipantAvatar
                    name={from.name}
                    color={from.avatarColor}
                    className="size-7"
                  />
                  <span className="text-sm font-medium">{from.name}</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                  <ParticipantAvatar
                    name={to.name}
                    color={to.avatarColor}
                    className="size-7"
                  />
                  <span className="text-sm font-medium">{to.name}</span>
                  <span className="ml-auto text-sm font-semibold">
                    {formatIDR(t.amount)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian per orang</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {participants.map((p) => {
            const charged = owed[p.id] ?? 0;
            const paidOut = paid[p.id] ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <ParticipantAvatar name={p.name} color={p.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {paidOut > 0 && (
                    <p className="text-muted-foreground text-xs">
                      Nalangin {formatIDR(paidOut)}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold">
                  {formatIDR(charged)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
