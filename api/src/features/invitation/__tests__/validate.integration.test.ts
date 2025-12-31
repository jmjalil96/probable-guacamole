import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedTestRole,
  seedAdminRoleWithInvitePermission,
  createTestUser,
  createTestEmployee,
  createTestInvitation,
  createTestClient,
} from "./fixtures.js";

interface ErrorBody {
  error: { message: string; code: string };
}

interface ValidateInvitationBody {
  expiresAt: string;
  role: { displayName: string };
}

describe("GET /auth/invitations/:token - Validate Invitation", () => {
  const app = createTestApp();
  let adminRole: Awaited<ReturnType<typeof seedAdminRoleWithInvitePermission>>;
  let targetRole: Awaited<ReturnType<typeof seedTestRole>>;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    await cleanDatabase();
    adminRole = await seedAdminRoleWithInvitePermission();
    targetRole = await seedTestRole("invitee-role");
    adminUser = await createTestUser(adminRole.id);
    await createTestClient();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // Success cases
  // =========================================================================

  describe("Successful validation", () => {
    it("should return invitation info for valid token", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const res = await request(app).get(`/auth/invitations/${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("expiresAt");
      expect(res.body).toHaveProperty("role");
      expect((res.body as ValidateInvitationBody).role).toHaveProperty("displayName", targetRole.displayName);
    });
  });

  // =========================================================================
  // Error cases
  // =========================================================================

  describe("Validation errors", () => {
    it("should return 404 for non-existent token", async () => {
      const res = await request(app).get("/auth/invitations/invalid-token");

      expect(res.status).toBe(404);
      expect((res.body as ErrorBody).error.message).toBe("Invalid or expired invitation not found");
    });

    it("should return 404 for expired token", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        {
          email: employee.email,
          expiresAt: new Date(Date.now() - 1000), // Expired
        }
      );

      const res = await request(app).get(`/auth/invitations/${token}`);

      expect(res.status).toBe(404);
      expect((res.body as ErrorBody).error.message).toBe("Invalid or expired invitation not found");
    });

    it("should return 404 for already accepted token", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        {
          email: employee.email,
          acceptedAt: new Date(), // Already accepted
        }
      );

      const res = await request(app).get(`/auth/invitations/${token}`);

      expect(res.status).toBe(404);
      expect((res.body as ErrorBody).error.message).toBe("Invalid or expired invitation not found");
    });
  });
});
