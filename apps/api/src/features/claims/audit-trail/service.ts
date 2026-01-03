import type { Prisma } from "@prisma/client";
import type {
  ClaimAuditTrailQuery,
  ClaimAuditTrailResponse,
  AuditLogItem,
  ClaimHistoryQuery,
  ClaimHistoryResponse,
  ClaimHistoryItem,
} from "shared";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import { compact, dateRange, inArray } from "../../../lib/filters.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface GetClaimAuditTrailParams {
  claimId: string;
  query: ClaimAuditTrailQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetClaimHistoryParams {
  claimId: string;
  query: ClaimHistoryQuery;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Mappers
// =============================================================================

type AuditLogData = NonNullable<
  Awaited<ReturnType<typeof repo.findAuditLogs>>
>[number];

function resolveUserName(user: AuditLogData["user"]): string | null {
  if (!user) return null;
  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

function mapAuditLogToResponse(log: AuditLogData): AuditLogItem {
  return {
    id: log.id,
    action: log.action,
    severity: log.severity,
    oldValue: log.oldValue ?? null,
    newValue: log.newValue ?? null,
    metadata: log.metadata ?? null,
    user: log.user
      ? { id: log.user.id, name: resolveUserName(log.user) ?? "Unknown" }
      : null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  };
}

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(
  claimId: string,
  query: ClaimAuditTrailQuery
): Prisma.AuditLogWhereInput {
  return compact({
    resource: "Claim",
    resourceId: claimId,
    action: inArray(query.action),
    severity: inArray(query.severity),
    userId: query.userId,
    createdAt: dateRange(query.from, query.to),
  }) as Prisma.AuditLogWhereInput;
}

// =============================================================================
// Get Claim Audit Trail
// =============================================================================

export async function getClaimAuditTrail(
  params: GetClaimAuditTrailParams
): Promise<ClaimAuditTrailResponse> {
  const { claimId, query, user, requestId } = params;
  const log = logger.child({ module: "claims/audit-trail", requestId });

  log.debug({ claimId, userId: user.id }, "get claim audit trail started");

  // 1. Validate claim exists
  const claim = await repo.findClaimById(claimId);
  if (!claim) {
    log.debug({ claimId }, "claim not found");
    throw AppError.notFound("Claim");
  }

  // 2. Build where clause
  const where = buildWhereClause(claimId, query);

  // 3. Fetch audit logs and count in parallel
  const [auditLogs, total] = await Promise.all([
    repo.findAuditLogs({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    repo.countAuditLogs(where),
  ]);

  log.debug(
    { claimId, count: auditLogs.length, total },
    "get claim audit trail completed"
  );

  return {
    data: auditLogs.map(mapAuditLogToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// ClaimHistory Mappers
// =============================================================================

type HistoryData = NonNullable<
  Awaited<ReturnType<typeof repo.findClaimHistory>>
>[number];

function resolveHistoryUserName(user: HistoryData["createdBy"]): string {
  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

function mapHistoryToResponse(history: HistoryData): ClaimHistoryItem {
  return {
    id: history.id,
    fromStatus: history.fromStatus,
    toStatus: history.toStatus,
    reason: history.reason,
    notes: history.notes,
    createdBy: {
      id: history.createdBy.id,
      name: resolveHistoryUserName(history.createdBy),
    },
    createdAt: history.createdAt.toISOString(),
  };
}

// =============================================================================
// Get Claim History
// =============================================================================

export async function getClaimHistory(
  params: GetClaimHistoryParams
): Promise<ClaimHistoryResponse> {
  const { claimId, query, user, requestId } = params;
  const log = logger.child({ module: "claims/history", requestId });

  log.debug({ claimId, userId: user.id }, "get claim history started");

  // 1. Validate claim exists
  const claim = await repo.findClaimById(claimId);
  if (!claim) {
    log.debug({ claimId }, "claim not found");
    throw AppError.notFound("Claim");
  }

  // 2. Fetch history and count in parallel
  const [history, total] = await Promise.all([
    repo.findClaimHistory({
      claimId,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    repo.countClaimHistory(claimId),
  ]);

  log.debug({ claimId, count: history.length, total }, "get claim history completed");

  return {
    data: history.map(mapHistoryToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
