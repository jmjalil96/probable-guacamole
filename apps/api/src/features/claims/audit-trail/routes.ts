import { Router } from "express";
import {
  claimAuditTrailParamsSchema,
  claimAuditTrailQuerySchema,
  claimHistoryQuerySchema,
  type ClaimAuditTrailResponse,
  type ClaimHistoryResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import * as service from "./service.js";

const router = Router({ mergeParams: true });

// =============================================================================
// GET / - List Audit Trail for a Claim
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimAuditTrailParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = claimAuditTrailQuerySchema.parse(req.query);

      const result = await service.getClaimAuditTrail({
        claimId: req.params.id,
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ClaimAuditTrailResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /history - List Claim History (status transitions)
// =============================================================================

router.get(
  "/history",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimAuditTrailParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = claimHistoryQuerySchema.parse(req.query);

      const result = await service.getClaimHistory({
        claimId: req.params.id,
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ClaimHistoryResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
