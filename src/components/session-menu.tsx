"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreVertical, Trash2 } from "lucide-react";
import { deleteSession } from "@/server/sessions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDrawer } from "@/components/confirm-drawer";

export function SessionMenu({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSession(sessionId);
      // On success the action redirects; only errors return here.
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Menu sesi" />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 /> Hapus sesi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDrawer
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus sesi ini?"
        description="Semua bill dan rincian split di sesi ini akan terhapus permanen."
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}
