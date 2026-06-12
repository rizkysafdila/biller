"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { revalidateUser } from "@/lib/cache";
import { ChangePasswordSchema } from "@/schemas/account";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Change the signed-in user's password after verifying the current one. */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { currentPassword, newPassword } = parsed.data;

  if (user.passwordHash) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { ok: false, error: "Password saat ini salah." };
  } else {
    // Legacy owner created before passwords existed (no stored hash): verify
    // against the env owner credentials, same as the login migration path.
    const ownerPassword = process.env.OWNER_PASSWORD;
    if (!ownerPassword || currentPassword !== ownerPassword) {
      return { ok: false, error: "Password saat ini salah." };
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  revalidateUser(user.id);
  return { ok: true };
}
