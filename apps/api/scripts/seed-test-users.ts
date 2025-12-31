import * as argon2 from "argon2";
import { db } from "../src/config/db.js";

async function seed() {
  const password = await argon2.hash("password123", { type: argon2.argon2id });

  // Create a role first
  const role = await db.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      displayName: "User",
      scopeType: "SELF",
    },
  });

  // 1. Normal verified user
  await db.user.upsert({
    where: { email: "active@test.com" },
    update: {
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      lockedAt: null,
      failedLoginAttempts: 0,
    },
    create: {
      email: "active@test.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      roleId: role.id,
    },
  });

  // 2. Locked user
  await db.user.upsert({
    where: { email: "locked@test.com" },
    update: {
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      lockedAt: new Date(),
      failedLoginAttempts: 5,
    },
    create: {
      email: "locked@test.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      lockedAt: new Date(),
      failedLoginAttempts: 5,
      roleId: role.id,
    },
  });

  // 3. Unverified user
  await db.user.upsert({
    where: { email: "unverified@test.com" },
    update: {
      passwordHash: password,
      emailVerifiedAt: null,
      isActive: true,
      lockedAt: null,
    },
    create: {
      email: "unverified@test.com",
      passwordHash: password,
      emailVerifiedAt: null,
      isActive: true,
      roleId: role.id,
    },
  });

  // 4. Inactive user
  await db.user.upsert({
    where: { email: "inactive@test.com" },
    update: {
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: false,
      lockedAt: null,
    },
    create: {
      email: "inactive@test.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: false,
      roleId: role.id,
    },
  });

  // 5. User with 4 failed attempts (one more locks)
  await db.user.upsert({
    where: { email: "almost-locked@test.com" },
    update: {
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      lockedAt: null,
      failedLoginAttempts: 4,
    },
    create: {
      email: "almost-locked@test.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      isActive: true,
      failedLoginAttempts: 4,
      roleId: role.id,
    },
  });

  console.log("Seeded test users:");
  console.log("  - active@test.com (password123) - normal user");
  console.log("  - locked@test.com (password123) - locked account");
  console.log("  - unverified@test.com (password123) - email not verified");
  console.log("  - inactive@test.com (password123) - inactive account");
  console.log("  - almost-locked@test.com (password123) - 4 failed attempts");

  await db.$disconnect();
}

seed();
