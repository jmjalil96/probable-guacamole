import type { Logger } from "pino";
import { Prisma } from "@prisma/client";
import type { ScopeType } from "@prisma/client";
import type {
  ListClaimsQuery,
  ListClaimsResponse,
  ClaimDetail,
  CreateClaimRequest,
  UpdateClaimRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import { validateScopeForCreate } from "../../lib/scope.js";
import * as storage from "../../services/storage/service.js";
import {
  contains,
  dateRange,
  inArray,
  nameContains,
  compact,
} from "../../lib/filters.js";
import { resolveUserScope, scopeToClaimWhere } from "../../lib/scope.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import {
  ORDER_BY_MAP,
  getClaimEditableFields,
  type ClaimEditableField,
} from "./constants.js";
import { mapClaimToListItem, mapClaimToDetail } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListClaimsParams {
  query: ListClaimsQuery;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

export interface GetClaimParams {
  claimId: string;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(
  query: ListClaimsQuery,
  scopeWhere: Prisma.ClaimWhereInput
): Prisma.ClaimWhereInput {
  const searchNum = query.search ? parseInt(query.search, 10) : NaN;

  const filters = compact({
    status: inArray(query.status),
    careType: query.careType,
    client: query.clientName ? { name: contains(query.clientName) } : undefined,
    affiliate: nameContains(query.affiliateName),
    patient: nameContains(query.patientName),
    submittedDate: dateRange(query.submittedDateFrom, query.submittedDateTo),
    incidentDate: dateRange(query.incidentDateFrom, query.incidentDateTo),
  });

  const search = query.search
    ? {
        OR: [
          ...(Number.isInteger(searchNum) ? [{ claimNumber: searchNum }] : []),
          { affiliate: { firstName: contains(query.search) } },
          { affiliate: { lastName: contains(query.search) } },
          { patient: { firstName: contains(query.search) } },
          { patient: { lastName: contains(query.search) } },
        ],
      }
    : undefined;

  const conditions = [scopeWhere, filters, search].filter(
    (c): c is Prisma.ClaimWhereInput =>
      c !== undefined && Object.keys(c).length > 0
  );

  return conditions.length > 1 ? { AND: conditions } : conditions[0] ?? {};
}

// =============================================================================
// Service Function
// =============================================================================

export async function listClaims(
  params: ListClaimsParams
): Promise<ListClaimsResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "claims", requestId });

  log.debug({ userId: user.id, scope: user.role.scopeType }, "list claims started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);
  const where = buildWhereClause(query, scopeToClaimWhere(scope));
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "createdAt"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [claims, total] = await Promise.all([
    repo.findClaims({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countClaims(where),
  ]);

  log.debug({ count: claims.length, total }, "list claims completed");

  return {
    data: claims.map(mapClaimToListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Claim
// =============================================================================

export async function getClaim(
  params: GetClaimParams,
  context: audit.AuditContext
): Promise<ClaimDetail> {
  const { claimId, user, requestId } = params;
  const log = logger.child({ module: "claims", requestId });

  log.debug({ claimId, userId: user.id }, "get claim started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);
  const claim = await repo.findClaimById(claimId, scopeToClaimWhere(scope));

  if (!claim) {
    log.debug({ claimId, scope: scope.type }, "claim not found");
    throw AppError.notFound("Claim");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Claim",
      resourceId: claim.id,
    },
    context
  );

  log.debug({ claimId }, "get claim completed");

  return mapClaimToDetail(claim);
}

// =============================================================================
// Create Claim
// =============================================================================

export interface CreateClaimParams {
  request: CreateClaimRequest;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

export interface CreateClaimResult {
  id: string;
  claimNumber: number;
  fileAttachmentErrors?: FileAttachmentError[];
}

interface FileAttachmentError {
  fileId: string;
  error: string;
}

async function migrateClaimFiles(
  claimId: string,
  pendingUploadIds: string[],
  userId: string,
  log: Logger
): Promise<FileAttachmentError[]> {
  const errors: FileAttachmentError[] = [];

  for (const pendingUploadId of pendingUploadIds) {
    try {
      await storage.migrateToEntity(
        pendingUploadId,
        { entityType: "Claim", entityId: claimId },
        userId
      );
      log.debug({ pendingUploadId, claimId }, "file migrated to claim");
    } catch (err) {
      errors.push({ fileId: pendingUploadId, error: "File attachment failed" });
      log.warn({ err, pendingUploadId, claimId }, "failed to migrate file");
    }
  }

  return errors;
}

export async function createClaim(
  params: CreateClaimParams,
  context: audit.AuditContext
): Promise<CreateClaimResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "claims", requestId });

  log.debug(
    { clientId: request.clientId, userId: user.id },
    "create claim started"
  );

  // 1. Resolve user scope and validate access
  const scope = await resolveUserScope(user.id, user.role.scopeType);
  validateScopeForCreate(scope, {
    clientId: request.clientId,
    affiliateId: request.affiliateId,
  });

  // 2. Fetch and validate affiliate belongs to client
  const affiliate = await repo.findAffiliateById(request.affiliateId);
  if (!affiliate) {
    log.debug({ affiliateId: request.affiliateId }, "affiliate not found");
    throw AppError.notFound("Affiliate");
  }
  if (affiliate.clientId !== request.clientId) {
    log.debug(
      { affiliateId: request.affiliateId, clientId: request.clientId },
      "affiliate does not belong to client"
    );
    throw AppError.badRequest("Affiliate does not belong to client");
  }

  // 3. Fetch and validate patient belongs to affiliate
  const patient = await repo.findAffiliateById(request.patientId);
  if (!patient) {
    log.debug({ patientId: request.patientId }, "patient not found");
    throw AppError.notFound("Patient");
  }
  if (patient.id !== affiliate.id && patient.primaryAffiliateId !== affiliate.id) {
    log.debug(
      { patientId: request.patientId, affiliateId: request.affiliateId },
      "patient is not affiliate or dependent"
    );
    throw AppError.badRequest(
      "Patient must be affiliate or dependent of affiliate"
    );
  }
  if (patient.clientId !== request.clientId) {
    log.debug(
      { patientId: request.patientId, clientId: request.clientId },
      "patient does not belong to client"
    );
    throw AppError.badRequest("Patient does not belong to client");
  }

  // 4. Create claim with history (transactional)
  const claim = await repo.createClaimWithHistory(
    {
      clientId: request.clientId,
      affiliateId: request.affiliateId,
      patientId: request.patientId,
      description: request.description,
      createdById: user.id,
    },
    {
      toStatus: "DRAFT",
      createdById: user.id,
    }
  );

  log.info({ claimId: claim.id, claimNumber: claim.claimNumber }, "claim created");

  // 5. Migrate pending uploads (if any) - outside transaction
  let fileAttachmentErrors: FileAttachmentError[] | undefined;
  if (request.pendingUploadIds?.length) {
    const errors = await migrateClaimFiles(claim.id, request.pendingUploadIds, user.id, log);
    if (errors.length > 0) {
      fileAttachmentErrors = errors;
      log.warn({ claimId: claim.id, errorCount: errors.length }, "some files failed to attach");
    }
  }

  // 6. Audit log
  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Claim",
      resourceId: claim.id,
      metadata: {
        claimNumber: claim.claimNumber,
        clientId: request.clientId,
        affiliateId: request.affiliateId,
        patientId: request.patientId,
        fileCount: request.pendingUploadIds?.length ?? 0,
        fileAttachmentErrorCount: fileAttachmentErrors?.length ?? 0,
      },
    },
    context
  );

  log.debug({ claimId: claim.id }, "create claim completed");

  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    ...(fileAttachmentErrors && { fileAttachmentErrors }),
  };
}

