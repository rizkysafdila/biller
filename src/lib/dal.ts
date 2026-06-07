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
  return db.user.findUnique({ where: { id: session.userId } });
});

/** Require an authenticated owner, redirecting to /login otherwise. */
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
