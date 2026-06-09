import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(40, "Nama terlalu panjang."),
  email: z.email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

export const LoginSchema = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
