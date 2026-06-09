"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createFriend, type NewFriend } from "@/server/friends";
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

export function AddFriendDrawer({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (friend: NewFriend) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    startTransition(async () => {
      const res = await createFriend({ name, phone: "" });
      if (res.ok) {
        onAdded(res.friend);
        onOpenChange(false);
        toast.success("Teman ditambahkan.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tambah teman</DrawerTitle>
          <DrawerDescription>
            Teman baru langsung kepilih buat sesi ini.
          </DrawerDescription>
        </DrawerHeader>
        <form
          key={open ? "open" : "closed"}
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="friend-name">Nama</Label>
            <Input
              id="friend-name"
              name="name"
              placeholder="cth. Budi"
              required
              autoFocus
            />
          </div>
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
