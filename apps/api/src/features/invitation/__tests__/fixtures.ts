import { db } from "../../../config/db.js";
import { hashPassword } from "../../auth/utils.js";
import { hashToken } from "../utils.js";

export const TEST_PASSWORD = "TestPassword123!";
export const VALID_PASSWORD = "ValidPassword123";
export const SHORT_PASSWORD = "short";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedTestRole(name = "test-role") {
  return db.role.upsert({
    where: { name },
    update: {},
    create: {
      name,
      displayName: "Test Role",
      description: "Role for tests",
      scopeType: "SELF",
    },
  });
}

export async function seedAdminRoleWithInvitePermission() {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "users", action: "invite" } },
    update: {},
    create: {
      resource: "users",
      action: "invite",
    },
  });

  const role = await db.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Administrator",
      description: "Admin role with invite permission",
      scopeType: "UNLIMITED",
    },
  });

  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    update: {},
    create: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  return role;
}

// =============================================================================
// User Factories
// =============================================================================

export async function createTestUser(
  roleId: string,
  options: {
    email?: string;
    password?: string;
    emailVerifiedAt?: Date | null;
    isActive?: boolean;
  } = {}
) {
  const {
    email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password = TEST_PASSWORD,
    emailVerifiedAt = new Date(),
    isActive = true,
  } = options;

  const passwordHash = await hashPassword(password);

  return db.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      emailVerifiedAt,
      isActive,
    },
  });
}

// =============================================================================
// Client Factory (for Affiliates)
// =============================================================================

export async function createTestClient(name = "Test Client") {
  return db.client.create({
    data: {
      name,
      isActive: true,
    },
  });
}

// =============================================================================
// Profile Factories
// =============================================================================

interface ProfileOptions {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  userId?: string | null;
}

export async function createTestEmployee(options: ProfileOptions = {}) {
  const {
    email = `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    firstName = "Test",
    lastName = "Employee",
    isActive = true,
    userId = null,
  } = options;

  return db.employee.create({
    data: {
      email,
      firstName,
      lastName,
      isActive,
      userId,
    },
  });
}

export async function createTestAgent(options: ProfileOptions = {}) {
  const {
    email = `agent-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    firstName = "Test",
    lastName = "Agent",
    isActive = true,
    userId = null,
  } = options;

  return db.agent.create({
    data: {
      email,
      firstName,
      lastName,
      isActive,
      userId,
    },
  });
}

export async function createTestClientAdmin(options: ProfileOptions = {}) {
  const {
    email = `clientadmin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    firstName = "Test",
    lastName = "ClientAdmin",
    isActive = true,
    userId = null,
  } = options;

  return db.clientAdmin.create({
    data: {
      email,
      firstName,
      lastName,
      isActive,
      userId,
    },
  });
}

export async function createTestAffiliate(
  clientId: string,
  options: Omit<ProfileOptions, "email"> & { email?: string | null } = {}
) {
  const {
    email = `affiliate-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    firstName = "Test",
    lastName = "Affiliate",
    isActive = true,
    userId = null,
  } = options;

  return db.affiliate.create({
    data: {
      email,
      firstName,
      lastName,
      isActive,
      userId,
      clientId,
    },
  });
}

// =============================================================================
// Invitation Factory
// =============================================================================

interface InvitationOptions {
  token?: string;
  email?: string;
  expiresAt?: Date;
  acceptedAt?: Date | null;
}

export async function createTestInvitation(
  profileType: "employee" | "agent" | "clientAdmin" | "affiliate",
  profileId: string,
  roleId: string,
  createdById: string,
  options: InvitationOptions = {}
) {
  const token = options.token ?? `test-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tokenHash = hashToken(token);
  const {
    email = "invite@example.com",
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt = null,
  } = options;

  const profileData = {
    employee: { employeeId: profileId },
    agent: { agentId: profileId },
    clientAdmin: { clientAdminId: profileId },
    affiliate: { affiliateId: profileId },
  }[profileType];

  const invitation = await db.invitation.create({
    data: {
      tokenHash,
      email,
      roleId,
      expiresAt,
      acceptedAt,
      createdById,
      ...profileData,
    },
  });

  return { invitation, token };
}

// =============================================================================
// Session Factory
// =============================================================================

export async function createTestSession(userId: string, token: string) {
  const tokenHash = hashToken(token);

  return db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

// =============================================================================
// Test Payloads
// =============================================================================

export const invalidCreateInvitationPayloads = {
  noProfileId: { roleId: "some-role-id" },
  multipleProfileIds: {
    roleId: "some-role-id",
    employeeId: "emp-1",
    agentId: "agent-1",
  },
  invalidEmail: {
    roleId: "some-role-id",
    employeeId: "emp-1",
    email: "not-an-email",
  },
};

export const invalidAcceptPayloads = {
  noToken: { password: VALID_PASSWORD },
  noPassword: { token: "some-token" },
  shortPassword: { token: "some-token", password: SHORT_PASSWORD },
};
