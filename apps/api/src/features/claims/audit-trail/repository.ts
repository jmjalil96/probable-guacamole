import type { Prisma } from "@prisma/client";
import { db } from "../../../config/db.js";

// =============================================================================
// Include Constants
// =============================================================================

const userProfileSelect = {
  id: true,
  employee: { select: { firstName: true, lastName: true } },
  agent: { select: { firstName: true, lastName: true } },
  clientAdmin: { select: { firstName: true, lastName: true } },
  affiliate: { select: { firstName: true, lastName: true } },
} as const;

const auditLogInclude = {
  user: { select: userProfileSelect },
} as const;

// =============================================================================
// Types
// =============================================================================

export interface FindAuditLogsParams {
  where: Prisma.AuditLogWhereInput;
  skip: number;
  take: number;
}

// =============================================================================
// Claim Queries (for validation)
// =============================================================================

export async function findClaimById(id: string) {
  return db.claim.findUnique({
    where: { id },
    select: { id: true },
  });
}

// =============================================================================
// Audit Log Queries
// =============================================================================

export async function findAuditLogs(params: FindAuditLogsParams) {
  return db.auditLog.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: { createdAt: "desc" },
    include: auditLogInclude,
  });
}

export async function countAuditLogs(
  where: Prisma.AuditLogWhereInput
): Promise<number> {
  return db.auditLog.count({ where });
}

// =============================================================================
// ClaimHistory Queries
// =============================================================================

const historyInclude = {
  createdBy: { select: userProfileSelect },
} as const;

export interface FindHistoryParams {
  claimId: string;
  skip: number;
  take: number;
}

export async function findClaimHistory(params: FindHistoryParams) {
  return db.claimHistory.findMany({
    where: { claimId: params.claimId },
    skip: params.skip,
    take: params.take,
    orderBy: { createdAt: "desc" },
    include: historyInclude,
  });
}

export async function countClaimHistory(claimId: string): Promise<number> {
  return db.claimHistory.count({ where: { claimId } });
}
