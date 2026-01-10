import { Router } from "express";
import {
  listInsurersQuerySchema,
  insurerParamsSchema,
  createInsurerRequestSchema,
  updateInsurerRequestSchema,
  type ListInsurersResponse,
  type Insurer,
  type CreateInsurerResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// GET / - List Insurers
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("insurers:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listInsurersQuerySchema.parse(req.query);

      const result = await service.listInsurers({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListInsurersResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Insurer
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("insurers:read"),
  validate({ params: insurerParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getInsurer(
        {
          insurerId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Insurer = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Insurer
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("insurers:create"),
  validate({ body: createInsurerRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createInsurer(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateInsurerResponse = { id: result.id };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update Insurer
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("insurers:edit"),
  validate({ params: insurerParamsSchema, body: updateInsurerRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateInsurer(
        {
          insurerId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Insurer = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:id - Delete Insurer
// =============================================================================

router.delete(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("insurers:delete"),
  validate({ params: insurerParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteInsurer(
        {
          insurerId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
