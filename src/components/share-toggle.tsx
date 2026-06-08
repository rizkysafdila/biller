"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";
import { setShareEnabled } from "@/server/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function ShareToggle({
  sessionId,
  initialToken,
}: {
  sessionId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : "";

  function toggle(enabled: boolean) {
    startTransition(async () => {
      const res = await setShareEnabled(sessionId, enabled);
      if (res.ok) {
        setToken(res.token);
        toast.success(enabled ? "Link aktif." : "Link dimatikan.");
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link disalin.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Bagikan"
        onClick={() => setOpen(true)}
      >
        <Share2 />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Bagikan hasil split</DrawerTitle>
            <DrawerDescription>
              Buat link read-only yang bisa dikirim ke grup. Mereka gak perlu
              login.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {token ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input readOnly value={shareUrl} className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copy}
                    aria-label="Salin"
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => toggle(false)}
                  disabled={pending}
                >
                  Matikan link
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => toggle(true)}
                disabled={pending}
              >
                <Share2 /> {pending ? "Membuat..." : "Buat link share"}
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
