"use client";

import { useEffect, useState } from "react";
import { Users, ReceiptText, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SEEN_KEY = "patungan-welcome-seen";

const STEPS = [
  {
    icon: Users,
    title: "Buat sesi",
    desc: "Tambahin teman yang ikut nongkrong.",
  },
  {
    icon: ReceiptText,
    title: "Scan struk",
    desc: "Foto struk, item & harga keisi otomatis.",
  },
  {
    icon: Calculator,
    title: "Bagi rata",
    desc: "Patungan langsung ngitung siapa bayar ke siapa.",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // localStorage is client-only, so the modal starts closed and we open it
    // here once we know the user hasn't seen it yet (opening during render would
    // mismatch the server-rendered closed state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
  }, []);

  function dismiss() {
    setOpen(false);
    localStorage.setItem(SEEN_KEY, "1");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selamat datang di Patungan 🎉</DialogTitle>
          <DialogDescription>
            Bagi tagihan nongkrong jadi gampang. Tiga langkah aja:
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <li key={step.title} className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <step.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-muted-foreground text-xs">{step.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full">
            Mulai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
