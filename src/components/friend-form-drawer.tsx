"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createFriend,
  updateFriend,
  type NewFriend,
} from "@/server/friends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface EditableFriend {
  id: string;
  name: string;
  phone: string | null;
}

export function FriendFormDrawer({
  open,
  onOpenChange,
  friend = null,
  showPhone = true,
  description = "Nama dipakai buat nandain siapa makan apa.",
  onCreated,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a friend to edit it; omit/null to add a new one. */
  friend?: EditableFriend | null;
  showPhone?: boolean;
  description?: string;
  onCreated?: (friend: NewFriend) => void;
  onUpdated?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = friend !== null;

  function handleSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      phone: showPhone ? String(formData.get("phone") ?? "") : "",
    };
    startTransition(async () => {
      if (friend) {
        const res = await updateFriend(friend.id, input);
        if (!res.ok) return void toast.error(res.error);
        onUpdated?.();
      } else {
        const res = await createFriend(input);
        if (!res.ok) return void toast.error(res.error);
        onCreated?.(res.friend);
      }
      onOpenChange(false);
      toast.success(isEdit ? "Teman diperbarui." : "Teman ditambahkan.");
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? "Edit teman" : "Tambah teman"}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <form
          key={friend?.id ?? (open ? "open" : "closed")}
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="friend-name">Nama</Label>
            <Input
              id="friend-name"
              name="name"
              defaultValue={friend?.name ?? ""}
              placeholder="cth. Budi"
              required
              autoFocus
            />
          </div>
          {showPhone && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="friend-phone">No. HP (opsional)</Label>
              <Input
                id="friend-phone"
                name="phone"
                defaultValue={friend?.phone ?? ""}
                placeholder="08xx"
                inputMode="tel"
              />
            </div>
          )}
          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
