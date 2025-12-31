import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import {
  createTestApp,
  expectSessionCookie,
} from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedTestRole,
  seedAdminRoleWithInvitePermission,
  createTestUser,
  createTestEmployee,
  createTestAgent,
  createTestClientAdmin,
  createTestAffiliate,
  createTestInvitation,
  createTestClient,
  VALID_PASSWORD,
  SHORT_PASSWORD,
} from "./fixtures.js";

interface ErrorBody {
  error: { message: string; code: string };
}

describe("POST /auth/invitations/accept - Accept Invitation", () => {
  const app = createTestApp();
  let adminRole: Awaited<ReturnType<typeof seedAdminRoleWithInvitePermission>>;
  let targetRole: Awaited<ReturnType<typeof seedTestRole>>;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let testClient: Awaited<ReturnType<typeof createTestClient>>;

  beforeEach(async () => {
    await cleanDatabase();
    adminRole = await seedAdminRoleWithInvitePermission();
    targetRole = await seedTestRole("invitee-role");
    adminUser = await createTestUser(adminRole.id);
    testClient = await createTestClient();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // Success cases
  // =========================================================================

  describe("Successful acceptance", () => {
    it("should accept invitation and create user for employee", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true });
      expectSessionCookie(res);

      // Verify user was created
      const user = await db.user.findUnique({
        where: { email: employee.email },
      });
      expect(user).not.toBeNull();
      expect(user!.roleId).toBe(targetRole.id);
      expect(user!.emailVerifiedAt).not.toBeNull();
      expect(user!.isActive).toBe(true);

      // Verify profile was linked
      const updatedEmployee = await db.employee.findUnique({
        where: { id: employee.id },
      });
      expect(updatedEmployee!.userId).toBe(user!.id);

      // Verify invitation was marked accepted
      const invitation = await db.invitation.findFirst({
        where: { employeeId: employee.id },
      });
      expect(invitation!.acceptedAt).not.toBeNull();

      // Verify session was created
      const sessions = await db.session.findMany({
        where: { userId: user!.id },
      });
      expect(sessions).toHaveLength(1);
    });

    it("should accept invitation for agent", async () => {
      const agent = await createTestAgent();
      const { token } = await createTestInvitation(
        "agent",
        agent.id,
        targetRole.id,
        adminUser.id,
        { email: agent.email }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expectSessionCookie(res);

      const updatedAgent = await db.agent.findUnique({
        where: { id: agent.id },
      });
      expect(updatedAgent!.userId).not.toBeNull();
    });

    it("should accept invitation for clientAdmin", async () => {
      const clientAdmin = await createTestClientAdmin();
      const { token } = await createTestInvitation(
        "clientAdmin",
        clientAdmin.id,
        targetRole.id,
        adminUser.id,
        { email: clientAdmin.email }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expectSessionCookie(res);

      const updatedClientAdmin = await db.clientAdmin.findUnique({
        where: { id: clientAdmin.id },
      });
      expect(updatedClientAdmin!.userId).not.toBeNull();
    });

    it("should accept invitation for affiliate", async () => {
      const affiliate = await createTestAffiliate(testClient.id);
      const { token } = await createTestInvitation(
        "affiliate",
        affiliate.id,
        targetRole.id,
        adminUser.id,
        { email: affiliate.email! }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expectSessionCookie(res);

      const updatedAffiliate = await db.affiliate.findUnique({
        where: { id: affiliate.id },
      });
      expect(updatedAffiliate!.userId).not.toBeNull();
    });
  });

  // =========================================================================
  // Validation errors
  // =========================================================================

  describe("Validation errors", () => {
    it("should return 400 for password too short", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: employee.email }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: SHORT_PASSWORD,
      });

      expect(res.status).toBe(400);
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app).post("/auth/invitations/accept").send({
        token: "invalid-token",
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(404);
      expect((res.body as ErrorBody).error.message).toBe("Invalid or expired invitation not found");
    });

    it("should return 404 for expired invitation", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        {
          email: employee.email,
          expiresAt: new Date(Date.now() - 1000),
        }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(404);
    });

    it("should return 404 for already accepted invitation", async () => {
      const employee = await createTestEmployee();
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        {
          email: employee.email,
          acceptedAt: new Date(),
        }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(404);
    });

    it("should return 409 when email already in use", async () => {
      const email = "taken@example.com";
      await createTestUser(targetRole.id, { email });

      const employee = await createTestEmployee({ email });
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.message).toContain("Email already in use");
    });

    it("should return 409 when profile already linked to user", async () => {
      const existingUser = await createTestUser(targetRole.id);
      const employee = await createTestEmployee({ userId: existingUser.id });

      // Create invitation manually (bypassing the normal flow which would catch this)
      const { token } = await createTestInvitation(
        "employee",
        employee.id,
        targetRole.id,
        adminUser.id,
        { email: "unique@example.com" }
      );

      const res = await request(app).post("/auth/invitations/accept").send({
        token,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(409);
      expect((res.body as ErrorBody).error.message).toContain("already has a user account");
    });
  });
});