// =============================================================================
// Update Claim
// =============================================================================

export interface UpdateClaimParams {
  claimId: string;
  updates: UpdateClaimRequest;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

function buildUpdateData(
  updates: UpdateClaimRequest,
  userId: string
): Prisma.ClaimUpdateInput {
  return {
    updatedBy: { connect: { id: userId } },
    ...(updates.policyId !== undefined && {
      policy: updates.policyId ? { connect: { id: updates.policyId } } : { disconnect: true },
    }),
    ...(updates.description !== undefined && {
      description: updates.description,
    }),
    ...(updates.careType !== undefined && { careType: updates.careType }),
    ...(updates.diagnosis !== undefined && { diagnosis: updates.diagnosis }),
    ...(updates.incidentDate !== undefined && {
      incidentDate: updates.incidentDate ? new Date(updates.incidentDate) : null,
    }),
    ...(updates.amountSubmitted !== undefined && {
      amountSubmitted: updates.amountSubmitted ?? null,
    }),
    ...(updates.submittedDate !== undefined && {
      submittedDate: updates.submittedDate
        ? new Date(updates.submittedDate)
        : null,
    }),
    ...(updates.amountApproved !== undefined && {
      amountApproved: updates.amountApproved ?? null,
    }),
    ...(updates.amountDenied !== undefined && {
      amountDenied: updates.amountDenied ?? null,
    }),
    ...(updates.amountUnprocessed !== undefined && {
      amountUnprocessed: updates.amountUnprocessed ?? null,
    }),
    ...(updates.deductibleApplied !== undefined && {
      deductibleApplied: updates.deductibleApplied ?? null,
    }),
    ...(updates.copayApplied !== undefined && {
      copayApplied: updates.copayApplied ?? null,
    }),
    ...(updates.settlementDate !== undefined && {
      settlementDate: updates.settlementDate
        ? new Date(updates.settlementDate)
        : null,
    }),
    ...(updates.settlementNumber !== undefined && {
      settlementNumber: updates.settlementNumber,
    }),
    ...(updates.settlementNotes !== undefined && {
      settlementNotes: updates.settlementNotes,
    }),
  };
}

function extractChangedFields(
  claim: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in claim) {
      const value = claim[field];
      // Convert Date to strings for audit log
      // Decimal-like values have a toFixed method
      if (value instanceof Date) {
        result[field] = value.toISOString();
      } else if (Prisma.Decimal.isDecimal(value)) {
        result[field] = value.toString();
      } else {
        result[field] = value;
      }
    }
  }
  return result;
}

