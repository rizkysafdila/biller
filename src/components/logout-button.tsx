"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/server/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Keluar"
        className="text-muted-foreground"
      >
        <LogOut />
      </Button>
    </form>
  );
}
