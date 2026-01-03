import type { ClaimStatus } from "@prisma/client";
import { db } from "../../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface TransitionData {
  fromStatus: ClaimStatus;
  toStatus: ClaimStatus;
  reason?: string | undefined;
  notes?: string | undefined;
  userId: string;
}

// =============================================================================
// Queries
// =============================================================================

export async function findClaimById(id: string) {
  return db.claim.findUnique({
    where: { id },
  });
}

// =============================================================================
// Transactional Operations
// =============================================================================

export async function transitionClaimStatus(
  claimId: string,
  data: TransitionData
) {
  return db.$transaction(async (tx) => {
    // Conditional update for race safety
    const result = await tx.claim.updateMany({
      where: {
        id: claimId,
        status: data.fromStatus,
      },
      data: {
        status: data.toStatus,
        updatedById: data.userId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    await tx.claimHistory.create({
      data: {
        claimId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
        createdById: data.userId,
      },
    });

    return { id: claimId, status: data.toStatus };
  });
}
