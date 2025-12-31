import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  testUserFactories,
  expectCookieCleared,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import { SESSION_COOKIE_NAME } from "../constants.js";
import { createTestSession } from "./fixtures.js";

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

describe("POST /auth/logout-all - Integration Tests", () => {
  const app = createTestApp();
  let testRoleId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const role = await seedTestRole();
    testRoleId = role.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Successful logout-all", () => {
    it("should return 204 and clear session cookie", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expectCookieCleared(res);
    });

    it("should set sessionsInvalidBefore on user record", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const beforeLogout = new Date();

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.sessionsInvalidBefore).not.toBeNull();
      expect(updatedUser!.sessionsInvalidBefore!.getTime()).toBeGreaterThanOrEqual(
        beforeLogout.getTime()
      );
    });

    it("should revoke current session explicitly", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { session, token } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      const updatedSession = await db.session.findUnique({
        where: { id: session.id },
      });

      expect(updatedSession!.revokedAt).not.toBeNull();
    });

    it("should invalidate all other sessions via timestamp", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token: currentToken } = await createTestSession(user.id);
      const { token: otherToken } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${currentToken}`);

      // Try to use the other session - should fail due to sessionsInvalidBefore
      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${otherToken}`);

      expect(res.status).toBe(401);
    });

    it("should create audit log with LOGOUT action and allSessions metadata", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { session, token } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      // Allow async audit log to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "LOGOUT",
          resource: "Session",
          resourceId: session.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(user.id);
      expect(auditLog!.metadata).toEqual({ allSessions: true });
    });
  });

  describe("Session invalidation mechanism", () => {
    it("should reject requests using sessions created before logout-all", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token: sessionBeforeLogout } = await createTestSession(user.id);
      const { token: currentToken } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${currentToken}`);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionBeforeLogout}`);

      expect(res.status).toBe(401);
    });

    it("should allow new sessions created after logout-all", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token: currentToken } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${currentToken}`);

      // Create new session after logout-all
      const { token: newToken } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${newToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Authentication required", () => {
    it("should return 401 when no session cookie", async () => {
      const res = await request(app).post("/auth/logout-all");

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Atomicity", () => {
    it("should update user and session in single transaction", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { session, token } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout-all")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });
      const updatedSession = await db.session.findUnique({
        where: { id: session.id },
      });

      // Both should be updated
      expect(updatedUser!.sessionsInvalidBefore).not.toBeNull();
      expect(updatedSession!.revokedAt).not.toBeNull();

      // Timestamps should be close (within same transaction)
      const timeDiff = Math.abs(
        updatedUser!.sessionsInvalidBefore!.getTime() -
          updatedSession!.revokedAt!.getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });
});
