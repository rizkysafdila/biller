"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createBill, updateBill } from "@/server/bills";
import type { ParsedReceipt } from "@/schemas/bill";
import { formatIDR } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { cn } from "@/lib/utils";

interface ParticipantOption {
  id: string;
  name: string;
  avatarColor: string;
}

interface ItemRow {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  participantIds: string[];
}

export interface BillFormInitial {
  merchantName: string;
  paidById: string | null;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  receiptImageUrl: string | null;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    participantIds: string[];
  }[];
}

let keyCounter = 0;
const nextKey = () => `row-${keyCounter++}`;

function toInt(value: string): number {
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function emptyRow(): ItemRow {
  return { key: nextKey(), name: "", quantity: 1, unitPrice: 0, participantIds: [] };
}

export function BillForm({
  sessionId,
  billId,
  participants,
  initial,
}: {
  sessionId: string;
  billId?: string;
  participants: ParticipantOption[];
  initial?: BillFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [merchantName, setMerchantName] = useState(initial?.merchantName ?? "");
  const [paidById, setPaidById] = useState<string | null>(
    initial?.paidById ?? null,
  );
  const [tax, setTax] = useState(initial?.taxAmount ?? 0);
  const [service, setService] = useState(initial?.serviceAmount ?? 0);
  const [discount, setDiscount] = useState(initial?.discountAmount ?? 0);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(
    initial?.receiptImageUrl ?? null,
  );
  const [items, setItems] = useState<ItemRow[]>(
    initial && initial.items.length > 0
      ? initial.items.map((it) => ({ key: nextKey(), ...it }))
      : [emptyRow()],
  );

  const allIds = participants.map((p) => p.id);

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  }

  function toggleAssignee(key: string, participantId: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const has = it.participantIds.includes(participantId);
        return {
          ...it,
          participantIds: has
            ? it.participantIds.filter((id) => id !== participantId)
            : [...it.participantIds, participantId],
        };
      }),
    );
  }

  function toggleAllAssignees(key: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const all = it.participantIds.length === allIds.length;
        return { ...it, participantIds: all ? [] : [...allIds] };
      }),
    );
  }

  async function handleScan(file: File) {
    setScanning(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal scan struk.");
      }
      const parsed = data.parsed as ParsedReceipt;
      if (parsed.merchantName) setMerchantName(parsed.merchantName);
      setTax(parsed.taxAmount);
      setService(parsed.serviceAmount);
      setDiscount(parsed.discountAmount);
      if (data.imageUrl) setReceiptImageUrl(data.imageUrl);
      if (parsed.items.length > 0) {
        setItems(
          parsed.items.map((it) => ({
            key: nextKey(),
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            participantIds: [],
          })),
        );
      }
      toast.success("Struk terbaca! Cek lagi dan tugaskan tiap item ya.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal scan struk.");
    } finally {
      setScanning(false);
    }
  }

  function handleSubmit() {
    const data = {
      merchantName,
      paidById,
      taxAmount: tax,
      serviceAmount: service,
      discountAmount: discount,
      receiptImageUrl: receiptImageUrl ?? "",
      items: items
        .filter((it) => it.name.trim() !== "")
        .map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          participantIds: it.participantIds,
        })),
    };
    if (!data.merchantName.trim()) {
      toast.error("Isi nama tempat dulu.");
      return;
    }
    if (data.items.length === 0) {
      toast.error("Tambahkan minimal satu item.");
      return;
    }
    startTransition(async () => {
      const res = billId
        ? await updateBill(billId, data)
        : await createBill(sessionId, data);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/sessions/${sessionId}`}
          className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" /> Kembali ke sesi
        </Link>
        <h1 className="text-xl font-bold">
          {billId ? "Edit bill" : "Tambah bill"}
        </h1>
      </div>

      {/* OCR scan */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleScan(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
      >
        {scanning ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Camera />
        )}
        {scanning ? "Membaca struk..." : "Scan struk (OCR)"}
      </Button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="merchant">Nama tempat</Label>
        <Input
          id="merchant"
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value)}
          placeholder="cth. Kopi Kenangan"
        />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        <Label>Item</Label>
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.key, { name: e.target.value })}
                  placeholder="Nama item"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive shrink-0"
                  aria-label="Hapus item"
                  onClick={() =>
                    setItems((prev) =>
                      prev.length === 1
                        ? [emptyRow()]
                        : prev.filter((it) => it.key !== item.key),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="w-20">
                  <Label className="text-muted-foreground text-xs">Qty</Label>
                  <Input
                    inputMode="numeric"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onChange={(e) =>
                      updateItem(item.key, {
                        quantity: Math.max(1, toInt(e.target.value)),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-muted-foreground text-xs">
                    Harga satuan
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.key, { unitPrice: toInt(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col items-end justify-end pb-1">
                  <span className="text-muted-foreground text-xs">Subtotal</span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatIDR(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Assignment */}
              <div className="flex flex-wrap items-center gap-1.5">
                {participants.map((p) => {
                  const selected = item.participantIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAssignee(item.key, p.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border py-0.5 pr-2 pl-0.5 text-xs transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border text-muted-foreground opacity-70",
                      )}
                    >
                      <ParticipantAvatar
                        name={p.name}
                        color={p.avatarColor}
                        className="size-5"
                      />
                      {p.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => toggleAllAssignees(item.key)}
                  className="text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1 text-xs"
                >
                  <Users className="size-3.5" /> Semua
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setItems((prev) => [...prev, emptyRow()])}
        >
          <Plus /> Tambah item
        </Button>
      </div>

      {/* Charges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="service" className="text-xs">
            Service
          </Label>
          <Input
            id="service"
            inputMode="numeric"
            value={service === 0 ? "" : service}
            onChange={(e) => setService(toInt(e.target.value))}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="tax" className="text-xs">
            Pajak
          </Label>
          <Input
            id="tax"
            inputMode="numeric"
            value={tax === 0 ? "" : tax}
            onChange={(e) => setTax(toInt(e.target.value))}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="discount" className="text-xs">
            Diskon
          </Label>
          <Input
            id="discount"
            inputMode="numeric"
            value={discount === 0 ? "" : discount}
            onChange={(e) => setDiscount(toInt(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      {/* Payer */}
      <div className="flex flex-col gap-2">
        <Label>Yang bayar</Label>
        <Select
          value={paidById ?? undefined}
          onValueChange={(v) => setPaidById((v as string) || null)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih siapa yang bayar">
              {(value) =>
                participants.find((p) => p.id === value)?.name ?? ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {participants.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" size="lg" onClick={handleSubmit} disabled={pending}>
        {pending ? "Menyimpan..." : billId ? "Simpan perubahan" : "Simpan bill"}
      </Button>
    </div>
  );
}
