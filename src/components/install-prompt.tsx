"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "patungan-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    // @ts-expect-error iOS Safari only
    const iosStandalone = window.navigator.standalone === true;
    if (standalone || iosStandalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) {
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="bg-card mb-4 flex items-center gap-3 rounded-xl border p-3">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Download className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Install Patungan</p>
        {isIOS ? (
          <p className="text-muted-foreground text-xs">
            Tap <Share className="inline size-3" /> Share lalu “Add to Home
            Screen”.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Pasang ke layar utama biar kayak app beneran.
          </p>
        )}
      </div>
      {!isIOS && (
        <Button size="sm" onClick={install}>
          Install
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        aria-label="Tutup"
        className="text-muted-foreground shrink-0"
      >
        <X />
      </Button>
    </div>
  );
}
