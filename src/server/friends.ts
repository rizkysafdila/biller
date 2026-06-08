"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { revalidateUser } from "@/lib/cache";
import { FriendSchema } from "@/schemas/friend";
import { colorForName } from "@/lib/colors";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createFriend(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = FriendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, phone } = parsed.data;
  await db.friend.create({
    data: {
      userId: user.id,
      name,
      phone: phone || null,
      avatarColor: colorForName(name),
    },
  });
  revalidatePath("/friends");
  revalidateUser(user.id);
  return { ok: true };
}

export async function updateFriend(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = FriendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const friend = await db.friend.findFirst({ where: { id, userId: user.id } });
  if (!friend) return { ok: false, error: "Teman tidak ditemukan." };

  const { name, phone } = parsed.data;
  await db.friend.update({
    where: { id },
    data: { name, phone: phone || null },
  });
  revalidatePath("/friends");
  revalidateUser(user.id);
  return { ok: true };
}

export async function deleteFriend(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const friend = await db.friend.findFirst({ where: { id, userId: user.id } });
  if (!friend) return { ok: false, error: "Teman tidak ditemukan." };
  if (friend.isOwner) return { ok: false, error: "Tidak bisa menghapus dirimu sendiri." };

  await db.friend.delete({ where: { id } });
  revalidatePath("/friends");
  revalidateUser(user.id);
  return { ok: true };
}
