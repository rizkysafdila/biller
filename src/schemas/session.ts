import { z } from "zod";

export const SessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(80, "Judul terlalu panjang"),
  date: z.string().min(1, "Tanggal wajib diisi"), // yyyy-mm-dd
  note: z.string().trim().max(500).optional().or(z.literal("")),
  participantFriendIds: z
    .array(z.string().min(1))
    .min(1, "Pilih minimal satu orang"),
});

export type SessionInputData = z.infer<typeof SessionSchema>;
