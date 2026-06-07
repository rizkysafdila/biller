"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { createFriend, updateFriend, deleteFriend } from "@/server/friends";
import { colorForName } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  function handleSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    };
    startTransition(async () => {
      const result = editing
        ? await updateFriend(editing.id, input)
        : await createFriend(input);
      if (result.ok) {
        toast.success(editing ? "Teman diperbarui." : "Teman ditambahkan.");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit teman" : "Tambah teman"}</DialogTitle>
            <DialogDescription>
              Nama dipakai buat nandain siapa makan apa.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name ?? ""}
                placeholder="cth. Budi"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">No. HP (opsional)</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={editing?.phone ?? ""}
                placeholder="08xx"
                inputMode="tel"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Teman ini akan hilang dari daftar. Sesi yang sudah ada tidak
              terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
