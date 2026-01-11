import type { ScopeType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithClientAdminsPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `client-admins-role-${Date.now()}`
) {
  const permissions = await Promise.all([
    db.permission.upsert({
      where: { resource_action: { resource: "clientAdmins", action: "read" } },
      update: {},
      create: { resource: "clientAdmins", action: "read" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clientAdmins", action: "create" } },
      update: {},
      create: { resource: "clientAdmins", action: "create" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clientAdmins", action: "edit" } },
      update: {},
      create: { resource: "clientAdmins", action: "edit" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clientAdmins", action: "delete" } },
      update: {},
      create: { resource: "clientAdmins", action: "delete" },
    }),
  ]);

  const role = await db.role.create({
    data: {
      name,
      displayName: "Client Admins Manager",
      description: "Role with all clientAdmins permissions",
      scopeType,
    },
  });

  await db.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: role.id,
      permissionId: p.id,
    })),
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
    where: { resource_action: { resource: "clientAdmins", action: "read" } },
    update: {},
    create: { resource: "clientAdmins", action: "read" },
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
// Employee Factory (for admin user setup)
// =============================================================================

export async function createTestEmployee(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Employee-${Date.now()}`,
    email = `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    userId = null,
  } = options;

  return db.employee.create({
    data: {
      firstName,
      lastName,
      email,
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
// Client Admin Client Assignment
// =============================================================================

export async function assignClientAdminClient(clientAdminId: string, clientId: string) {
  return db.clientAdminClient.create({
    data: {
      clientAdminId,
      clientId,
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
