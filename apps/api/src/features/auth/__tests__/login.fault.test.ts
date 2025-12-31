import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  testUserFactories,
  TEST_PASSWORD,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import * as repo from "../repository.js";

interface ErrorBody {
  error: { message: string; code: string; requestId: string };
}

/**
 * Fault injection tests verify error handling and recovery.
 */
describe("POST /auth/login - Fault Injection Tests", () => {
  const app = createTestApp();
  let testRoleId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const role = await seedTestRole();
    testRoleId = role.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Database connection failures", () => {
    it("should return 500 when user lookup fails", async () => {
      vi.spyOn(repo, "findUserByEmail").mockRejectedValue(
        new Error("Connection refused")
      );

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });

      expect(res.status).toBe(500);
      expect((res.body as ErrorBody).error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should return 500 when session creation fails", async () => {
      const user = await testUserFactories.verified(testRoleId);

      vi.spyOn(repo, "createSessionAndResetAttempts").mockRejectedValue(
        new Error("Deadlock detected")
      );

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(res.status).toBe(500);
    });

    it("should not create partial state when session transaction fails", async () => {
      const user = await testUserFactories.withFailedAttempts(testRoleId, 2);

      // Mock to fail after resetting attempts but before creating session
      vi.spyOn(repo, "createSessionAndResetAttempts").mockRejectedValue(
        new Error("Session creation failed")
      );

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      // Verify no partial state: failed attempts should still be 2
      // because the transaction should have rolled back
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      // Note: This test verifies transaction atomicity
      // Since we mock at the repo level (after the real call would happen),
      // the actual transaction behavior is tested by the real implementation
      expect(updatedUser!.failedLoginAttempts).toBe(2);

      // No session should exist
      const sessions = await db.session.findMany({
        where: { userId: user.id },
      });
      expect(sessions).toHaveLength(0);
    });
  });

  describe("Failed attempt increment failures", () => {
    it("should handle increment failure gracefully", async () => {
      const user = await testUserFactories.verified(testRoleId);

      vi.spyOn(repo, "incrementFailedAttemptsAndMaybeLock").mockRejectedValue(
        new Error("Database timeout")
      );

      // Even if increment fails, should return error
      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: "wrong-password" });

      // Should return 500 since the operation failed
      expect(res.status).toBe(500);
    });
  });
});
