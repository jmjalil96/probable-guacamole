import type { ScopeType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithAgentsPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `agents-role-${Date.now()}`
) {
  const permissions = await Promise.all([
    db.permission.upsert({
      where: { resource_action: { resource: "agents", action: "read" } },
      update: {},
      create: { resource: "agents", action: "read" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "agents", action: "create" } },
      update: {},
      create: { resource: "agents", action: "create" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "agents", action: "edit" } },
      update: {},
      create: { resource: "agents", action: "edit" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "agents", action: "delete" } },
      update: {},
      create: { resource: "agents", action: "delete" },
    }),
  ]);

  const role = await db.role.create({
    data: {
      name,
      displayName: "Agents Manager",
      description: "Role with all agents permissions",
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
    where: { resource_action: { resource: "agents", action: "read" } },
    update: {},
    create: { resource: "agents", action: "read" },
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
// Agent Client Assignment
// =============================================================================

export async function assignAgentClient(agentId: string, clientId: string) {
  return db.agentClient.create({
    data: {
      agentId,
      clientId,
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
