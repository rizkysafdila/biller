import { requireUser } from "@/lib/dal";
import { getFriends } from "@/queries/friends";
import { FriendsManager } from "./friends-manager";

export default async function FriendsPage() {
  const user = await requireUser();
  const friends = await getFriends(user.id);

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
