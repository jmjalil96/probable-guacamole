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

describe("POST /auth/logout - Integration Tests", () => {
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

  describe("Successful logout", () => {
    it("should return 204 and clear session cookie", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expectCookieCleared(res);
    });

    it("should revoke the session in database (set revokedAt)", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { session, token } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      const updatedSession = await db.session.findUnique({
        where: { id: session.id },
      });

      expect(updatedSession!.revokedAt).not.toBeNull();
    });

    it("should not affect other sessions for same user", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token: tokenToLogout } = await createTestSession(user.id);
      const { session: otherSession } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${tokenToLogout}`);

      const updatedOtherSession = await db.session.findUnique({
        where: { id: otherSession.id },
      });

      expect(updatedOtherSession!.revokedAt).toBeNull();
    });

    it("should create audit log entry with LOGOUT action", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { session, token } = await createTestSession(user.id);

      await request(app)
        .post("/auth/logout")
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
    });
  });

  describe("Authentication required", () => {
    it("should return 401 when no session cookie", async () => {
      const res = await request(app).post("/auth/logout");

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when session already revoked", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id, {
        revokedAt: new Date(),
      });

      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when session expired", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Idempotency", () => {
    it("should handle concurrent logout requests gracefully", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      // Fire multiple concurrent logout requests
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .post("/auth/logout")
          .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
      );

      const responses = await Promise.all(requests);

      // First request should succeed, others should fail auth (session revoked)
      const successCount = responses.filter((r) => r.status === 204).length;
      const authFailCount = responses.filter((r) => r.status === 401).length;

      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount + authFailCount).toBe(3);
    });
  });
});
