import Link from "next/link";
import { Plus, ReceiptText, Store, Users } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getSessionList } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { colorForName } from "@/lib/colors";
import { formatDate } from "@/lib/format";

export default async function SessionsPage() {
  const user = await requireUser();
  const sessions = await getSessionList(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sesi Nongkrong</h1>
          <p className="text-muted-foreground text-sm">
            Tiap sesi bisa punya banyak bill dari tempat berbeda.
          </p>
        </div>
        <Button render={<Link href="/sessions/new" />} nativeButton={false} size="sm">
          <Plus /> Sesi
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada sesi"
          description="Bikin sesi nongkrong pertamamu, terus tambahin bill dari tiap tempat."
          action={
            <Button render={<Link href="/sessions/new" />} nativeButton={false} size="sm">
              <Plus /> Sesi baru
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="bg-card hover:border-primary/50 block rounded-xl border p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(s.date)}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {s.participants.map((p) => (
                      <ParticipantAvatar
                        key={p.id}
                        name={p.friend.name}
                        color={p.friend.avatarColor ?? colorForName(p.friend.name)}
                        className="ring-card size-7 ring-2"
                      />
                    ))}
                  </div>
                </div>
                <div className="text-muted-foreground mt-3 flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Store className="size-3.5" /> {s._count.bills} bill
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {s._count.participants} orang
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
