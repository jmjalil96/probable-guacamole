import { Router } from "express";
import {
  claimInvoiceListParamsSchema,
  claimInvoiceParamsSchema,
  createClaimInvoiceRequestSchema,
  updateClaimInvoiceRequestSchema,
  type ListClaimInvoicesResponse,
  type ClaimInvoice,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router({ mergeParams: true });

// =============================================================================
// GET / - List Invoices for a Claim
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimInvoiceListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await service.listClaimInvoices({
        claimId: req.params.id,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClaimInvoicesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:invoiceId - Get Single Invoice
// =============================================================================

router.get(
  "/:invoiceId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimInvoiceParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getClaimInvoice(
        {
          claimId: req.params.id,
          invoiceId: req.params.invoiceId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimInvoice = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Invoice
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimInvoiceListParamsSchema, body: createClaimInvoiceRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClaimInvoice(
        {
          claimId: req.params.id,
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimInvoice = result;
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:invoiceId - Update Invoice
// =============================================================================

router.patch(
  "/:invoiceId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimInvoiceParamsSchema, body: updateClaimInvoiceRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateClaimInvoice(
        {
          claimId: req.params.id,
          invoiceId: req.params.invoiceId,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimInvoice = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:invoiceId - Delete Invoice
// =============================================================================

router.delete(
  "/:invoiceId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimInvoiceParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteClaimInvoice(
        {
          claimId: req.params.id,
          invoiceId: req.params.invoiceId,
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
