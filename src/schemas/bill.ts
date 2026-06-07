import { z } from "zod";

// Item participant ids and paidById refer to SessionParticipant ids.
export const BillItemSchema = z.object({
  name: z.string().trim().min(1, "Nama item wajib diisi").max(80),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().int().min(0).default(0),
  participantIds: z.array(z.string().min(1)).default([]),
});

export const BillSchema = z.object({
  merchantName: z
    .string()
    .trim()
    .min(1, "Nama tempat wajib diisi")
    .max(80),
  paidById: z.string().min(1).nullable().default(null),
  taxAmount: z.coerce.number().int().min(0).default(0),
  serviceAmount: z.coerce.number().int().min(0).default(0),
  discountAmount: z.coerce.number().int().min(0).default(0),
  receiptImageUrl: z.string().url().optional().or(z.literal("")),
  items: z.array(BillItemSchema).min(1, "Tambahkan minimal satu item"),
});

export type BillItemData = z.infer<typeof BillItemSchema>;
export type BillData = z.infer<typeof BillSchema>;

// Shape returned by the Gemini OCR endpoint (before the user reviews/edits it).
export const ParsedReceiptSchema = z.object({
  merchantName: z.string().default(""),
  items: z
    .array(
      z.object({
        name: z.string().default(""),
        quantity: z.coerce.number().int().min(1).default(1),
        unitPrice: z.coerce.number().int().min(0).default(0),
      }),
    )
    .default([]),
  taxAmount: z.coerce.number().int().min(0).default(0),
  serviceAmount: z.coerce.number().int().min(0).default(0),
  discountAmount: z.coerce.number().int().min(0).default(0),
});

export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
