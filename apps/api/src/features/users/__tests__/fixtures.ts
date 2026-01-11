import type { ScopeType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithUsersPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `users-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "users", action: "read" } },
    update: {},
    create: { resource: "users", action: "read" },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Users Reader",
      description: "Role with users:read permission",
      scopeType,
    },
  });

  await db.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  return role;
}

export async function seedRoleWithoutPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `no-perm-role-${Date.now()}`
) {
  return db.role.create({
    data: {
      name,
      displayName: "No Permission Role",
      description: "Role without any permissions",
      scopeType,
    },
  });
}

export async function seedRoleWithNonUnlimitedScope(
  scopeType: "CLIENT" | "SELF",
  name = `non-unlimited-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "users", action: "read" } },
    update: {},
    create: { resource: "users", action: "read" },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: `${scopeType} Scope Role`,
      description: `Role with ${scopeType} scope`,
      scopeType,
    },
  });

  await db.rolePermission.create({
    data: {
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
    isActive?: boolean;
    emailVerifiedAt?: Date | null;
  } = {}
) {
  const {
    email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    emailVerifiedAt = new Date(),
  } = options;

  return db.user.create({
    data: {
      email,
      passwordHash: "hashed-password",
      roleId,
      isActive,
      emailVerifiedAt,
    },
    include: {
      role: true,
    },
  });
}

// =============================================================================
// Session Factory
// =============================================================================

export async function createTestSession(
  userId: string,
  options: {
    token?: string;
    expiresAt?: Date;
    revokedAt?: Date | null;
  } = {}
) {
  const token =
    options.token ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tokenHash = hashToken(token);
  const expiresAt = options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const revokedAt = options.revokedAt ?? null;

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      revokedAt,
    },
  });

  return { token };
}

// =============================================================================
// Employee Factory
// =============================================================================

export async function createTestEmployee(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  department?: string | null;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Employee-${Date.now()}`,
    email = `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    phone = null,
    department = null,
    isActive = true,
    userId = null,
  } = options;

  return db.employee.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      department,
      isActive,
      userId,
    },
  });
}

// =============================================================================
// Agent Factory
// =============================================================================

export async function createTestAgent(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  licenseNumber?: string | null;
  agencyName?: string | null;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Agent-${Date.now()}`,
    email = `agent-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    phone = null,
    licenseNumber = null,
    agencyName = null,
    isActive = true,
    userId = null,
  } = options;

  return db.agent.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      agencyName,
      isActive,
      userId,
    },
  });
}

// =============================================================================
// Client Admin Factory
// =============================================================================

export async function createTestClientAdmin(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `ClientAdmin-${Date.now()}`,
    email = `clientadmin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    phone = null,
    jobTitle = null,
    isActive = true,
    userId = null,
  } = options;

  return db.clientAdmin.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      isActive,
      userId,
    },
  });
}

// =============================================================================
// Client Factory
// =============================================================================

export async function createTestClient(options: {
  name?: string;
  isActive?: boolean;
} = {}) {
  const {
    name = `Client-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    isActive = true,
  } = options;

  return db.client.create({
    data: {
      name,
      isActive,
    },
  });
}

// =============================================================================
// Affiliate Factory
// =============================================================================

export async function createTestAffiliate(clientId: string, options: {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  documentType?: "CC" | "CE" | "TI" | "PP" | "RC" | "NIT";
  documentNumber?: string;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Affiliate-${Date.now()}`,
    email = `affiliate-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    documentType = "CC",
    documentNumber = `DOC-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    isActive = true,
    userId = null,
  } = options;

  return db.affiliate.create({
    data: {
      clientId,
      firstName,
      lastName,
      email,
      documentType,
      documentNumber,
      isActive,
      userId,
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
