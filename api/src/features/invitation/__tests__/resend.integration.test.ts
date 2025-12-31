import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import { SESSION_COOKIE_NAME } from "../../auth/constants.js";
import {
  seedTestRole,
  seedAdminRoleWithInvitePermission,
  createTestUser,
  createTestEmployee,
  createTestInvitation,
  createTestSession,
  createTestClient,
} from "./fixtures.js";

interface ErrorBody {
  error: { message: string; code: string };
}

describe("POST /auth/invitations/:id/resend - Resend Invitation", () => {
  const app = createTestApp();
  let adminRole: Awaited<ReturnType<typeof seedAdminRoleWithInvitePermission>>;
  let targetRole: Awaited<ReturnType<typeof seedTestRole>>;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let adminSessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    adminRole = await seedAdminRoleWithInvitePermission();
    targetRole = await seedTestRole("invitee-role");
    adminUser = await createTestUser(adminRole.id);
    adminSessionToken = `session-${Date.now()}`;
    await createTestSession(adminUser.id, adminSessionToken);
    await createTestClient();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // Success cases
  // =========================================================================

  describe("Successful resend", () => {
    it("should regenerate token and update expiration", async () => {
      const employee = await createTestEmployee();
      const { invitation: originalInvitation } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const originalTokenHash = originalInvitation.tokenHash;
      const originalExpiresAt = originalInvitation.expiresAt;

      // Wait a moment to ensure new timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const res = await request(app)
        .post(`/auth/invitations/${originalInvitation.id}/resend`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("invitationId", originalInvitation.id);
      expect(res.body).toHaveProperty("expiresAt");

      // Verify token was regenerated
      const updatedInvitation = await db.invitation.findUnique({
        where: { id: originalInvitation.id },
      });
      expect(updatedInvitation!.tokenHash).not.toBe(originalTokenHash);
      expect(updatedInvitation!.expiresAt.getTime()).toBeGreaterThan(
        originalExpiresAt.getTime()
      );
    });
  });

  // =========================================================================
  // Authentication errors
  // =========================================================================

  describe("Authentication errors", () => {
    it("should return 401 without auth cookie", async () => {
      const employee = await createTestEmployee();
      const { invitation } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const res = await request(app).post(
        `/auth/invitations/${invitation.id}/resend`
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 without invite permission", async () => {
      const regularRole = await seedTestRole("regular-user");
      const regularUser = await createTestUser(regularRole.id);
      const regularSessionToken = `session-regular-${Date.now()}`;
      await createTestSession(regularUser.id, regularSessionToken);

      const employee = await createTestEmployee();
      const { invitation } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const res = await request(app)
        .post(`/auth/invitations/${invitation.id}/resend`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${regularSessionToken}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // Validation errors
  // =========================================================================

  describe("Validation errors", () => {
    it("should return 404 for non-existent invitation", async () => {
      const res = await request(app)
        .post("/auth/invitations/non-existent-id/resend")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 409 for already accepted invitation", async () => {
      const employee = await createTestEmployee();
      const { invitation } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        {
          email: employee.email,
          acceptedAt: new Date(),
        }
      );

      const res = await request(app)
        .post(`/auth/invitations/${invitation.id}/resend`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`);

      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.message).toContain("already accepted");
    });
  });
});
