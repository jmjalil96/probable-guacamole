import type { ScopeType, InsurerType } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithClientsPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `clients-role-${Date.now()}`
) {
  // Create all client permissions
  const permissions = await Promise.all([
    db.permission.upsert({
      where: { resource_action: { resource: "clients", action: "read" } },
      update: {},
      create: { resource: "clients", action: "read" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clients", action: "create" } },
      update: {},
      create: { resource: "clients", action: "create" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clients", action: "edit" } },
      update: {},
      create: { resource: "clients", action: "edit" },
    }),
    db.permission.upsert({
      where: { resource_action: { resource: "clients", action: "delete" } },
      update: {},
      create: { resource: "clients", action: "delete" },
    }),
  ]);

  const role = await db.role.create({
    data: {
      name,
      displayName: "Clients Manager",
      description: "Role with all clients permissions",
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
  // Create clients:read permission
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "clients", action: "read" } },
    update: {},
    create: { resource: "clients", action: "read" },
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
// Client Factory
// =============================================================================

export interface CreateClientOptions {
  name?: string;
  isActive?: boolean;
}

export async function createTestClient(options: CreateClientOptions = {}) {
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
// Insurer Factory (for policy constraint tests)
// =============================================================================

export async function createTestInsurer(options: {
  name?: string;
  type?: InsurerType;
} = {}) {
  const {
    name = `Insurer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type = "MEDICINA_PREPAGADA",
  } = options;

  return db.insurer.create({
    data: {
      name,
      type,
      isActive: true,
    },
  });
}

// =============================================================================
// Affiliate Factory (for delete constraint tests)
// =============================================================================

export async function createTestAffiliate(clientId: string, options: {
  firstName?: string;
  lastName?: string;
  documentType?: "CC" | "CE" | "TI" | "PP" | "RC" | "NIT";
  documentNumber?: string;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Affiliate-${Date.now()}`,
    documentType = "CC",
    documentNumber = `DOC-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } = options;

  return db.affiliate.create({
    data: {
      clientId,
      firstName,
      lastName,
      documentType,
      documentNumber,
    },
  });
}

// =============================================================================
// Claim Factory (for delete constraint tests)
// =============================================================================

export async function createTestClaim(clientId: string, userId: string, options: {
  claimNumber?: number;
  status?: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "PENDING_INFO" | "RETURNED" | "CANCELLED" | "SETTLED";
  description?: string;
} = {}) {
  const {
    claimNumber = Math.floor(Math.random() * 2000000000),
    status = "DRAFT",
    description = "Test claim description",
  } = options;

  // Create an affiliate first as it's required for claims
  const affiliate = await createTestAffiliate(clientId);

  return db.claim.create({
    data: {
      claimNumber,
      client: { connect: { id: clientId } },
      status,
      description,
      affiliate: { connect: { id: affiliate.id } },
      patient: { connect: { id: affiliate.id } },
      createdBy: { connect: { id: userId } },
    },
  });
}

// =============================================================================
// Policy Factory (for delete constraint tests)
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
