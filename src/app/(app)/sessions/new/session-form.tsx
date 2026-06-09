"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { createSession } from "@/server/sessions";
import { colorForName } from "@/lib/colors";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { FriendFormDrawer } from "@/components/friend-form-drawer";
import { cn } from "@/lib/utils";

interface FriendOption {
  id: string;
  name: string;
  avatarColor: string | null;
  isOwner: boolean;
}

export function SessionForm({ friends }: { friends: FriendOption[] }) {
  const [pending, startTransition] = useTransition();
  const [friendList, setFriendList] = useState<FriendOption[]>(friends);
  const [addOpen, setAddOpen] = useState(false);
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
        <div className="flex gap-4 overflow-x-auto p-4">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-14 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <span className="border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary flex size-12 items-center justify-center rounded-full border-2 border-dashed transition-colors">
              <Plus className="size-5" />
            </span>
            <span className="text-muted-foreground w-full truncate text-xs">
              Tambah
            </span>
          </button>
          {friendList.map((f) => {
            const isSelected = selected.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                className="flex w-14 shrink-0 flex-col items-center gap-1.5 text-center"
              >
                <div className="relative">
                  <ParticipantAvatar
                    name={f.name}
                    color={f.avatarColor ?? colorForName(f.name)}
                    className={cn(
                      "ring-offset-background size-12 ring-2 ring-offset-2 transition-all",
                      isSelected
                        ? "ring-primary opacity-100"
                        : "ring-transparent opacity-60",
                    )}
                  />
                  {isSelected && (
                    <span className="bg-primary text-primary-foreground ring-background absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full ring-2">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "w-full truncate text-xs transition-colors",
                    isSelected
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {f.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          {selected.size} orang dipilih
        </p>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Membuat..." : "Buat sesi"}
      </Button>

      <FriendFormDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        showPhone={false}
        description="Teman baru langsung kepilih buat sesi ini."
        onCreated={(friend) => {
          setFriendList((prev) => [...prev, friend]);
          setSelected((prev) => new Set(prev).add(friend.id));
        }}
      />
    </form>
  );
}
