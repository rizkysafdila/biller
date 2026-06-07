import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Pure JWT encode/decode for the session cookie. No next/headers import, so it
// is safe to use from the proxy (which forbids next/headers) as well as from
// server components and actions.

export const SESSION_COOKIE = "patungan_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encodedKey = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
);

export interface SessionPayload extends JWTPayload {
  userId: string;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

export async function decrypt(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
