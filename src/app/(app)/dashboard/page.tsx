import Link from "next/link";
import { Plus, ArrowRight, ReceiptText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { colorForName } from "@/lib/colors";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();

  const [sessions, friendCount] = await Promise.all([
    db.session.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        _count: { select: { bills: true } },
        participants: { include: { friend: true }, take: 6 },
      },
    }),
    db.friend.count({ where: { userId: user.id, isOwner: false } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="pt-6">
          <p className="text-primary-foreground/80 text-sm">Halo 👋</p>
          <h1 className="mt-1 text-lg font-bold">
            Habis nongkrong? Yuk hitung patungannya.
          </h1>
          <Button
            render={<Link href="/sessions/new" />}
            variant="secondary"
            size="lg"
            className="mt-4 w-full"
          >
            <Plus /> Buat sesi baru
          </Button>
          <p className="text-primary-foreground/80 mt-3 text-center text-xs">
            {friendCount} teman tersimpan
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Sesi terakhir</h2>
        <Button render={<Link href="/sessions" />} variant="ghost" size="sm">
          Semua <ArrowRight />
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada sesi"
          description="Sesi nongkrong yang kamu buat bakal muncul di sini."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="bg-card hover:border-primary/50 flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(s.date)} · {s._count.bills} bill
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
