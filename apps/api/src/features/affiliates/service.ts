import type { Prisma, ScopeType } from "@prisma/client";
import type { ListAffiliatesQuery, ListAffiliatesResponse, AffiliateDetail } from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import { resolveUserScope, scopeToAffiliateWhere } from "../../lib/scope.js";
import { contains, compact } from "../../lib/filters.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { ORDER_BY_MAP } from "./constants.js";
import { mapAffiliateToListItem, mapAffiliateToDetail } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListAffiliatesParams {
  query: ListAffiliatesQuery;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

export interface GetAffiliateParams {
  affiliateId: string;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(
  query: ListAffiliatesQuery,
  scopeWhere: Prisma.AffiliateWhereInput
): Prisma.AffiliateWhereInput {
  const filters = compact({
    clientId: query.clientId,
    isActive: query.isActive,
  });

  // Portal access filter
  const portalFilter = query.hasPortalAccess
    ? query.hasPortalAccess === "true"
      ? { userId: { not: null } }
      : query.hasPortalAccess === "false"
        ? { userId: null, invitation: null }
        : { userId: null, invitation: { isNot: null } } // pending
    : undefined;

  // Search across name, document, email
  const search = query.search
    ? {
        OR: [
          { firstName: contains(query.search) },
          { lastName: contains(query.search) },
          { documentNumber: contains(query.search) },
          { email: contains(query.search) },
        ],
      }
    : undefined;

  const conditions = [scopeWhere, filters, portalFilter, search].filter(
    (c): c is Prisma.AffiliateWhereInput =>
      c !== undefined && Object.keys(c).length > 0
  );

  return conditions.length > 1 ? { AND: conditions } : conditions[0] ?? {};
}

// =============================================================================
// List Affiliates
// =============================================================================

export async function listAffiliates(
  params: ListAffiliatesParams
): Promise<ListAffiliatesResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "affiliates", requestId });

  log.debug({ userId: user.id, scope: user.role.scopeType }, "list affiliates started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);
  const where = buildWhereClause(query, scopeToAffiliateWhere(scope));
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "lastName"]: query.sortOrder },
    { firstName: query.sortOrder },
    { id: "asc" as const },
  ];

  const [affiliates, total] = await Promise.all([
    repo.findPrimaryAffiliates({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countPrimaryAffiliates(where),
  ]);

  log.debug({ count: affiliates.length, total }, "list affiliates completed");

  return {
    data: affiliates.map(mapAffiliateToListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Affiliate
// =============================================================================

export async function getAffiliate(
  params: GetAffiliateParams,
  context: audit.AuditContext
): Promise<AffiliateDetail> {
  const { affiliateId, user, requestId } = params;
  const log = logger.child({ module: "affiliates", requestId });

  log.debug({ affiliateId, userId: user.id }, "get affiliate started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);
  const affiliate = await repo.findAffiliateById(affiliateId, scopeToAffiliateWhere(scope));

  if (!affiliate) {
    log.debug({ affiliateId, scope: scope.type }, "affiliate not found");
    throw AppError.notFound("Affiliate");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Affiliate",
      resourceId: affiliate.id,
    },
    context
  );

  log.debug({ affiliateId }, "get affiliate completed");

  return mapAffiliateToDetail(affiliate);
}
