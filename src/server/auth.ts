"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { colorForName } from "@/lib/colors";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string } | undefined;

/**
 * Ensure the owner User exists (created on first login from env credentials)
 * together with a Friend record flagged as the owner, so the owner can be a
 * participant in hangouts.
 */
async function ensureOwner(email: string) {
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Aku" },
  });

  const ownerFriend = await db.friend.findFirst({
    where: { userId: user.id, isOwner: true },
  });
  if (!ownerFriend) {
    await db.friend.create({
      data: {
        userId: user.id,
        name: "Kamu",
        isOwner: true,
        avatarColor: colorForName("Kamu"),
      },
    });
  }

  return user;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  const { email, password } = parsed.data;
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    return { error: "OWNER_EMAIL/OWNER_PASSWORD belum diset di server." };
  }
  if (email !== ownerEmail || password !== ownerPassword) {
    return { error: "Email atau password salah." };
  }

  const user = await ensureOwner(email);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
