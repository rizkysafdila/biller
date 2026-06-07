"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { createSession } from "@/server/sessions";
import { colorForName } from "@/lib/colors";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { cn } from "@/lib/utils";

interface FriendOption {
  id: string;
  name: string;
  avatarColor: string | null;
  isOwner: boolean;
}

export function SessionForm({ friends }: { friends: FriendOption[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(friends.filter((f) => f.isOwner).map((f) => f.id)),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    const input = {
      title: String(formData.get("title") ?? ""),
      date: String(formData.get("date") ?? ""),
      note: String(formData.get("note") ?? ""),
      participantFriendIds: [...selected],
    };
    if (input.participantFriendIds.length === 0) {
      toast.error("Pilih minimal satu orang.");
      return;
    }
    startTransition(async () => {
      const res = await createSession(input);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Sesi baru</h1>
        <p className="text-muted-foreground text-sm">
          Kasih nama & pilih siapa aja yang ikut nongkrong.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          name="title"
          placeholder="cth. Nongkrong Sabtu"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Tanggal</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={toDateInputValue()}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Textarea id="note" name="note" placeholder="cth. ke kafe terus ke bar" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Siapa yang ikut?</Label>
        <Card>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {friends.map((f) => {
              const isSelected = selected.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <ParticipantAvatar
                    name={f.name}
                    color={f.avatarColor ?? colorForName(f.name)}
                    className="size-6"
                  />
                  {f.name}
                  {isSelected && <Check className="text-primary size-3.5" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-xs">
          {selected.size} orang dipilih
        </p>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Membuat..." : "Buat sesi"}
      </Button>
    </form>
  );
}
