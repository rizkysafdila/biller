import { z } from "zod";

export const FriendSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(40, "Nama terlalu panjang"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("")),
});

export type FriendInput = z.infer<typeof FriendSchema>;
