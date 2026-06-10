import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { db } from "./db";

/**
 * Data Access Layer. Centralizes "who is the current user" so every data
 * request and Server Action performs the same auth check. `cache` dedupes the
 * lookup within a single render pass.
 */

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  // Suspended by an admin: treat as logged out so an active cookie is kicked on
  // the next request instead of waiting out the 30-day session.
  if (user?.disabledAt) return null;
  return user;
});

/** Require an authenticated owner, redirecting to /login otherwise. */
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
