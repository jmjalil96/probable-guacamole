import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export type ProfileType = "employee" | "agent" | "clientAdmin" | "affiliate";

export type ProfileIdField =
  | "employeeId"
  | "agentId"
  | "clientAdminId"
  | "affiliateId";

export interface ProfileInfo {
  type: ProfileType;
  id: string;
  idField: ProfileIdField;
}

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// =============================================================================
// Profile Queries
// =============================================================================

export async function findEmployeeById(id: string) {
  return db.employee.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      userId: true,
    },
  });
}

export async function findAgentById(id: string) {
  return db.agent.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      userId: true,
    },
  });
}

export async function findClientAdminById(id: string) {
  return db.clientAdmin.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      userId: true,
    },
  });
}

export async function findAffiliateById(id: string) {
  return db.affiliate.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      userId: true,
    },
  });
}

// Union of all profile types - email can be null for affiliates
export type ProfileRecord = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  userId: string | null;
};

// =============================================================================
// Role Queries
// =============================================================================

export async function findRoleById(id: string) {
  return db.role.findUnique({
    where: { id },
    select: { id: true, name: true, displayName: true },
  });
}

// =============================================================================
// User Queries
// =============================================================================

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
}

// =============================================================================
// Invitation Queries
// =============================================================================

export async function findInvitationByTokenHash(tokenHash: string) {
  return db.invitation.findUnique({
    where: { tokenHash },
    include: {
      role: { select: { id: true, name: true, displayName: true } },
    },
  });
}

export async function findInvitationById(id: string) {
  return db.invitation.findUnique({
    where: { id },
    include: {
      role: { select: { id: true, name: true, displayName: true } },
    },
  });
}

// =============================================================================
// Invitation Mutations
// =============================================================================

export interface UpsertInvitationData {
  tokenHash: string;
  email: string;
  roleId: string;
  expiresAt: Date;
  createdById: string;
  profileInfo: ProfileInfo;
}

export async function upsertInvitation(data: UpsertInvitationData) {
  const { tokenHash, email, roleId, expiresAt, createdById, profileInfo } =
    data;

  // Build where clause for upsert (unique profile ID field)
  const whereClause = { [profileInfo.idField]: profileInfo.id } as
    | { employeeId: string }
    | { agentId: string }
    | { clientAdminId: string }
    | { affiliateId: string };

  // Build create data with the profile ID field
  const createData: Prisma.InvitationCreateInput = {
    tokenHash,
    email: email.toLowerCase(),
    role: { connect: { id: roleId } },
    expiresAt,
    createdBy: { connect: { id: createdById } },
    [profileInfo.type]: { connect: { id: profileInfo.id } },
  };

  return db.invitation.upsert({
    where: whereClause,
    create: createData,
    update: {
      tokenHash,
      email: email.toLowerCase(),
      expiresAt,
      acceptedAt: null, // Reset if somehow accepted (shouldn't happen)
    },
  });
}

/**
 * Mark invitation as accepted. Uses conditional update for race safety.
 * Returns null if invitation was already accepted (concurrent request).
 */
export async function markInvitationAccepted(
  tx: TransactionClient,
  invitationId: string
): Promise<{ id: string } | null> {
  const result = await tx.invitation.updateMany({
    where: {
      id: invitationId,
      acceptedAt: null, // Only update if not already accepted
    },
    data: {
      acceptedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return { id: invitationId };
}

/**
 * Regenerate invitation token. Uses conditional update for race safety.
 * Returns null if invitation was accepted (concurrent request).
 */
export async function regenerateInvitationToken(
  invitationId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<{ id: string; email: string; roleId: string } | null> {
  const result = await db.invitation.updateMany({
    where: {
      id: invitationId,
      acceptedAt: null, // Only update if not accepted
    },
    data: {
      tokenHash,
      expiresAt,
    },
  });

  if (result.count === 0) {
    return null;
  }

  const updated = await db.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, email: true, roleId: true },
  });

  return updated;
}

// =============================================================================
// User Creation (Transactional)
// =============================================================================

export interface CreateUserData {
  email: string;
  passwordHash: string;
  roleId: string;
}

export async function createUser(tx: TransactionClient, data: CreateUserData) {
  return tx.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      roleId: data.roleId,
      emailVerifiedAt: new Date(), // Invitation proves email ownership
      isActive: true,
    },
  });
}

/**
 * Link profile to user. Uses conditional update for race safety.
 * Returns null if profile was already linked (concurrent request).
 */
export async function linkProfileToUser(
  tx: TransactionClient,
  profileInfo: ProfileInfo,
  userId: string
): Promise<{ id: string } | null> {
  const { type, id } = profileInfo;

  // Use updateMany with conditional where for race safety
  let result: { count: number };

  switch (type) {
    case "employee":
      result = await tx.employee.updateMany({
        where: { id, userId: null },
        data: { userId },
      });
      break;
    case "agent":
      result = await tx.agent.updateMany({
        where: { id, userId: null },
        data: { userId },
      });
      break;
    case "clientAdmin":
      result = await tx.clientAdmin.updateMany({
        where: { id, userId: null },
        data: { userId },
      });
      break;
    case "affiliate":
      result = await tx.affiliate.updateMany({
        where: { id, userId: null },
        data: { userId },
      });
      break;
  }

  if (result.count === 0) {
    return null;
  }

  return { id };
}

// =============================================================================
// Session Creation (Transactional)
// =============================================================================

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export async function createSession(
  tx: TransactionClient,
  data: CreateSessionData
) {
  return tx.session.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

// =============================================================================
// Full Transaction for Accept
// =============================================================================

export { db };
