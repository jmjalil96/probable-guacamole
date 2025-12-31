import { describe, it, expect, beforeEach, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import type { ScopeType } from "@prisma/client";
import { db } from "../../config/db.js";
import { generateSessionToken, hashToken } from "../../features/auth/utils.js";
import { SESSION_COOKIE_NAME } from "../../features/auth/constants.js";
import { requireAuth } from "../require-auth.js";
import { errorHandler } from "../error-handler.js";
import { testUserFactories } from "../../test/helpers/index.js";
import { cleanDatabase, seedTestRole } from "../../test/db-utils.js";

interface UserResponse {
  id: string;
  sessionId: string;
  role: {
    id: string;
    name: string;
    scopeType: ScopeType;
  };
}

interface SuccessResponseBody {
  user: UserResponse;
}

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

function createTestAppWithAuth(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/protected", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.use(errorHandler);
  return app;
}

async function createTestSession(
  userId: string,
  options: {
    expiresAt?: Date;
    revokedAt?: Date | null;
  } = {}
) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      revokedAt: options.revokedAt ?? null,
    },
  });

  return { session, token };
}

describe("requireAuth Middleware - Integration Tests", () => {
  const app = createTestAppWithAuth();
  let testRoleId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const role = await seedTestRole();
    testRoleId = role.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Valid session", () => {
    it("should return 200 and attach user to request for valid session", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as SuccessResponseBody;
      expect(body.user.id).toBe(user.id);
      expect(typeof body.user.sessionId).toBe("string");
      expect(body.user.role).toEqual({
        id: testRoleId,
        name: "user",
        scopeType: "SELF",
      });
    });

    it("should attach sessionId matching the database session", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token, session } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as SuccessResponseBody;
      expect(body.user.sessionId).toBe(session.id);
    });
  });

  describe("Missing or invalid token", () => {
    it("should return 401 when no cookie is present", async () => {
      const res = await request(app).get("/protected");

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when token does not match any session", async () => {
      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Session state validation", () => {
    it("should return 401 for expired session", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 for revoked session", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id, {
        revokedAt: new Date(),
      });

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("User state validation", () => {
    it("should return 401 for inactive user", async () => {
      const user = await testUserFactories.inactive(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 for locked user", async () => {
      const user = await testUserFactories.locked(testRoleId);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when session was created before sessionsInvalidBefore", async () => {
      const user = await testUserFactories.verified(testRoleId);
      const { token } = await createTestSession(user.id);

      // Invalidate all sessions by setting sessionsInvalidBefore to future
      // This ensures session.createdAt < sessionsInvalidBefore
      await db.user.update({
        where: { id: user.id },
        data: { sessionsInvalidBefore: new Date(Date.now() + 1000) },
      });

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(401);
      const body = res.body as ErrorResponseBody;
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should allow session created after sessionsInvalidBefore", async () => {
      const user = await testUserFactories.verified(testRoleId);

      // Set invalidation time to the past
      await db.user.update({
        where: { id: user.id },
        data: { sessionsInvalidBefore: new Date(Date.now() - 10000) },
      });

      // Create session after the invalidation time
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as SuccessResponseBody;
      expect(body.user.id).toBe(user.id);
    });
  });

  describe("Role information", () => {
    it("should include role with scopeType in user context", async () => {
      const adminRole = await db.role.create({
        data: {
          name: "admin",
          displayName: "Administrator",
          scopeType: "UNLIMITED",
        },
      });

      const user = await db.user.create({
        data: {
          email: "admin@example.com",
          passwordHash: "not-used-in-this-test",
          roleId: adminRole.id,
          emailVerifiedAt: new Date(),
        },
      });

      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get("/protected")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(200);
      const body = res.body as SuccessResponseBody;
      expect(body.user.role).toEqual({
        id: adminRole.id,
        name: "admin",
        scopeType: "UNLIMITED",
      });
    });
  });
});
