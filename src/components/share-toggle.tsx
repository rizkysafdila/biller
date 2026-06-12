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

/** WhatsApp glyph — lucide dropped brand icons, so we inline the official mark. */
function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ShareToggle({
  sessionId,
  initialToken,
  summary,
}: {
  sessionId: string;
  initialToken: string | null;
  /** Pre-built WhatsApp message body (the app link is appended here). */
  summary: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [pending, startTransition] = useTransition();
  const [waPending, setWaPending] = useState(false);
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

  // Open WhatsApp with the formatted summary. Auto-enable the share link first
  // if it isn't active yet, so the message can end with a working app link.
  async function shareToWhatsapp() {
    let activeToken = token;
    if (!activeToken) {
      setWaPending(true);
      const res = await setShareEnabled(sessionId, true);
      setWaPending(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      activeToken = res.token;
      setToken(res.token);
    }
    if (!activeToken) return;

    const url = `${window.location.origin}/share/${activeToken}`;
    const text = `${summary}\n\nLihat detail 👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851]"
                  onClick={shareToWhatsapp}
                  disabled={waPending}
                >
                  <WhatsappIcon /> Bagikan ke WhatsApp
                </Button>
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
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851]"
                  onClick={shareToWhatsapp}
                  disabled={waPending}
                >
                  <WhatsappIcon /> {waPending ? "Menyiapkan..." : "Bagikan ke WhatsApp"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggle(true)}
                  disabled={pending}
                >
                  <Share2 /> {pending ? "Membuat..." : "Buat link share saja"}
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
