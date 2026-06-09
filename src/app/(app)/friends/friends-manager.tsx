"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { deleteFriend } from "@/server/friends";
import { colorForName } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { EmptyState } from "@/components/empty-state";
import { FriendFormDrawer } from "@/components/friend-form-drawer";
import { ConfirmDrawer } from "@/components/confirm-drawer";

interface FriendItem {
  id: string;
  name: string;
  phone: string | null;
  avatarColor: string | null;
  isOwner: boolean;
}

export function FriendsManager({ friends }: { friends: FriendItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState<FriendItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<FriendItem | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(friend: FriendItem) {
    setEditing(friend);
    setDialogOpen(true);
  }

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteFriend(target.id);
      if (result.ok) {
        toast.success("Teman dihapus.");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Teman</h1>
          <p className="text-muted-foreground text-sm">
            Orang-orang yang biasa nongkrong bareng.
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          <UserPlus /> Tambah
        </Button>
      </div>

      {friends.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada teman"
          description="Tambahkan teman dulu biar gampang dipilih tiap bikin sesi nongkrong."
          action={
            <Button onClick={openAdd} size="sm">
              <UserPlus /> Tambah teman
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="bg-card flex items-center gap-3 rounded-xl border p-3"
            >
              <ParticipantAvatar
                name={friend.name}
                color={friend.avatarColor ?? colorForName(friend.name)}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium">
                  {friend.name}
                  {friend.isOwner && (
                    <Badge variant="secondary" className="shrink-0">
                      Kamu
                    </Badge>
                  )}
                </p>
                {friend.phone && (
                  <p className="text-muted-foreground truncate text-sm">
                    {friend.phone}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(friend)}
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                {!friend.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(friend)}
                    aria-label="Hapus"
                    className="text-destructive"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FriendFormDrawer
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        friend={editing}
        onCreated={() => router.refresh()}
        onUpdated={() => router.refresh()}
      />

      <ConfirmDrawer
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Hapus ${deleting?.name ?? ""}?`}
        description="Teman ini akan hilang dari daftar. Sesi yang sudah ada tidak terpengaruh."
        onConfirm={handleDelete}
        pending={pending}
      />
    </div>
  );
}
