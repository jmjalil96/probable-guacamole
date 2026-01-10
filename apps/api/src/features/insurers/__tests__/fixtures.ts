import type { ScopeType, InsurerType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithInsurersPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `insurers-role-${Date.now()}`
) {
  // Create all insurer permissions
  const permissions = await Promise.all([
    db.permission.upsert({
      where: { resource_action: { resource: "insurers", action: "read" } },
      update: {},
      create: { resource: "insurers", action: "read" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "insurers", action: "create" } },
      update: {},
      create: { resource: "insurers", action: "create" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "insurers", action: "edit" } },
      update: {},
      create: { resource: "insurers", action: "edit" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "insurers", action: "delete" } },
      update: {},
      create: { resource: "insurers", action: "delete" },
    }),
  ]);

  const role = await db.role.create({
    data: {
      name,
      displayName: "Insurers Manager",
      description: "Role with all insurers permissions",
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
  // Create insurers:read permission
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "insurers", action: "read" } },
    update: {},
    create: { resource: "insurers", action: "read" },
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
// Insurer Factory
// =============================================================================

export interface CreateInsurerOptions {
  name?: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  type?: InsurerType;
  isActive?: boolean;
}

export async function createTestInsurer(options: CreateInsurerOptions = {}) {
  const {
    name = `Insurer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    code = null,
    email = null,
    phone = null,
    website = null,
    type = "MEDICINA_PREPAGADA",
    isActive = true,
  } = options;

  return db.insurer.create({
    data: {
      name,
      code,
      email,
      phone,
      website,
      type,
      isActive,
    },
  });
}

// =============================================================================
// Client Factory
// =============================================================================

export async function createTestClient(name = `Client-${Date.now()}`) {
  return db.client.create({
    data: {
      name,
      isActive: true,
    },
  });
}

// =============================================================================
// Policy Factory (for testing delete constraint)
// =============================================================================

export async function createTestPolicy(
  insurerId: string,
  clientId: string,
  options: {
    policyNumber?: string;
    status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    policyNumber = `POL-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status = "ACTIVE",
    startDate = new Date(),
    endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  } = options;

  return db.policy.create({
    data: {
      policyNumber,
      insurerId,
      clientId,
      status,
      startDate,
      endDate,
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
