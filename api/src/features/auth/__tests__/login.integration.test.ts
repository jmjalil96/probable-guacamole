import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  testUserFactories,
  expectSessionCookie,
  expectUnauthorized,
  TEST_PASSWORD,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import { WRONG_PASSWORD } from "./fixtures.js";

describe("POST /auth/login - Integration Tests", () => {
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

  describe("Successful login", () => {
    it("should return 200 and set session cookie for valid credentials", async () => {
      const user = await testUserFactories.verified(testRoleId, "test@example.com");

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expectSessionCookie(res);
    });

    it("should create a session in the database", async () => {
      const user = await testUserFactories.verified(testRoleId);

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      const sessions = await db.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should reset failed login attempts on successful login", async () => {
      const user = await testUserFactories.withFailedAttempts(testRoleId, 3);

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.failedLoginAttempts).toBe(0);
    });
  });

  describe("Login state machine - rejection paths", () => {
    it("should reject with 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: TEST_PASSWORD });

      expectUnauthorized(res);
    });

    it("should reject with 401 for locked account", async () => {
      const user = await testUserFactories.locked(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expectUnauthorized(res);
    });

    it("should reject with 401 for unverified email", async () => {
      const user = await testUserFactories.unverified(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expectUnauthorized(res);
    });

    it("should reject with 401 for inactive account", async () => {
      const user = await testUserFactories.inactive(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      expectUnauthorized(res);
    });

    it("should reject with 401 for wrong password", async () => {
      const user = await testUserFactories.verified(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: WRONG_PASSWORD });

      expectUnauthorized(res);
    });
  });

  describe("Failed attempt counter", () => {
    it("should increment failed attempts on wrong password", async () => {
      const user = await testUserFactories.verified(testRoleId);

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: WRONG_PASSWORD });

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.failedLoginAttempts).toBe(1);
    });

    it("should lock account at exactly 5 failed attempts", async () => {
      const user = await testUserFactories.withFailedAttempts(testRoleId, 4);

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: WRONG_PASSWORD });

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.failedLoginAttempts).toBe(5);
      expect(updatedUser!.lockedAt).not.toBeNull();
    });

    it("should not lock account before reaching threshold", async () => {
      const user = await testUserFactories.withFailedAttempts(testRoleId, 3);

      await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: WRONG_PASSWORD });

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.failedLoginAttempts).toBe(4);
      expect(updatedUser!.lockedAt).toBeNull();
    });
  });
});
