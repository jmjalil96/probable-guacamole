import { db } from "../../config/db.js";
import { hashPassword } from "../../features/auth/utils.js";

export const TEST_PASSWORD = "TestPassword123!";

interface CreateTestUserOptions {
  email?: string;
  password?: string;
  isActive?: boolean;
  emailVerifiedAt?: Date | null;
  failedLoginAttempts?: number;
  lockedAt?: Date | null;
}

export async function createTestUser(
  roleId: string,
  options: CreateTestUserOptions = {}
) {
  const {
    email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password = TEST_PASSWORD,
    isActive = true,
    emailVerifiedAt = new Date(),
    failedLoginAttempts = 0,
    lockedAt = null,
  } = options;

  const passwordHash = await hashPassword(password);

  return db.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      isActive,
      emailVerifiedAt,
      failedLoginAttempts,
      lockedAt,
    },
  });
}

/**
 * Preset factories for common test scenarios.
 */
export const testUserFactories = {
  verified: (roleId: string, email?: string) =>
    createTestUser(roleId, { ...(email && { email }), emailVerifiedAt: new Date() }),

  unverified: (roleId: string, email?: string) =>
    createTestUser(roleId, { ...(email && { email }), emailVerifiedAt: null }),

  inactive: (roleId: string, email?: string) =>
    createTestUser(roleId, { ...(email && { email }), isActive: false }),

  locked: (roleId: string, email?: string) =>
    createTestUser(roleId, {
      ...(email && { email }),
      lockedAt: new Date(),
      failedLoginAttempts: 5,
    }),

  withFailedAttempts: (roleId: string, attempts: number, email?: string) =>
    createTestUser(roleId, { ...(email && { email }), failedLoginAttempts: attempts }),
};
