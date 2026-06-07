import { PrismaClient } from "@prisma/client";

// Optional convenience seed: creates the owner user + their "owner" Friend so
// you can start adding hangouts immediately. The login flow also does this
// automatically on first sign-in.

const db = new PrismaClient();

const AVATAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

async function main() {
  const email = process.env.OWNER_EMAIL ?? "you@example.com";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Aku" },
  });

  const ownerFriend = await db.friend.findFirst({
    where: { userId: user.id, isOwner: true },
  });
  if (!ownerFriend) {
    await db.friend.create({
      data: {
        userId: user.id,
        name: "Kamu",
        isOwner: true,
        avatarColor: AVATAR_COLORS[3],
      },
    });
  }

  console.log(`Seeded owner: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
