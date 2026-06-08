import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { userDataTag } from "./cache";

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

export function getDashboardData(userId: string) {
  return unstable_cache(
    async () => {
      const [sessions, friendCount] = await Promise.all([
        db.session.findMany({
          where: { userId },
          orderBy: { date: "desc" },
          take: 5,
          include: {
            _count: { select: { bills: true } },
            participants: { include: { friend: true }, take: 6 },
          },
        }),
        db.friend.count({ where: { userId, isOwner: false } }),
      ]);
      return { sessions, friendCount };
    },
    ["dashboard", userId],
    { tags: [userDataTag(userId)], revalidate: 3600 },
  )();
}

export function getSessionList(userId: string) {
  return unstable_cache(
    async () =>
      db.session.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        include: {
          _count: { select: { bills: true, participants: true } },
          participants: { include: { friend: true }, take: 6 },
        },
      }),
    ["session-list", userId],
    { tags: [userDataTag(userId)], revalidate: 3600 },
  )();
}
