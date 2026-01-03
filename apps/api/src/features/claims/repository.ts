import type { ClaimStatus, Prisma, PrismaClient } from "@prisma/client";
import { db } from "../../config/db.js";

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// =============================================================================
// Types
// =============================================================================

export interface FindClaimsParams {
  where: Prisma.ClaimWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.ClaimOrderByWithRelationInput | Prisma.ClaimOrderByWithRelationInput[];
}

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

const claimListInclude = {
  patient: { select: { id: true, firstName: true, lastName: true } },
  affiliate: { select: { id: true, firstName: true, lastName: true } },
  client: { select: { id: true, name: true } },
  policy: { select: { id: true, policyNumber: true } },
  createdBy: { select: userProfileSelect },
  updatedBy: { select: userProfileSelect },
} as const;

const claimDetailInclude = {
  patient: { select: { id: true, firstName: true, lastName: true } },
  affiliate: { select: { id: true, firstName: true, lastName: true } },
  client: { select: { id: true, name: true } },
  policy: { select: { id: true, policyNumber: true } },
  createdBy: { select: userProfileSelect },
  updatedBy: { select: userProfileSelect },
} as const;

// =============================================================================
// Claim Queries
// =============================================================================

export async function findClaims(params: FindClaimsParams) {
  return db.claim.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
    include: claimListInclude,
  });
}

export async function countClaims(where: Prisma.ClaimWhereInput): Promise<number> {
  return db.claim.count({ where });
}

export async function findClaimById(
  id: string,
  scopeWhere: Prisma.ClaimWhereInput = {}
) {
  return db.claim.findFirst({
    where: { AND: [{ id }, scopeWhere] },
    include: claimDetailInclude,
  });
}

// =============================================================================
// Affiliate Queries
// =============================================================================

export async function findAffiliateById(id: string) {
  return db.affiliate.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      primaryAffiliateId: true,
      isActive: true,
    },
  });
}

// =============================================================================
// Types for Claim Creation
// =============================================================================

export interface CreateClaimData {
  clientId: string;
  affiliateId: string;
  patientId: string;
  description: string;
  createdById: string;
}

export interface CreateClaimHistoryData {
  claimId: string;
  fromStatus?: ClaimStatus;
  toStatus: ClaimStatus;
  reason?: string;
  notes?: string;
  createdById: string;
}

// =============================================================================
// Transactional Operations
// =============================================================================

export async function createClaimWithHistory(
  claimData: CreateClaimData,
  historyData: Omit<CreateClaimHistoryData, "claimId">
) {
  return db.$transaction(async (tx) => {
    const counter = await tx.globalCounter.update({
      where: { id: "claim_number" },
      data: { value: { increment: 1 } },
    });

    const claim = await tx.claim.create({
      data: {
        ...claimData,
        claimNumber: counter.value,
        status: "DRAFT",
      },
      select: { id: true, claimNumber: true },
    });

    await tx.claimHistory.create({
      data: {
        ...historyData,
        claimId: claim.id,
      },
    });

    return claim;
  });
}

// =============================================================================
// Update Operations
// =============================================================================

export async function updateClaim(id: string, data: Prisma.ClaimUpdateInput) {
  return db.claim.update({
    where: { id },
    data,
    include: claimDetailInclude,
  });
}
