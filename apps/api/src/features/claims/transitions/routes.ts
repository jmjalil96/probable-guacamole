import { Router } from "express";
import {
  claimTransitionParamsSchema,
  claimTransitionSchema,
  claimTransitionWithReasonSchema,
  type ClaimTransitionResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// POST /:id/review - DRAFT → IN_REVIEW
// =============================================================================

router.post(
  "/:id/review",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimTransitionParamsSchema, body: claimTransitionSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "IN_REVIEW",
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/submit - IN_REVIEW → SUBMITTED
// =============================================================================

router.post(
  "/:id/submit",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimTransitionParamsSchema, body: claimTransitionSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "SUBMITTED",
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/return - IN_REVIEW → RETURNED (requires reason)
// =============================================================================

router.post(
  "/:id/return",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({
    params: claimTransitionParamsSchema,
    body: claimTransitionWithReasonSchema,
  }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { reason, notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "RETURNED",
          reason,
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/request-info - SUBMITTED → PENDING_INFO (requires reason)
// =============================================================================

router.post(
  "/:id/request-info",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({
    params: claimTransitionParamsSchema,
    body: claimTransitionWithReasonSchema,
  }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { reason, notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "PENDING_INFO",
          reason,
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/settle - SUBMITTED → SETTLED
// =============================================================================

router.post(
  "/:id/settle",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimTransitionParamsSchema, body: claimTransitionSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "SETTLED",
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/provide-info - PENDING_INFO → SUBMITTED (requires reason)
// =============================================================================

router.post(
  "/:id/provide-info",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({
    params: claimTransitionParamsSchema,
    body: claimTransitionWithReasonSchema,
  }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { reason, notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "SUBMITTED",
          reason,
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/cancel - * → CANCELLED (requires reason)
// =============================================================================

router.post(
  "/:id/cancel",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({
    params: claimTransitionParamsSchema,
    body: claimTransitionWithReasonSchema,
  }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);
      const { reason, notes } = req.body;

      const result = await service.transitionClaim(
        {
          claimId: req.params.id,
          targetStatus: "CANCELLED",
          reason,
          user: req.user!,
          ...(notes && { notes }),
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimTransitionResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
