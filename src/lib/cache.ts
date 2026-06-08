import { updateTag } from "next/cache";

/**
 * Per-user Data Cache tag. Every cached read for a user carries this tag, and
 * every mutation that user makes busts it — keeping things simple and always
 * correct (over-invalidation is harmless at this scale, and multi-user safe
 * since the tag is namespaced by userId).
 */
export const userDataTag = (userId: string) => `user-data:${userId}`;

/**
 * Invalidate all cached reads belonging to a user after a mutation.
 *
 * Uses `updateTag` (not `revalidateTag`) for read-your-own-writes: the next
 * request waits for fresh data instead of serving stale content, so a user sees
 * their own change immediately. Must be called from within a Server Action.
 */
export function revalidateUser(userId: string) {
  updateTag(userDataTag(userId));
}
