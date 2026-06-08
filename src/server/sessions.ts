"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { revalidateUser } from "@/lib/cache";
import { SessionSchema } from "@/schemas/session";
import type { ActionResult } from "./friends";

/** Verify a session belongs to the current user; returns it or null. */
async function ownedSession(sessionId: string, userId: string) {
  return db.session.findFirst({ where: { id: sessionId, userId } });
}

export async function createSession(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = SessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { title, date, note, participantFriendIds } = parsed.data;

  // Only attach friends that actually belong to this user.
  const friends = await db.friend.findMany({
    where: { id: { in: participantFriendIds }, userId: user.id },
    select: { id: true },
  });

  const session = await db.session.create({
    data: {
      userId: user.id,
      title,
      date: new Date(date),
      note: note || null,
      participants: {
        create: friends.map((f) => ({ friendId: f.id })),
      },
    },
  });

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidateUser(user.id);
  redirect(`/sessions/${session.id}`);
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownedSession(sessionId, user.id))) {
    return { ok: false, error: "Sesi tidak ditemukan." };
  }
  await db.session.delete({ where: { id: sessionId } });
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidateUser(user.id);
  redirect("/sessions");
}

export async function setShareEnabled(
  sessionId: string,
  enabled: boolean,
): Promise<{ ok: true; token: string | null } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!(await ownedSession(sessionId, user.id))) {
    return { ok: false, error: "Sesi tidak ditemukan." };
  }
  const token = enabled ? nanoid(12) : null;
  await db.session.update({
    where: { id: sessionId },
    data: { shareToken: token },
  });
  revalidatePath(`/sessions/${sessionId}`);
  revalidateUser(user.id);
  return { ok: true, token };
}
