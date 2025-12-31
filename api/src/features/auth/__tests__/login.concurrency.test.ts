import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  testUserFactories,
  TEST_PASSWORD,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import { WRONG_PASSWORD } from "./fixtures.js";
import { enqueue } from "../../../services/jobs/index.js";

const mockEnqueue = vi.mocked(enqueue);

/**
 * Concurrency tests verify race condition handling.
 * These use real database transactions to test atomic operations.
 */
describe("POST /auth/login - Concurrency Tests", () => {
  const app = createTestApp();
  let testRoleId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const role = await seedTestRole();
    testRoleId = role.id;
    mockEnqueue.mockClear();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Race condition: Account locking", () => {
    it("should only send ONE email when concurrent requests trigger lock", async () => {
      // Create user at exactly 4 failed attempts (one away from lock)
      const user = await testUserFactories.withFailedAttempts(
        testRoleId,
        4,
        "race@example.com"
      );

      // Fire 5 concurrent failed login attempts
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post("/auth/login")
          .send({ email: user.email, password: WRONG_PASSWORD })
      );

      await Promise.all(requests);

      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have exactly ONE call to enqueue account-locked email
      const lockEmailCalls = mockEnqueue.mock.calls.filter(
        (call) => call[0] === "email:account-locked"
      );

      expect(lockEmailCalls).toHaveLength(1);
      expect(lockEmailCalls[0]![1]).toEqual({
        to: user.email,
        userId: user.id,
      });
    });

    it("should correctly increment counter with concurrent requests", async () => {
      const user = await testUserFactories.verified(testRoleId);

      // Fire 3 concurrent failed login attempts
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .post("/auth/login")
          .send({ email: user.email, password: WRONG_PASSWORD })
      );

      await Promise.all(requests);

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      // All 3 increments should have been applied atomically
      expect(updatedUser!.failedLoginAttempts).toBe(3);
    });

    it("should lock account exactly once regardless of concurrent requests", async () => {
      const user = await testUserFactories.withFailedAttempts(testRoleId, 3);

      // Fire 10 concurrent requests (more than needed to reach threshold)
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post("/auth/login")
          .send({ email: user.email, password: WRONG_PASSWORD })
      );

      await Promise.all(requests);

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      // Account should be locked
      expect(updatedUser!.lockedAt).not.toBeNull();

      // The count should continue incrementing past the threshold
      expect(updatedUser!.failedLoginAttempts).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Race condition: Session creation", () => {
    it("should create separate sessions for concurrent successful logins", async () => {
      const user = await testUserFactories.verified(testRoleId);

      // Fire 3 concurrent successful login attempts
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .post("/auth/login")
          .send({ email: user.email, password: TEST_PASSWORD })
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Should have created 3 separate sessions
      const sessions = await db.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(3);

      // Each session should have a unique token hash
      const tokenHashes = sessions.map((s) => s.tokenHash);
      const uniqueHashes = new Set(tokenHashes);
      expect(uniqueHashes.size).toBe(3);
    });
  });
});
