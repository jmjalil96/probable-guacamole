import { describe, it, expect, beforeEach, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import type { ScopeType } from "@prisma/client";
import { db } from "../../config/db.js";
import { generateSessionToken, hashToken } from "../../features/auth/utils.js";
import { SESSION_COOKIE_NAME } from "../../features/auth/constants.js";
import { requireAuth } from "../require-auth.js";
import { requireScope } from "../require-scope.js";
import { errorHandler } from "../error-handler.js";
import { cleanDatabase } from "../../test/db-utils.js";

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

function createTestAppWithScope(scope: ScopeType | ScopeType[]): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/protected", requireAuth, requireScope(scope), (_req, res) => {
    res.json({ success: true });
  });

  app.use(errorHandler);
  return app;
}

function createTestAppWithoutAuth(scope: ScopeType | ScopeType[]): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/protected", requireScope(scope), (_req, res) => {
    res.json({ success: true });
  });

  app.use(errorHandler);
  return app;
}

async function createRoleWithScope(name: string, scopeType: ScopeType) {
  return db.role.create({
    data: {
      name,
      displayName: name,
      scopeType,
    },
  });
}

async function createUserWithRole(roleId: string) {
  return db.user.create({
    data: {
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: "not-used-in-test",
      roleId,
      emailVerifiedAt: new Date(),
    },
  });
}

async function createTestSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token };
}

describe("requireScope Middleware - Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Single scope", () => {
    it("should return 200 when user has UNLIMITED scope", async () => {
      const app = createTestAppWithScope("UNLIMITED");
      const role = await createRoleWithScope("admin", "UNLIMITED");
      const user = await createUserWithRole(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    it("should return 200 when user has CLIENT scope", async () => {
      const app = createTestAppWithScope("CLIENT");
      const role = await createRoleWithScope("agent", "CLIENT");
      const user = await createUserWithRole(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
    });

    it("should return 200 when user has SELF scope", async () => {
      const app = createTestAppWithScope("SELF");
      const role = await createRoleWithScope("affiliate", "SELF");
      const user = await createUserWithRole(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
    });

    it("should return 403 when user lacks required scope", async () => {
      const app = createTestAppWithScope("UNLIMITED");
      const role = await createRoleWithScope("affiliate", "SELF");
      const user = await createUserWithRole(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Multiple scopes (array)", () => {
    it("should return 200 when user has one of the allowed scopes", async () => {
      const app = createTestAppWithScope(["UNLIMITED", "CLIENT"]);
      const role = await createRoleWithScope("agent", "CLIENT");
      const user = await createUserWithRole(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
    });

    it("should return 403 when user has none of the allowed scopes", async () => {
      const app = createTestAppWithScope(["UNLIMITED", "CLIENT"]);
      const role = await createRoleWithScope("affiliate", "SELF");
      const user = await createUserWithRole(role.id);
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
      const app = createTestAppWithoutAuth("UNLIMITED");

      const res = await request(app).get("/protected");

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
