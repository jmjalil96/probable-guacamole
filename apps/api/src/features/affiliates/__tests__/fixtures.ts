import type { ScopeType, DependentRelationship } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithAffiliatesPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `affiliates-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "affiliates", action: "read" } },
    update: {},
    create: { resource: "affiliates", action: "read" },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Affiliates Reader",
      description: "Role with affiliates read permission",
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
    where: { resource_action: { resource: "affiliates", action: "read" } },
    update: {},
    create: { resource: "affiliates", action: "read" },
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
// Affiliate Factory
// =============================================================================

export async function createTestAffiliate(
  clientId: string,
  options: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    documentType?: "CPF" | "CNPJ";
    documentNumber?: string | null;
    relationship?: DependentRelationship | null;
    isActive?: boolean;
    userId?: string | null;
    primaryAffiliateId?: string | null;
  } = {}
) {
  const {
    firstName = "Test",
    lastName = `Affiliate-${Date.now()}`,
    email = `affiliate-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    phone = null,
    documentType = "CPF",
    documentNumber = null,
    relationship = null,
    isActive = true,
    userId = null,
    primaryAffiliateId = null,
  } = options;

  return db.affiliate.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      documentType,
      documentNumber,
      relationship,
      isActive,
      userId,
      primaryAffiliateId,
      clientId,
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
