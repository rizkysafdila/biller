"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { colorForName } from "@/lib/colors";
import { LoginSchema, RegisterSchema } from "@/schemas/auth";

export type AuthState = { error?: string } | undefined;

/**
 * The owner participates in hangouts too, modelled as a Friend flagged as owner.
 * Created once per user (at registration, or lazily for legacy accounts).
 */
async function createOwnerFriend(userId: string, name: string) {
  return db.friend.create({
    data: {
      userId,
      name,
      isOwner: true,
      avatarColor: colorForName(name),
    },
  });
}

async function ensureOwnerFriend(userId: string, name: string) {
  const existing = await db.friend.findFirst({
    where: { userId, isOwner: true },
  });
  if (!existing) await createOwnerFriend(userId, name);
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let userId: string;
  try {
    const user = await db.user.create({
      data: { email, name, passwordHash },
    });
    userId = user.id;
  } catch (err) {
    // Unique constraint race on email.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Email sudah terdaftar." };
    }
    throw err;
  }

  await createOwnerFriend(userId, name);
  await createSession(userId);
  redirect("/dashboard");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email atau password salah." };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email atau password salah." };
  }

  if (user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Email atau password salah." };
    }
  } else {
    // Legacy owner (created before passwords existed). Migrate on first login
    // using the env credentials, then persist a real hash.
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerPassword = process.env.OWNER_PASSWORD;
    const matchesEnvOwner =
      !!ownerEmail &&
      !!ownerPassword &&
      email === ownerEmail &&
      password === ownerPassword;
    if (!matchesEnvOwner) {
      return { error: "Email atau password salah." };
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
  }

  await ensureOwnerFriend(user.id, user.name ?? "Kamu");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
