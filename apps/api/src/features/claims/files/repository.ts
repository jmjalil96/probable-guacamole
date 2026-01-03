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

const fileInclude = {
  createdBy: { select: userProfileSelect },
} as const;

// =============================================================================
// Claim Queries (for validation)
// =============================================================================

export async function findClaimById(id: string) {
  return db.claim.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
}

// =============================================================================
// File Queries
// =============================================================================

export async function findFilesByClaimId(claimId: string) {
  return db.file.findMany({
    where: {
      entityType: "Claim",
      entityId: claimId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: fileInclude,
  });
}

export async function findFileById(id: string, claimId?: string) {
  return db.file.findFirst({
    where: {
      id,
      entityType: "Claim",
      deletedAt: null,
      ...(claimId && { entityId: claimId }),
    },
    include: fileInclude,
  });
}
