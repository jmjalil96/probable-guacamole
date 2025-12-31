import { describe, it, expect, beforeEach, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import { db } from "../../config/db.js";
import { generateSessionToken, hashToken } from "../../features/auth/utils.js";
import { SESSION_COOKIE_NAME } from "../../features/auth/constants.js";
import { requireAuth } from "../require-auth.js";
import { requirePermission } from "../require-permission.js";
import { errorHandler } from "../error-handler.js";
import { testUserFactories } from "../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../test/db-utils.js";

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

function createTestAppWithPermission(permission: string): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get(
    "/protected",
    requireAuth,
    requirePermission(permission),
    (_req, res) => {
      res.json({ success: true });
    }
  );

  app.use(errorHandler);
  return app;
}

function createTestAppWithoutAuth(permission: string): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // No requireAuth - to test the guard
  app.get("/protected", requirePermission(permission), (_req, res) => {
    res.json({ success: true });
  });

  app.use(errorHandler);
  return app;
}

async function createTestSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { session, token };
}

async function createPermission(resource: string, action: string) {
  return db.permission.create({
    data: { resource, action },
  });
}

async function assignPermissionToRole(roleId: string, permissionId: string) {
  return db.rolePermission.create({
    data: { roleId, permissionId },
  });
}

describe("requirePermission Middleware - Integration Tests", () => {
  let testRoleId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const role = await seedTestRole();
    testRoleId = role.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Permission granted", () => {
    it("should return 200 when user has the required permission", async () => {
      const app = createTestAppWithPermission("invoices:read");
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const permission = await createPermission("invoices", "read");
      await assignPermissionToRole(testRoleId, permission.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    it("should work with different resource:action combinations", async () => {
      const app = createTestAppWithPermission("users:delete");
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const permission = await createPermission("users", "delete");
      await assignPermissionToRole(testRoleId, permission.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("Permission denied", () => {
    it("should return 403 when user lacks the required permission", async () => {
      const app = createTestAppWithPermission("invoices:delete");
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      // User has invoices:read but not invoices:delete
      const permission = await createPermission("invoices", "read");
      await assignPermissionToRole(testRoleId, permission.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 when user has no permissions at all", async () => {
      const app = createTestAppWithPermission("invoices:read");
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Missing authentication", () => {
    it("should return 401 when requireAuth is not used", async () => {
      const app = createTestAppWithoutAuth("invoices:read");

      const res = await request(app).get("/protected");

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Invalid permission format", () => {
    it("should throw error for permission without colon", () => {
      expect(() => requirePermission("invoices")).toThrow(
        'Invalid permission format: "invoices". Expected "resource:action"'
      );
    });

    it("should throw error for empty permission", () => {
      expect(() => requirePermission("")).toThrow(
        'Invalid permission format: "". Expected "resource:action"'
      );
    });

    it("should throw error for permission with only colon", () => {
      expect(() => requirePermission(":")).toThrow(
        'Invalid permission format: ":". Expected "resource:action"'
      );
    });
  });
});
