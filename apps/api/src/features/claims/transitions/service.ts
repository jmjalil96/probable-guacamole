import type { ClaimStatus, ScopeType } from "@prisma/client";
import type { ClaimTransitionResponse } from "shared";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import {
  canClaimTransition,
  isClaimReasonRequired,
  getClaimInvariants,
} from "../constants.js";
import * as audit from "../../../services/audit/audit.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface TransitionClaimParams {
  claimId: string;
  targetStatus: ClaimStatus;
  reason?: string;
  notes?: string;
  user: { id: string; role: { scopeType: ScopeType } };
  requestId?: string;
}

// =============================================================================
// Service Function
// =============================================================================

export async function transitionClaim(
  params: TransitionClaimParams,
  context: audit.AuditContext
): Promise<ClaimTransitionResponse> {
  const { claimId, targetStatus, reason, notes, user, requestId } = params;
  const log = logger.child({ module: "claims/transitions", requestId });

  log.debug({ claimId, targetStatus }, "transition claim started");

  // 1. Fetch claim
  const claim = await repo.findClaimById(claimId);
  if (!claim) {
    log.debug({ claimId }, "claim not found");
    throw AppError.notFound("Claim");
  }

  const fromStatus = claim.status;

  // 2. Validate transition is allowed
  if (!canClaimTransition(fromStatus, targetStatus)) {
    log.debug({ claimId, fromStatus, targetStatus }, "invalid transition");
    throw AppError.badRequest(
      `Cannot transition from ${fromStatus} to ${targetStatus}`
    );
  }

  // 3. Validate reason if required
  if (isClaimReasonRequired(fromStatus, targetStatus) && !reason) {
    log.debug({ claimId, fromStatus, targetStatus }, "reason required");
    throw AppError.badRequest(
      `Reason required for transition from ${fromStatus} to ${targetStatus}`
    );
  }

  // 4. Validate invariants for target state
  const requiredFields = getClaimInvariants(targetStatus);
  const missingFields = requiredFields.filter(
    (field) => claim[field as keyof typeof claim] == null
  );
  if (missingFields.length > 0) {
    log.debug(
      { claimId, targetStatus, missingFields },
      "missing required fields"
    );
    throw AppError.badRequest(
      `Missing required fields for ${targetStatus}: ${missingFields.join(", ")}`
    );
  }

  // 5. Execute transition (atomic)
  const result = await repo.transitionClaimStatus(claimId, {
    fromStatus,
    toStatus: targetStatus,
    reason,
    notes,
    userId: user.id,
  });

  if (!result) {
    log.debug({ claimId }, "transition failed - concurrent modification");
    throw AppError.conflict("Claim was modified by another request");
  }

  log.info({ claimId, fromStatus, toStatus: targetStatus }, "claim transitioned");

  // 6. Audit log
  audit.log(
    {
      action: audit.AuditActions.STATUS_CHANGE,
      resource: "Claim",
      resourceId: claimId,
      oldValue: { status: fromStatus },
      newValue: { status: targetStatus },
      metadata: { reason, notes },
    },
    context
  );

  log.debug({ claimId }, "transition claim completed");

  return {
    id: claimId,
    status: targetStatus,
    previousStatus: fromStatus,
  };
}
