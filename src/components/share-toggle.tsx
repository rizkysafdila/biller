"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";
import { setShareEnabled } from "@/server/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Bagikan" />
        }
      >
        <Share2 />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bagikan hasil split</DialogTitle>
          <DialogDescription>
            Buat link read-only yang bisa dikirim ke grup. Mereka gak perlu
            login.
          </DialogDescription>
        </DialogHeader>

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
          <Button onClick={() => toggle(true)} disabled={pending}>
            <Share2 /> {pending ? "Membuat..." : "Buat link share"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
