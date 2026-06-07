import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { FriendsManager } from "./friends-manager";

export default async function FriendsPage() {
  const user = await requireUser();
  const friends = await db.friend.findMany({
    where: { userId: user.id },
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });

  return (
    <FriendsManager
      friends={friends.map((f) => ({
        id: f.id,
        name: f.name,
        phone: f.phone,
        avatarColor: f.avatarColor,
        isOwner: f.isOwner,
      }))}
    />
  );
}
