import { Router } from "express";
import {
  listClaimsQuerySchema,
  getClaimParamsSchema,
  createClaimRequestSchema,
  updateClaimRequestSchema,
  type ListClaimsResponse,
  type ClaimDetail,
  type CreateClaimResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";
import { transitionsRouter } from "./transitions/index.js";
import { claimInvoicesRouter } from "./invoices/index.js";
import { claimFilesEntityRouter } from "./files/index.js";
import { claimNotesRouter } from "./notes/index.js";
import { claimAuditTrailRouter } from "./audit-trail/index.js";
import { lookupsRouter } from "./lookups/index.js";

const router = Router();

// Mount lookup endpoints (/lookups/clients, /lookups/affiliates, etc.)
router.use("/lookups", lookupsRouter);

// Mount transition endpoints (/:id/review, /:id/submit, etc.)
router.use("/", transitionsRouter);

// Mount invoices endpoints (/:id/invoices)
router.use("/:id/invoices", claimInvoicesRouter);

// Mount files endpoints (/:id/files)
router.use("/:id/files", claimFilesEntityRouter);

// Mount notes endpoints (/:id/notes)
router.use("/:id/notes", claimNotesRouter);

// Mount audit-trail endpoints (/:id/audit-trail)
router.use("/:id/audit-trail", claimAuditTrailRouter);

// =============================================================================
// GET / - List Claims
// =============================================================================

router.get(
  "/",
  requireAuth,
  requirePermission("claims:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listClaimsQuerySchema.parse(req.query);

      const result = await service.listClaims({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClaimsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Claim
// =============================================================================

router.post(
  "/",
  requireAuth,
  requirePermission("claims:create"),
  validate({ body: createClaimRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClaim(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateClaimResponse = {
        id: result.id,
        claimNumber: result.claimNumber,
        ...(result.fileAttachmentErrors && { fileAttachmentErrors: result.fileAttachmentErrors }),
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Claim Detail
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requirePermission("claims:read"),
  validate({ params: getClaimParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getClaim(
        {
          claimId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimDetail = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update Claim
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: getClaimParamsSchema, body: updateClaimRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateClaim(
        {
          claimId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimDetail = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
