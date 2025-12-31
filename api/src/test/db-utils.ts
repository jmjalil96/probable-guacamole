import { db } from "../config/db.js";

/**
 * Clean all test data from the database.
 * Order matters due to foreign keys - delete in reverse dependency order.
 */
export async function cleanDatabase() {
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.session.deleteMany(),
    db.verificationToken.deleteMany(),
    db.rolePermission.deleteMany(),
    db.user.deleteMany(),
    db.permission.deleteMany(),
    db.role.deleteMany(),
  ]);
}

/**
 * Seed the default user role for tests.
 */
export async function seedTestRole() {
  return db.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      displayName: "User",
      description: "Standard user role for tests",
      scopeType: "SELF",
    },
  });
}
