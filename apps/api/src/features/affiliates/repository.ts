import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindAffiliatesParams {
  where: Prisma.AffiliateWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.AffiliateOrderByWithRelationInput | Prisma.AffiliateOrderByWithRelationInput[];
}

// =============================================================================
// Queries
// =============================================================================

export async function findPrimaryAffiliates(params: FindAffiliatesParams) {
  return db.affiliate.findMany({
    where: {
      ...params.where,
      primaryAffiliateId: null,
    },
    include: {
      client: { select: { id: true, name: true } },
      user: { select: { id: true } },
      invitation: { select: { id: true, acceptedAt: true } },
      dependents: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentType: true,
          documentNumber: true,
          relationship: true,
          isActive: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      _count: { select: { dependents: true } },
    },
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
  });
}

export async function countPrimaryAffiliates(where: Prisma.AffiliateWhereInput): Promise<number> {
  return db.affiliate.count({
    where: {
      ...where,
      primaryAffiliateId: null,
    },
  });
}

export async function findAffiliateById(
  id: string,
  scopeWhere: Prisma.AffiliateWhereInput = {}
) {
  return db.affiliate.findFirst({
    where: { AND: [{ id }, scopeWhere] },
    include: {
      client: { select: { id: true, name: true } },
      user: { select: { id: true } },
      invitation: { select: { id: true, acceptedAt: true } },
      dependents: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentType: true,
          documentNumber: true,
          relationship: true,
          isActive: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      _count: { select: { dependents: true } },
      primaryAffiliate: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}
