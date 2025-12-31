import { db } from "../src/config/db.js";

async function main() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("Recent audit logs:");
  for (const log of logs) {
    console.log({
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      metadata: log.metadata,
      userId: log.userId,
      ipAddress: log.ipAddress,
    });
  }

  await db.$disconnect();
}

main();
