import type { ScopeType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithEmployeesPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `employees-role-${Date.now()}`
) {
  const permissions = await Promise.all([
    db.permission.upsert({
      where: { resource_action: { resource: "employees", action: "read" } },
      update: {},
      create: { resource: "employees", action: "read" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "employees", action: "create" } },
      update: {},
      create: { resource: "employees", action: "create" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "employees", action: "edit" } },
      update: {},
      create: { resource: "employees", action: "edit" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "employees", action: "delete" } },
      update: {},
      create: { resource: "employees", action: "delete" },
    }),
  ]);

  const role = await db.role.create({
    data: {
      name,
      displayName: "Employees Manager",
      description: "Role with all employees permissions",
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
    where: { resource_action: { resource: "employees", action: "read" } },
    update: {},
    create: { resource: "employees", action: "read" },
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
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
