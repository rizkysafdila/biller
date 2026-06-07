import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { SessionForm } from "./session-form";

export default async function NewSessionPage() {
  const user = await requireUser();
  const friends = await db.friend.findMany({
    where: { userId: user.id },
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });

  // Need at least the owner; the owner Friend is created on first login.
  if (friends.length === 0) redirect("/friends");

  return (
    <SessionForm
      friends={friends.map((f) => ({
        id: f.id,
        name: f.name,
        avatarColor: f.avatarColor,
        isOwner: f.isOwner,
      }))}
    />
  );
}
