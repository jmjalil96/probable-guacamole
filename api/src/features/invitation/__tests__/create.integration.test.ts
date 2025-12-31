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
  createTestAgent,
  createTestClientAdmin,
  createTestAffiliate,
  createTestSession,
  createTestClient,
  invalidCreateInvitationPayloads,
} from "./fixtures.js";

interface ErrorBody {
  error: { message: string; code: string };
}

interface CreateInvitationBody {
  invitationId: string;
  expiresAt: string;
}

describe("POST /auth/invitations - Create Invitation", () => {
  const app = createTestApp();
  let adminRole: Awaited<ReturnType<typeof seedAdminRoleWithInvitePermission>>;
  let targetRole: Awaited<ReturnType<typeof seedTestRole>>;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let adminSessionToken: string;
  let testClient: Awaited<ReturnType<typeof createTestClient>>;

  beforeEach(async () => {
    await cleanDatabase();
    adminRole = await seedAdminRoleWithInvitePermission();
    targetRole = await seedTestRole("invitee-role");
    adminUser = await createTestUser(adminRole.id);
    adminSessionToken = `session-${Date.now()}`;
    await createTestSession(adminUser.id, adminSessionToken);
    testClient = await createTestClient();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // Success cases
  // =========================================================================

  describe("Successful invitation creation", () => {
    it("should create invitation for employee", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("invitationId");
      expect(res.body).toHaveProperty("expiresAt");

      const invitation = await db.invitation.findFirst({
        where: { employeeId: employee.id },
      });
      expect(invitation).not.toBeNull();
      expect(invitation!.email).toBe(employee.email);
    });

    it("should create invitation for agent", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          agentId: agent.id,
        });

      expect(res.status).toBe(201);

      const invitation = await db.invitation.findFirst({
        where: { agentId: agent.id },
      });
      expect(invitation).not.toBeNull();
    });

    it("should create invitation for clientAdmin", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          clientAdminId: clientAdmin.id,
        });

      expect(res.status).toBe(201);

      const invitation = await db.invitation.findFirst({
        where: { clientAdminId: clientAdmin.id },
      });
      expect(invitation).not.toBeNull();
    });

    it("should create invitation for affiliate with profile email", async () => {
      const affiliate = await createTestAffiliate(testClient.id);

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          affiliateId: affiliate.id,
        });

      expect(res.status).toBe(201);

      const invitation = await db.invitation.findFirst({
        where: { affiliateId: affiliate.id },
      });
      expect(invitation).not.toBeNull();
      expect(invitation!.email).toBe(affiliate.email);
    });

    it("should allow email override for affiliate", async () => {
      const affiliate = await createTestAffiliate(testClient.id, { email: null });
      const overrideEmail = "override@example.com";

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          affiliateId: affiliate.id,
          email: overrideEmail,
        });

      expect(res.status).toBe(201);

      const invitation = await db.invitation.findFirst({
        where: { affiliateId: affiliate.id },
      });
      expect(invitation!.email).toBe(overrideEmail);
    });

    it("should upsert existing pending invitation", async () => {
      const employee = await createTestEmployee();

      // First invitation
      const res1 = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res1.status).toBe(201);
      const firstInvitationId = (res1.body as CreateInvitationBody).invitationId;

      // Second invitation (should update)
      const res2 = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res2.status).toBe(201);
      expect((res2.body as CreateInvitationBody).invitationId).toBe(firstInvitationId);

      // Should only have one invitation for this employee
      const invitations = await db.invitation.findMany({
        where: { employeeId: employee.id },
      });
      expect(invitations).toHaveLength(1);
    });
  });

  // =========================================================================
  // Authentication errors
  // =========================================================================

  describe("Authentication errors", () => {
    it("should return 401 without auth cookie", async () => {
      const employee = await createTestEmployee();

      const res = await request(app).post("/auth/invitations").send({
        roleId: targetRole.id,
        employeeId: employee.id,
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 without invite permission", async () => {
      // Create user with role without invite permission
      const regularRole = await seedTestRole("regular-user");
      const regularUser = await createTestUser(regularRole.id);
      const regularSessionToken = `session-regular-${Date.now()}`;
      await createTestSession(regularUser.id, regularSessionToken);

      const employee = await createTestEmployee();

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${regularSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // Validation errors
  // =========================================================================

  describe("Validation errors", () => {
    it("should return 400 when no profile ID provided", async () => {
      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send(invalidCreateInvitationPayloads.noProfileId);

      expect(res.status).toBe(400);
    });

    it("should return 400 when multiple profile IDs provided", async () => {
      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send(invalidCreateInvitationPayloads.multipleProfileIds);

      expect(res.status).toBe(400);
    });

    it("should return 404 when role not found", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: "non-existent-role-id",
          employeeId: employee.id,
        });

      expect(res.status).toBe(404);
    });

    it("should return 404 when profile not found", async () => {
      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: "non-existent-profile-id",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 when profile is inactive", async () => {
      const employee = await createTestEmployee({ isActive: false });

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.message).toContain("inactive");
    });

    it("should return 409 when profile already has user account", async () => {
      const existingUser = await createTestUser(targetRole.id);
      const employee = await createTestEmployee({ userId: existingUser.id });

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.message).toContain("already has a user account");
    });

    it("should return 409 when email already in use by another user", async () => {
      const existingEmail = "existing@example.com";
      await createTestUser(targetRole.id, { email: existingEmail });
      const employee = await createTestEmployee({ email: existingEmail });

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
        });

      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.message).toContain("Email already in use");
    });

    it("should return 400 when affiliate has no email and none provided", async () => {
      const affiliate = await createTestAffiliate(testClient.id, { email: null });

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          affiliateId: affiliate.id,
        });

      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.message).toContain("Email is required");
    });

    it("should return 400 when non-affiliate email doesn't match profile", async () => {
      const employee = await createTestEmployee({ email: "profile@example.com" });

      const res = await request(app)
        .post("/auth/invitations")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${adminSessionToken}`)
        .send({
          roleId: targetRole.id,
          employeeId: employee.id,
          email: "different@example.com",
        });

      expect(res.status).toBe(400);
      expect((res.body as ErrorBody).error.message).toContain("does not match");
    });
  });
});
