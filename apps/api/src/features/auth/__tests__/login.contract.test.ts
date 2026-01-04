import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import {
  createTestApp,
  testUserFactories,
  TEST_PASSWORD,
} from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import { SESSION_COOKIE_NAME } from "../constants.js";

interface ErrorBody {
  error: { message: string; code: string; requestId: string };
}

interface LoginResponseBody {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: { firstName: string; lastName: string } | null;
  role: string;
  permissions: string[];
}

/**
 * Contract tests verify API shape and response structure.
 * These tests ensure the API contract remains stable.
 */
describe("POST /auth/login - Contract Tests", () => {
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

  describe("Request validation", () => {
    it("should require email field", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ password: "password" });

      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error).toHaveProperty("code");
    });

    it("should require password field", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });

    it("should validate email format", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "invalid-email", password: "password" });

      expect(res.status).toBe(400);
    });

    it("should normalize email to lowercase", async () => {
      await testUserFactories.verified(testRoleId, "test@example.com");

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "TEST@EXAMPLE.COM", password: TEST_PASSWORD });

      expect(res.status).toBe(200);
    });

    it("should trim whitespace from email", async () => {
      await testUserFactories.verified(testRoleId, "test@example.com");

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "  test@example.com  ", password: TEST_PASSWORD });

      expect(res.status).toBe(200);
    });
  });

  describe("Success response shape", () => {
    it("should return user data on successful login", async () => {
      const user = await testUserFactories.verified(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      const body = res.body as LoginResponseBody;
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("emailVerifiedAt");
      expect(body).toHaveProperty("name");
      expect(body).toHaveProperty("role");
      expect(body).toHaveProperty("permissions");
      expect(body.id).toBe(user.id);
      expect(body.email).toBe(user.email);
      expect(body.role).toBe("user");
      expect(Array.isArray(body.permissions)).toBe(true);
    });

    it("should set correct cookie attributes", async () => {
      const user = await testUserFactories.verified(testRoleId);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD });

      const cookies = res.headers["set-cookie"] as string[] | undefined;
      expect(cookies).toBeDefined();

      const sidCookie = cookies!.find((c) =>
        c.startsWith(`${SESSION_COOKIE_NAME}=`)
      );

      expect(sidCookie).toBeDefined();
      expect(sidCookie).toMatch(new RegExp(`${SESSION_COOKIE_NAME}=[^;]+`));
      expect(sidCookie).toContain("HttpOnly");
      expect(sidCookie).toContain("Path=/");
      expect(sidCookie).toContain("SameSite=Lax");
      expect(sidCookie).toContain("Expires=");
    });
  });

  describe("Error response shape", () => {
    it("should return standard error structure for 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "password" });

      const body = res.body as ErrorBody;
      expect(res.status).toBe(401);
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("message", "Invalid credentials");
      expect(body.error).toHaveProperty("code", "UNAUTHORIZED");
      expect(body.error).toHaveProperty("requestId");
    });

    it("should not leak user existence in error messages", async () => {
      const user = await testUserFactories.verified(testRoleId);

      // Non-existent user
      const res1 = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "password" });

      // Wrong password
      const res2 = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: "wrong-password" });

      const body1 = res1.body as ErrorBody;
      const body2 = res2.body as ErrorBody;

      // Both should have identical error messages
      expect(body1.error.message).toBe(body2.error.message);
      expect(body1.error.code).toBe(body2.error.code);
    });
  });
});
