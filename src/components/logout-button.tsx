"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/server/auth";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Keluar"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <LogOut />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Keluar dari akun?</DrawerTitle>
            <DrawerDescription>
              Kamu perlu login lagi buat masuk ke Patungan.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <form action={logout}>
              <Button type="submit" variant="destructive" className="w-full">
                <LogOut /> Keluar
              </Button>
            </form>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
