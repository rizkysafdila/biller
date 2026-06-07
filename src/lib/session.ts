import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  MAX_AGE_SECONDS,
  encrypt,
  decrypt,
  type SessionPayload,
} from "./session-token";

// Cookie-bound session helpers (server components / actions only).

export { SESSION_COOKIE, decrypt };
export type { SessionPayload };

export async function createSession(userId: string): Promise<void> {
  const token = await encrypt({ userId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}
