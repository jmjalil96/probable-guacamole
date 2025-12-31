import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp, testUserFactories } from "../../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../../test/db-utils.js";
import { SESSION_COOKIE_NAME } from "../constants.js";
import { createTestSession } from "./fixtures.js";

interface MeResponseBody {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: { firstName: string; lastName: string } | null;
  role: string;
  permissions: string[];
}

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

describe("GET /auth/me - Integration Tests", () => {
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

  describe("Successful response", () => {
    it("should return 200 with user data", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email");
      expect(res.body).toHaveProperty("role");
      expect(res.body).toHaveProperty("permissions");
    });

    it("should include id, email, emailVerifiedAt", async () => {
      const user = await testUserFactories.verified(testRoleId, "test@example.com");
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.id).toBe(user.id);
      expect(body.email).toBe("test@example.com");
      expect(body.emailVerifiedAt).not.toBeNull();
    });

    it("should include role name", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.role).toBe("user");
    });

    it("should include permissions array in resource:action format", async () => {
      // Create role with permissions
      const permission = await db.permission.create({
        data: { resource: "policies", action: "read" },
      });
      const roleWithPerm = await db.role.create({
        data: {
          name: "agent",
          displayName: "Agent",
          scopeType: "CLIENT",
          permissions: {
            create: { permissionId: permission.id },
          },
        },
      });
      const user = await testUserFactories.verified(roleWithPerm.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.permissions).toEqual(["policies:read"]);
    });

    it("should include Cache-Control: no-store header", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["cache-control"]).toBe("no-store");
    });
  });

  describe("Profile name resolution", () => {
    it("should return name from Employee profile", async () => {
      const user = await testUserFactories.verified(testRoleId);
      await db.employee.create({
        data: {
          email: "employee@example.com",
          firstName: "John",
          lastName: "Employee",
          userId: user.id,
        },
      });
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.name).toEqual({
        firstName: "John",
        lastName: "Employee",
      });
    });

    it("should return name from Agent profile", async () => {
      const user = await testUserFactories.verified(testRoleId);
      await db.agent.create({
        data: {
          email: "agent@example.com",
          firstName: "Jane",
          lastName: "Agent",
          userId: user.id,
        },
      });
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.name).toEqual({
        firstName: "Jane",
        lastName: "Agent",
      });
    });

    it("should return name from ClientAdmin profile", async () => {
      const user = await testUserFactories.verified(testRoleId);
      await db.clientAdmin.create({
        data: {
          email: "clientadmin@example.com",
          firstName: "Bob",
          lastName: "ClientAdmin",
          userId: user.id,
        },
      });
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.name).toEqual({
        firstName: "Bob",
        lastName: "ClientAdmin",
      });
    });

    it("should return name from Affiliate profile", async () => {
      const client = await db.client.create({
        data: { name: "Test Client", isActive: true },
      });
      const user = await testUserFactories.verified(testRoleId);
      await db.affiliate.create({
        data: {
          firstName: "Alice",
          lastName: "Affiliate",
          clientId: client.id,
          userId: user.id,
        },
      });
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.name).toEqual({
        firstName: "Alice",
        lastName: "Affiliate",
      });
    });

    it("should return null name when no profile linked", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.name).toBeNull();
    });
  });

  describe("Permissions", () => {
    it("should return empty array when role has no permissions", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.permissions).toEqual([]);
    });

    it("should return all permissions for role", async () => {
      const perm1 = await db.permission.create({
        data: { resource: "policies", action: "read" },
      });
      const perm2 = await db.permission.create({
        data: { resource: "policies", action: "write" },
      });
      const perm3 = await db.permission.create({
        data: { resource: "claims", action: "read" },
      });
      const roleWithPerms = await db.role.create({
        data: {
          name: "admin",
          displayName: "Administrator",
          scopeType: "UNLIMITED",
          permissions: {
            create: [
              { permissionId: perm1.id },
              { permissionId: perm2.id },
              { permissionId: perm3.id },
            ],
          },
        },
      });
      const user = await testUserFactories.verified(roleWithPerms.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as MeResponseBody;
      expect(body.permissions).toHaveLength(3);
      expect(body.permissions).toContain("policies:read");
      expect(body.permissions).toContain("policies:write");
      expect(body.permissions).toContain("claims:read");
    });
  });

  describe("Authentication required", () => {
    it("should return 401 when no session cookie", async () => {
      const res = await request(app).get("/auth/me");

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
        .get("/auth/me")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
