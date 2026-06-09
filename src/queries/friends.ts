import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { userDataTag } from "@/lib/cache";

// Cached read layer (Next.js Data Cache). Each query takes `userId` as an
// argument (read via requireUser() in the page, outside the cache) so the cached
// functions never touch cookies/headers. Results are plain Prisma objects (Int +
// Date + string) — serializable for the Data Cache. Correctness comes from the
// per-user tag; `revalidate` is just a safety net.

export function getFriends(userId: string) {
  return unstable_cache(
    async () =>
      db.friend.findMany({
        where: { userId },
        orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
      }),
    ["friends", userId],
    { tags: [userDataTag(userId)], revalidate: 3600 },
  )();
}
