import { db } from "../src/config/db.js";

async function main() {
  const sessions = await db.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true } } },
  });

  console.log("Recent sessions:");
  for (const s of sessions) {
    console.log({
      id: s.id,
      user: s.user.email,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    });
  }

  await db.$disconnect();
}

main();
