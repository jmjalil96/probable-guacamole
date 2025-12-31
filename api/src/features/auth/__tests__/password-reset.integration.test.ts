import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  testUserFactories,
  expectCookieCleared,
  expectNotFound,
  TEST_PASSWORD,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import {
  createPasswordResetToken,
  createTestSession,
  NEW_PASSWORD,
} from "./fixtures.js";
import { verifyPassword } from "../utils.js";

describe("Password Reset - Integration Tests", () => {
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

  // ===========================================================================
  // POST /auth/password-reset/request
  // ===========================================================================

  describe("POST /auth/password-reset/request", () => {
    it("should return generic message for existing user", async () => {
      const user = await testUserFactories.verified(testRoleId);

      const res = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "If an account exists, you will receive an email",
      });
    });

    it("should return same generic message for non-existent user", async () => {
      const res = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "If an account exists, you will receive an email",
      });
    });

    it("should create token in database for existing user", async () => {
      const user = await testUserFactories.verified(testRoleId);

      await request(app)
        .post("/auth/password-reset/request")
        .send({ email: user.email });

      const tokens = await db.verificationToken.findMany({
        where: { userId: user.id, type: "PASSWORD_RESET" },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.usedAt).toBeNull();
      expect(tokens[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should not create token for non-existent user", async () => {
      await request(app)
        .post("/auth/password-reset/request")
        .send({ email: "nonexistent@example.com" });

      const tokens = await db.verificationToken.findMany({
        where: { type: "PASSWORD_RESET" },
      });

      expect(tokens).toHaveLength(0);
    });

    it("should not create token for inactive user", async () => {
      const user = await testUserFactories.inactive(testRoleId);

      await request(app)
        .post("/auth/password-reset/request")
        .send({ email: user.email });

      const tokens = await db.verificationToken.findMany({
        where: { userId: user.id, type: "PASSWORD_RESET" },
      });

      expect(tokens).toHaveLength(0);
    });

    it("should delete old unused tokens when new request is made", async () => {
      const user = await testUserFactories.verified(testRoleId);

      // Create an existing token
      await createPasswordResetToken(user.id);

      // Request a new one
      await request(app)
        .post("/auth/password-reset/request")
        .send({ email: user.email });

      const tokens = await db.verificationToken.findMany({
        where: { userId: user.id, type: "PASSWORD_RESET" },
      });

      // Only the new token should exist
      expect(tokens).toHaveLength(1);
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
    });

    it("should normalize email to lowercase", async () => {
      const user = await testUserFactories.verified(testRoleId, "test@example.com");

      await request(app)
        .post("/auth/password-reset/request")
        .send({ email: "TEST@EXAMPLE.COM" });

      const tokens = await db.verificationToken.findMany({
        where: { userId: user.id, type: "PASSWORD_RESET" },
      });

      expect(tokens).toHaveLength(1);
    });
  });

  // ===========================================================================
  // GET /auth/password-reset/:token
  // ===========================================================================

  describe("GET /auth/password-reset/:token", () => {
    it("should return expiresAt for valid token", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token, verificationToken } = await createPasswordResetToken(user.id);

      const res = await request(app).get(`/auth/password-reset/${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("expiresAt");
      const body = res.body as { expiresAt: string };
      expect(new Date(body.expiresAt).getTime()).toBe(
        verificationToken.expiresAt.getTime()
      );
    });

    it("should return 404 for non-existent token", async () => {
      const res = await request(app).get("/auth/password-reset/nonexistent-token");

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });

    it("should return 404 for expired token", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id, {
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const res = await request(app).get(`/auth/password-reset/${token}`);

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });

    it("should return 404 for already-used token", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id, {
        usedAt: new Date(), // Already used
      });

      const res = await request(app).get(`/auth/password-reset/${token}`);

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });
  });

  // ===========================================================================
  // POST /auth/password-reset/confirm
  // ===========================================================================

  describe("POST /auth/password-reset/confirm", () => {
    it("should update password successfully", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Password reset successful" });

      // Verify password was updated
      const updatedUser = await db.user.findUnique({ where: { id: user.id } });
      const passwordValid = await verifyPassword(
        NEW_PASSWORD,
        updatedUser!.passwordHash
      );
      expect(passwordValid).toBe(true);
    });

    it("should mark token as used", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token, verificationToken } = await createPasswordResetToken(user.id);

      await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      const updatedToken = await db.verificationToken.findUnique({
        where: { id: verificationToken.id },
      });

      expect(updatedToken!.usedAt).not.toBeNull();
    });

    it("should invalidate all sessions (sessionsInvalidBefore)", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      // Create a session before the reset
      await createTestSession(user.id);

      const beforeReset = new Date();

      await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      const updatedUser = await db.user.findUnique({ where: { id: user.id } });

      expect(updatedUser!.sessionsInvalidBefore).not.toBeNull();
      expect(updatedUser!.sessionsInvalidBefore!.getTime()).toBeGreaterThanOrEqual(
        beforeReset.getTime()
      );
    });

    it("should clear session cookie", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      expectCookieCleared(res);
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token: "invalid-token", password: NEW_PASSWORD });

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });

    it("should return 404 for expired token", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });

    it("should return 404 for already-used token", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id, {
        usedAt: new Date(),
      });

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      expectNotFound(res, "INVALID_RESET_TOKEN");
    });

    it("should return 400 for password too short", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: "short" }); // Less than 12 characters

      expect(res.status).toBe(400);
    });

    it("should return 400 for password too long", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      const res = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: "a".repeat(129) }); // More than 128 characters

      expect(res.status).toBe(400);
    });

    it("should create audit log entry", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      // Wait for fire-and-forget audit log to be written
      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await db.auditLog.findMany({
        where: { action: "PASSWORD_CHANGED", resourceId: user.id },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0]!.resource).toBe("User");
      expect(auditLogs[0]!.severity).toBe("CRITICAL");
    });

    it("should allow login with new password after reset", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      // Try to login with new password
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: NEW_PASSWORD });

      expect(loginRes.status).toBe(200);
    });

    it("should reject old password after reset", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createPasswordResetToken(user.id);

      await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token, password: NEW_PASSWORD });

      // Try to login with old password
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(loginRes.status).toBe(401);
    });
  });
});