export async function updateClaim(
  params: UpdateClaimParams,
  context: audit.AuditContext
): Promise<ClaimDetail> {
  const { claimId, updates, user, requestId } = params;
  const log = logger.child({ module: "claims", requestId });

  log.debug({ claimId, userId: user.id }, "update claim started");

  // 1. Fetch claim (no scope filter - already enforced by requireScope middleware)
  const claim = await repo.findClaimById(claimId);
  if (!claim) {
    log.debug({ claimId }, "claim not found");
    throw AppError.notFound("Claim");
  }

  // 2. Validate editable fields for current status
  const editableFields = getClaimEditableFields(claim.status);
  const requestedFields = Object.keys(updates).filter(
    (key) => updates[key as keyof UpdateClaimRequest] !== undefined
  );

  const nonEditableFields = requestedFields.filter(
    (field) => !editableFields.includes(field as ClaimEditableField)
  );

  if (nonEditableFields.length > 0) {
    log.debug(
      { claimId, status: claim.status, nonEditableFields },
      "non-editable fields in request"
    );
    throw AppError.badRequest(
      `Fields not editable in ${claim.status} status: ${nonEditableFields.join(", ")}`
    );
  }

  // 3. Check for empty update
  if (requestedFields.length === 0) {
    log.debug({ claimId }, "no fields to update");
    return mapClaimToDetail(claim);
  }

  // 4. Build update data (convert string dates/decimals to proper types)
  const updateData = buildUpdateData(updates, user.id);

  // 5. Update claim
  const updatedClaim = await repo.updateClaim(claimId, updateData);

  log.info({ claimId, fields: requestedFields }, "claim updated");

  // 6. Audit log
  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Claim",
      resourceId: claimId,
      oldValue: extractChangedFields(
        claim as unknown as Record<string, unknown>,
        requestedFields
      ),
      newValue: extractChangedFields(
        updatedClaim as unknown as Record<string, unknown>,
        requestedFields
      ),
      metadata: { updatedFields: requestedFields },
    },
    context
  );

  log.debug({ claimId }, "update claim completed");

  return mapClaimToDetail(updatedClaim);
}
